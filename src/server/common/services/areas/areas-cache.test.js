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
  let mockSegment
  let cacheService

  beforeEach(() => {
    mockSegment = {
      keys: vi.fn(),
      drop: vi.fn()
    }

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      drop: vi.fn(),
      segment: vi.fn(() => mockSegment)
    }

    mockServer = {
      cache: vi.fn(() => mockCache),
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
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
        const key = cacheService.generateKey('areas-by-type')
        expect(key).toBe('areas-by-type')
      })

      test('always returns same key (singleton pattern)', () => {
        const key1 = cacheService.generateKey('areas-by-type')
        const key2 = cacheService.generateKey('areas-by-type')
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

    describe('invalidateAreasByType', () => {
      test('drops areas cache', async () => {
        await cacheService.invalidateAreasByType()

        expect(mockCache.drop).toHaveBeenCalledWith('areas-by-type')
      })

      test('handles cache error gracefully', async () => {
        mockCache.drop.mockRejectedValue(new Error('Cache error'))

        await expect(
          cacheService.invalidateAreasByType()
        ).resolves.not.toThrow()
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
        await cacheService.invalidateAreasByType()
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

    test('invalidateAreasByType does nothing', async () => {
      await cacheService.invalidateAreasByType()

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

  describe('areas-by-list caching', () => {
    beforeEach(() => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'redis'
        if (key === 'session.cache.ttl') return 1800000
        return null
      })
      cacheService = new AreasCacheService(mockServer)
    })

    describe('generateListKey', () => {
      test('generates key with all parameters', () => {
        const params = {
          search: 'Bristol',
          type: 'RMA',
          page: 2,
          pageSize: 20
        }
        const key = cacheService.generateListKey(params)

        expect(key).toBe(
          'areas-by-list:search=Bristol:type=RMA:page=2:pageSize=20'
        )
      })

      test('generates key with default parameters', () => {
        const key = cacheService.generateListKey({})

        expect(key).toBe('areas-by-list:search=:type=:page=1:pageSize=10')
      })

      test('generates key with partial parameters', () => {
        const params = {
          search: 'Thames',
          page: 3
        }
        const key = cacheService.generateListKey(params)

        expect(key).toBe('areas-by-list:search=Thames:type=:page=3:pageSize=10')
      })

      test('handles empty strings', () => {
        const params = {
          search: '',
          type: '',
          page: 1,
          pageSize: 10
        }
        const key = cacheService.generateListKey(params)

        expect(key).toBe('areas-by-list:search=:type=:page=1:pageSize=10')
      })
    })

    describe('getAreasByList', () => {
      test('returns cached list when available', async () => {
        const params = {
          search: 'Bristol',
          type: 'RMA',
          page: 1,
          pageSize: 10
        }
        const cachedData = {
          areas: [{ id: '1', name: 'Bristol Council' }],
          total: 1,
          page: 1,
          pagination: 10
        }

        mockCache.get.mockResolvedValue(cachedData)

        const result = await cacheService.getAreasByList(params)

        expect(result).toEqual(cachedData)
        expect(mockCache.get).toHaveBeenCalledWith(
          'areas-by-list:search=Bristol:type=RMA:page=1:pageSize=10'
        )
      })

      test('returns null when cache miss', async () => {
        const params = { search: 'Thames', type: 'EA', page: 1, pagination: 10 }
        mockCache.get.mockResolvedValue(null)

        const result = await cacheService.getAreasByList(params)

        expect(result).toBeNull()
      })
    })

    describe('setAreasByList', () => {
      test('caches list data with parameters', async () => {
        const params = {
          search: 'Bristol',
          type: 'RMA',
          page: 1,
          pagination: 10
        }
        const data = {
          areas: [{ id: '1', name: 'Bristol Council' }],
          total: 1
        }

        await cacheService.setAreasByList(params, data)

        expect(mockCache.set).toHaveBeenCalledWith(
          'areas-by-list:search=Bristol:type=RMA:page=1:pageSize=10',
          data,
          0
        )
      })

      test('caches list data with custom TTL', async () => {
        const params = { search: '', type: '', page: 1, pagination: 10 }
        const data = { areas: [], total: 0 }
        const customTtl = 3600000

        await cacheService.setAreasByList(params, data, customTtl)

        expect(mockCache.set).toHaveBeenCalledWith(
          'areas-by-list:search=:type=:page=1:pageSize=10',
          data,
          customTtl
        )
      })
    })

    describe('invalidateAreasByList', () => {
      test('drops all tracked list cache keys', async () => {
        cacheService = new AreasCacheService(mockServer)

        // Add list keys to registry
        await cacheService.setAreasByList(
          { search: '', type: '', page: 1, pageSize: 10 },
          []
        )
        await cacheService.setAreasByList(
          { search: 'test', type: 'EA', page: 1, pageSize: 10 },
          []
        )

        await cacheService.invalidateAreasByList()

        expect(mockCache.drop).toHaveBeenCalledWith(
          'areas-by-list:search=:type=:page=1:pageSize=10'
        )
        expect(mockCache.drop).toHaveBeenCalledWith(
          'areas-by-list:search=test:type=EA:page=1:pageSize=10'
        )
        expect(cacheService.cacheKeys.size).toBe(0)
      })
    })

    describe('generateAreaKey', () => {
      test('generates key with area- prefix', () => {
        const key = cacheService.generateAreaKey('123')
        expect(key).toBe('area-123')
      })

      test('handles string IDs', () => {
        const key = cacheService.generateAreaKey('abc-def')
        expect(key).toBe('area-abc-def')
      })
    })

    describe('getAreaFromCachedList', () => {
      test('returns area when found in cache', async () => {
        const areaId = '123'
        const cachedArea = {
          id: '123',
          name: 'Bristol Council',
          area_type: 'RMA'
        }
        mockCache.get.mockResolvedValue(cachedArea)
        mockServer.logger = {
          debug: vi.fn(),
          warn: vi.fn()
        }
        cacheService = new AreasCacheService(mockServer)

        const result = await cacheService.getAreaFromCachedList(areaId)

        expect(result).toEqual(cachedArea)
        expect(mockCache.get).toHaveBeenCalledWith('area-123')
        expect(mockServer.logger.debug).toHaveBeenCalledWith(
          { areaId: '123' },
          'Area found in cache'
        )
      })

      test('returns null when area not in cache', async () => {
        mockCache.get.mockResolvedValue(null)
        mockServer.logger = {
          debug: vi.fn(),
          warn: vi.fn()
        }
        cacheService = new AreasCacheService(mockServer)

        const result = await cacheService.getAreaFromCachedList('456')

        expect(result).toBeNull()
        expect(mockCache.get).toHaveBeenCalledWith('area-456')
        expect(mockServer.logger.debug).toHaveBeenCalledWith(
          { areaId: '456' },
          'Area not found in cache'
        )
      })

      test('returns null when cache not enabled', async () => {
        config.get.mockImplementation((key) => {
          if (key === 'session.cache.engine') return 'memory'
          return null
        })
        cacheService = new AreasCacheService(mockServer)

        const result = await cacheService.getAreaFromCachedList('123')

        expect(result).toBeNull()
      })

      test('returns null for empty area ID', async () => {
        const result = await cacheService.getAreaFromCachedList('')

        expect(result).toBeNull()
      })

      test('handles error gracefully', async () => {
        // Base class getByKey catches errors and returns null
        // So getAreaFromCachedList will return null without throwing
        const error = new Error('Cache read failed')
        mockCache.get.mockRejectedValue(error)
        mockServer.logger = {
          debug: vi.fn(),
          warn: vi.fn()
        }
        cacheService = new AreasCacheService(mockServer)

        const result = await cacheService.getAreaFromCachedList('123')

        expect(result).toBeNull()
        // The base class logger handles the error
      })
    })

    describe('setAreaInCache', () => {
      test('caches area with area- prefix key', async () => {
        const areaId = '123'
        const areaData = { id: '123', name: 'Bristol Council' }
        mockServer.logger = {
          debug: vi.fn(),
          warn: vi.fn()
        }
        cacheService = new AreasCacheService(mockServer)

        await cacheService.setAreaInCache(areaId, areaData)

        expect(mockCache.set).toHaveBeenCalledWith('area-123', areaData, 0)
        expect(mockServer.logger.debug).toHaveBeenCalledWith(
          { areaId: '123' },
          'Area cached successfully'
        )
      })

      test('uses custom TTL when provided', async () => {
        const areaData = { id: '456', name: 'Thames' }
        const customTtl = 3600000
        mockServer.logger = {
          debug: vi.fn(),
          warn: vi.fn()
        }
        cacheService = new AreasCacheService(mockServer)

        await cacheService.setAreaInCache('456', areaData, customTtl)

        expect(mockCache.set).toHaveBeenCalledWith(
          'area-456',
          areaData,
          customTtl
        )
      })

      test('does nothing when cache not enabled', async () => {
        config.get.mockImplementation((key) => {
          if (key === 'session.cache.engine') return 'memory'
          return null
        })
        cacheService = new AreasCacheService(mockServer)

        await cacheService.setAreaInCache('123', { id: '123' })

        expect(mockServer.cache).not.toHaveBeenCalled()
      })

      test('does nothing for empty area ID', async () => {
        await cacheService.setAreaInCache('', { id: '' })

        expect(mockServer.cache).not.toHaveBeenCalled()
      })

      test('handles error gracefully', async () => {
        // Base class setByKey catches errors and doesn't throw
        // So setAreaInCache will complete without throwing
        const error = new Error('Cache write failed')
        mockCache.set.mockRejectedValue(error)
        mockServer.logger = {
          debug: vi.fn(),
          warn: vi.fn()
        }
        cacheService = new AreasCacheService(mockServer)

        // Should not throw - base class handles the error
        await expect(
          cacheService.setAreaInCache('123', { id: '123' })
        ).resolves.toBeUndefined()
      })
    })
  })

  describe('when caching disabled for areas-by-list', () => {
    beforeEach(() => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'memory'
        return null
      })
      cacheService = new AreasCacheService(mockServer)
    })

    test('invalidateAreasByList does nothing', async () => {
      await cacheService.invalidateAreasByList()

      expect(mockServer.cache).not.toHaveBeenCalled()
    })

    test('getAreaFromCachedList returns null', async () => {
      const result = await cacheService.getAreaFromCachedList('123')

      expect(result).toBeNull()
    })
  })

  describe('invalidateIndividualAreas', () => {
    beforeEach(() => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'redis'
        if (key === 'session.cache.ttl') return 1800000
        return null
      })
      cacheService = new AreasCacheService(mockServer)
    })

    test('drops all tracked individual area keys', async () => {
      // Add individual area keys to registry
      await cacheService.setAreaInCache('123', { id: '123' })
      await cacheService.setAreaInCache('456', { id: '456' })

      await cacheService.invalidateIndividualAreas()

      expect(mockCache.drop).toHaveBeenCalledWith('area-123')
      expect(mockCache.drop).toHaveBeenCalledWith('area-456')
      expect(cacheService.cacheKeys.size).toBe(0)
    })

    test('does nothing when caching disabled', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'memory'
        return null
      })
      cacheService = new AreasCacheService(mockServer)

      await cacheService.invalidateIndividualAreas()

      expect(mockServer.cache).not.toHaveBeenCalled()
    })
  })

  describe('invalidateAllAreasCache', () => {
    beforeEach(() => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'redis'
        if (key === 'session.cache.ttl') return 1800000
        return null
      })
      cacheService = new AreasCacheService(mockServer)
    })

    test('drops all tracked cache keys when called', async () => {
      // Add some keys to the registry
      await cacheService.setAreasByType({ EA: [], PSO: [], RMA: [] })
      await cacheService.setAreasByList(
        { search: '', type: '', page: 1, pageSize: 10 },
        []
      )
      await cacheService.setAreaInCache('123', { id: '123', name: 'Test' })

      expect(cacheService.cacheKeys.size).toBe(3)

      await cacheService.invalidateAllAreasCache()

      // Verify all keys were dropped
      expect(mockCache.drop).toHaveBeenCalledTimes(3)
      expect(mockCache.drop).toHaveBeenCalledWith('areas-by-type')
      expect(mockCache.drop).toHaveBeenCalledWith(
        'areas-by-list:search=:type=:page=1:pageSize=10'
      )
      expect(mockCache.drop).toHaveBeenCalledWith('area-123')

      // Verify registry was cleared
      expect(cacheService.cacheKeys.size).toBe(0)
    })

    test('handles empty cache registry gracefully', async () => {
      // No keys added to registry
      expect(cacheService.cacheKeys.size).toBe(0)

      await cacheService.invalidateAllAreasCache()

      // Should not attempt to drop any keys
      expect(mockCache.drop).not.toHaveBeenCalled()
      expect(mockServer.logger.debug).toHaveBeenCalledWith(
        'No tracked cache keys to drop'
      )
    })

    test('handles drop errors gracefully (base class catches them)', async () => {
      const error = new Error('Drop failed')
      await cacheService.setAreasByType({ EA: [] })

      mockCache.drop.mockRejectedValue(error)

      // Base class dropByKey catches errors and logs warnings, doesn't throw
      // So invalidateAllAreasCache completes successfully
      await expect(
        cacheService.invalidateAllAreasCache()
      ).resolves.toBeUndefined()

      // Verify registry was still cleared even though drop failed
      expect(cacheService.cacheKeys.size).toBe(0)
    })

    test('tracks multiple keys of different types', async () => {
      // Add various types of keys
      await cacheService.setAreasByType({ EA: [] })
      await cacheService.setAreasByList(
        { search: 'test', type: 'EA', page: 1, pageSize: 10 },
        []
      )
      await cacheService.setAreasByList(
        { search: '', type: 'PSO', page: 2, pageSize: 20 },
        []
      )
      await cacheService.setAreaInCache('1', { id: '1' })
      await cacheService.setAreaInCache('2', { id: '2' })
      await cacheService.setAreaInCache('3', { id: '3' })

      expect(cacheService.cacheKeys.size).toBe(6)

      await cacheService.invalidateAllAreasCache()

      expect(mockCache.drop).toHaveBeenCalledTimes(6)
      expect(cacheService.cacheKeys.size).toBe(0)
    })

    test('does nothing when caching disabled', async () => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'memory'
        return null
      })
      cacheService = new AreasCacheService(mockServer)

      await cacheService.invalidateAllAreasCache()

      expect(mockServer.cache).not.toHaveBeenCalled()
    })
  })
})
