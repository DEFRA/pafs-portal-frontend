import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AreasCacheService, createAreasCacheService } from './areas-cache.js'

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'session.cache.ttl') return 1800000
      if (key === 'session.cache.engine') return 'redis'
      return null
    })
  }
}))

vi.mock('../../helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

const { config } = await import('../../../../config/config.js')

describe('AreasCacheService', () => {
  let mockServer
  let mockCache
  let cacheService

  beforeEach(() => {
    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      drop: vi.fn()
    }

    mockServer = {
      cache: vi.fn(() => mockCache)
    }

    vi.clearAllMocks()
  })

  describe('when caching is enabled (Redis)', () => {
    beforeEach(() => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'redis'
        if (key === 'session.cache.ttl') return 1800000
        return null
      })
      cacheService = new AreasCacheService(mockServer)
    })

    test('isCacheEnabled returns true', () => {
      expect(cacheService.isCacheEnabled()).toBe(true)
    })

    describe('generateKey', () => {
      test('generates consistent key for areas-by-type', () => {
        const key = cacheService.generateKey()
        expect(key).toBe('areas-by-type')
      })

      test('always returns same key (singleton pattern)', () => {
        const key1 = cacheService.generateKey()
        const key2 = cacheService.generateKey()
        expect(key1).toBe(key2)
      })
    })

    describe('getAreasByType', () => {
      test('returns cached areas on cache hit', async () => {
        const mockAreas = {
          EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }],
          PSO: [
            { id: '2', name: 'PSO West', area_type: 'PSO', parent_id: '1' }
          ],
          RMA: [{ id: '3', name: 'Bristol', area_type: 'RMA', parent_id: '2' }]
        }
        mockCache.get.mockResolvedValue(mockAreas)

        const result = await cacheService.getAreasByType()

        expect(result).toEqual(mockAreas)
        expect(mockCache.get).toHaveBeenCalledWith('areas-by-type')
      })

      test('returns null on cache miss', async () => {
        mockCache.get.mockResolvedValue(null)

        const result = await cacheService.getAreasByType()

        expect(result).toBeNull()
      })

      test('returns null on cache error', async () => {
        mockCache.get.mockRejectedValue(new Error('Cache error'))

        const result = await cacheService.getAreasByType()

        expect(result).toBeNull()
      })

      test('handles empty areas object', async () => {
        mockCache.get.mockResolvedValue({})

        const result = await cacheService.getAreasByType()

        expect(result).toEqual({})
      })
    })

    describe('setAreasByType', () => {
      test('stores areas in cache with no expiration by default', async () => {
        const mockAreas = {
          EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
        }

        await cacheService.setAreasByType(mockAreas)

        expect(mockCache.set).toHaveBeenCalledWith(
          'areas-by-type',
          mockAreas,
          0
        )
      })

      test('stores areas with custom TTL when provided', async () => {
        const mockAreas = {
          EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
        }
        const customTtl = 3600000

        await cacheService.setAreasByType(mockAreas, customTtl)

        expect(mockCache.set).toHaveBeenCalledWith(
          'areas-by-type',
          mockAreas,
          customTtl
        )
      })

      test('handles cache error gracefully', async () => {
        mockCache.set.mockRejectedValue(new Error('Cache error'))

        await expect(
          cacheService.setAreasByType({ EA: [] })
        ).resolves.not.toThrow()
      })

      test('caches complex area hierarchy', async () => {
        const complexAreas = {
          EA: [
            { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
            { id: '2', name: 'Thames', area_type: 'EA', parent_id: null }
          ],
          PSO: [
            { id: '3', name: 'PSO West', area_type: 'PSO', parent_id: '1' },
            { id: '4', name: 'PSO London', area_type: 'PSO', parent_id: '2' }
          ],
          RMA: [
            { id: '5', name: 'Bristol', area_type: 'RMA', parent_id: '3' },
            { id: '6', name: 'Westminster', area_type: 'RMA', parent_id: '4' }
          ]
        }

        await cacheService.setAreasByType(complexAreas)

        expect(mockCache.set).toHaveBeenCalledWith(
          'areas-by-type',
          complexAreas,
          0
        )
      })
    })

    describe('invalidateAreas', () => {
      test('drops areas cache', async () => {
        await cacheService.invalidateAreas()

        expect(mockCache.drop).toHaveBeenCalledWith('areas-by-type')
      })

      test('handles cache error gracefully', async () => {
        mockCache.drop.mockRejectedValue(new Error('Cache error'))

        await expect(cacheService.invalidateAreas()).resolves.not.toThrow()
      })
    })

    describe('cache workflow - typical usage pattern', () => {
      test('first request: cache miss, fetch from API, then cache', async () => {
        mockCache.get.mockResolvedValue(null)

        const result = await cacheService.getAreasByType()
        expect(result).toBeNull()

        const apiData = {
          EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
        }
        await cacheService.setAreasByType(apiData)

        expect(mockCache.set).toHaveBeenCalledWith('areas-by-type', apiData, 0)
      })

      test('subsequent requests: cache hit', async () => {
        const cachedAreas = {
          EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
        }
        mockCache.get.mockResolvedValue(cachedAreas)

        const result = await cacheService.getAreasByType()

        expect(result).toEqual(cachedAreas)
        expect(mockCache.set).not.toHaveBeenCalled()
      })

      test('refresh workflow: invalidate then fetch fresh', async () => {
        await cacheService.invalidateAreas()
        expect(mockCache.drop).toHaveBeenCalledWith('areas-by-type')

        mockCache.get.mockResolvedValue(null)
        const result = await cacheService.getAreasByType()
        expect(result).toBeNull()
      })
    })
  })

  describe('when caching is disabled (memory)', () => {
    beforeEach(() => {
      config.get.mockReturnValue('memory')
      cacheService = new AreasCacheService(mockServer)
    })

    test('isCacheEnabled returns false', () => {
      expect(cacheService.isCacheEnabled()).toBe(false)
    })

    test('getAreasByType returns null without calling cache', async () => {
      const result = await cacheService.getAreasByType()

      expect(result).toBeNull()
      expect(mockServer.cache).not.toHaveBeenCalled()
    })

    test('setAreasByType does nothing', async () => {
      await cacheService.setAreasByType({ EA: [] })

      expect(mockServer.cache).not.toHaveBeenCalled()
    })

    test('invalidateAreas does nothing', async () => {
      await cacheService.invalidateAreas()

      expect(mockServer.cache).not.toHaveBeenCalled()
    })
  })

  describe('createAreasCacheService', () => {
    test('creates cache service instance', () => {
      config.get.mockReturnValue('redis')
      const service = createAreasCacheService(mockServer)

      expect(service).toBeInstanceOf(AreasCacheService)
    })

    test('service has correct segment', () => {
      config.get.mockReturnValue('redis')
      const service = createAreasCacheService(mockServer)

      expect(service.segment).toBe('areas')
    })
  })
})
