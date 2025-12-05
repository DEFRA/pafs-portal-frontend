import { describe, test, expect, beforeEach, vi } from 'vitest'
import { BaseCacheService } from './base-cache-service.js'

const DEFAULT_TTL = 1800000 // 30 minutes - matches config default

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'session.cache.ttl') return 1800000
      if (key === 'session.cache.engine') return 'redis'
      return null
    })
  }
}))

vi.mock('../logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

const { config } = await import('../../../../config/config.js')

describe('BaseCacheService', () => {
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
        if (key === 'session.cache.ttl') return DEFAULT_TTL
        return null
      })
      cacheService = new BaseCacheService(mockServer, 'test-segment')
    })

    test('isCacheEnabled returns true', () => {
      expect(cacheService.isCacheEnabled()).toBe(true)
    })

    test('getCache creates cache with correct segment', () => {
      cacheService.getCache()

      expect(mockServer.cache).toHaveBeenCalledWith({
        segment: 'test-segment',
        expiresIn: DEFAULT_TTL
      })
    })

    describe('getByKey', () => {
      test('returns cached data on hit', async () => {
        const cachedData = { foo: 'bar' }
        mockCache.get.mockResolvedValue(cachedData)

        const result = await cacheService.getByKey('test-key')

        expect(result).toEqual(cachedData)
        expect(mockCache.get).toHaveBeenCalledWith('test-key')
      })

      test('returns null on cache miss', async () => {
        mockCache.get.mockResolvedValue(null)

        const result = await cacheService.getByKey('missing-key')

        expect(result).toBeNull()
      })

      test('returns null on cache error', async () => {
        mockCache.get.mockRejectedValue(new Error('Cache error'))

        const result = await cacheService.getByKey('error-key')

        expect(result).toBeNull()
      })
    })

    describe('setByKey', () => {
      test('stores data in cache with default TTL', async () => {
        const data = { test: 'data' }

        await cacheService.setByKey('test-key', data)

        expect(mockCache.set).toHaveBeenCalledWith(
          'test-key',
          data,
          DEFAULT_TTL
        )
      })

      test('stores data with custom TTL', async () => {
        const data = { test: 'data' }
        const customTtl = 60000

        await cacheService.setByKey('test-key', data, customTtl)

        expect(mockCache.set).toHaveBeenCalledWith('test-key', data, customTtl)
      })

      test('handles cache error gracefully', async () => {
        mockCache.set.mockRejectedValue(new Error('Cache error'))

        // Should not throw
        await cacheService.setByKey('test-key', { test: 'data' })
      })
    })

    describe('dropByKey', () => {
      test('drops cache for specified key', async () => {
        await cacheService.dropByKey('test-key')

        expect(mockCache.drop).toHaveBeenCalledWith('test-key')
      })

      test('handles cache error gracefully', async () => {
        mockCache.drop.mockRejectedValue(new Error('Cache error'))

        // Should not throw
        await cacheService.dropByKey('test-key')
      })
    })

    describe('invalidateAll', () => {
      test('drops all cache by segment pattern', async () => {
        await cacheService.invalidateAll()

        expect(mockCache.drop).toHaveBeenCalledWith('*')
      })
    })

    describe('get', () => {
      test('uses generateKey to create cache key', async () => {
        mockCache.get.mockResolvedValue(null)

        await cacheService.get({ foo: 'bar' })

        expect(mockCache.get).toHaveBeenCalledWith('{"foo":"bar"}')
      })
    })

    describe('set', () => {
      test('uses generateKey to create cache key', async () => {
        await cacheService.set({ foo: 'bar' }, { data: 'test' })

        expect(mockCache.set).toHaveBeenCalledWith(
          '{"foo":"bar"}',
          { data: 'test' },
          DEFAULT_TTL
        )
      })
    })

    describe('drop', () => {
      test('uses generateKey to create cache key for drop', async () => {
        await cacheService.drop({ foo: 'bar' })

        expect(mockCache.drop).toHaveBeenCalledWith('{"foo":"bar"}')
      })
    })

    describe('invalidateAll', () => {
      test('drops all cache by segment pattern', async () => {
        await cacheService.invalidateAll()

        expect(mockCache.drop).toHaveBeenCalledWith('*')
      })

      test('handles error gracefully', async () => {
        mockCache.drop.mockRejectedValue(new Error('Cache error'))

        // Should not throw
        await cacheService.invalidateAll()
      })
    })
  })

  describe('when caching is disabled (memory)', () => {
    beforeEach(() => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'memory'
        if (key === 'session.cache.ttl') return DEFAULT_TTL
        return null
      })
      cacheService = new BaseCacheService(mockServer, 'test-segment')
    })

    test('isCacheEnabled returns false', () => {
      expect(cacheService.isCacheEnabled()).toBe(false)
    })

    test('getByKey returns null without calling cache', async () => {
      const result = await cacheService.getByKey('test-key')

      expect(result).toBeNull()
      expect(mockServer.cache).not.toHaveBeenCalled()
    })

    test('setByKey does nothing', async () => {
      await cacheService.setByKey('test-key', { data: 'test' })

      // No error should be thrown and cache not called
      expect(mockCache.set).not.toHaveBeenCalled()
    })

    test('dropByKey does nothing', async () => {
      await cacheService.dropByKey('test-key')

      expect(mockCache.drop).not.toHaveBeenCalled()
    })

    test('invalidateAll does nothing when disabled', async () => {
      await cacheService.invalidateAll()

      expect(mockServer.cache).not.toHaveBeenCalled()
    })
  })

  describe('custom TTL', () => {
    test('uses custom TTL when provided', () => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'redis'
        if (key === 'session.cache.ttl') return DEFAULT_TTL
        return null
      })
      const customTtl = 30000
      const service = new BaseCacheService(
        mockServer,
        'test-segment',
        customTtl
      )

      service.getCache()

      expect(mockServer.cache).toHaveBeenCalledWith({
        segment: 'test-segment',
        expiresIn: customTtl
      })
    })
  })

  describe('segment configuration', () => {
    test('uses provided segment name', () => {
      config.get.mockImplementation((key) => {
        if (key === 'session.cache.engine') return 'redis'
        if (key === 'session.cache.ttl') return DEFAULT_TTL
        return null
      })
      const service = new BaseCacheService(mockServer, 'custom-segment')

      service.getCache()

      expect(mockServer.cache).toHaveBeenCalledWith({
        segment: 'custom-segment',
        expiresIn: DEFAULT_TTL
      })
    })
  })
})
