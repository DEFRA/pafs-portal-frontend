import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  AccountsCacheService,
  createAccountsCacheService
} from './accounts-cache.js'

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

vi.mock('../../helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

const { config } = await import('../../../../config/config.js')

describe('AccountsCacheService', () => {
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
      cacheService = new AccountsCacheService(mockServer)
    })

    test('isCacheEnabled returns true', () => {
      expect(cacheService.isCacheEnabled()).toBe(true)
    })

    describe('generateKey', () => {
      test('generates key from parameters', () => {
        const key = cacheService.generateKey({
          status: 'pending',
          search: 'john',
          areaId: '5',
          page: 2
        })

        expect(key).toBe('pending:john:5:2')
      })

      test('handles missing optional parameters', () => {
        const key = cacheService.generateKey({
          status: 'active'
        })

        expect(key).toBe('active:::1')
      })
    })

    describe('generateAccountKey', () => {
      test('generates key for single account', () => {
        const key = cacheService.generateAccountKey(123)

        expect(key).toBe('account:123')
      })
    })

    describe('getByKey', () => {
      test('returns cached data on hit', async () => {
        const cachedData = { data: [{ id: 1 }] }
        mockCache.get.mockResolvedValue(cachedData)

        const result = await cacheService.getByKey('pending:::1')

        expect(result).toEqual(cachedData)
        expect(mockCache.get).toHaveBeenCalledWith('pending:::1')
      })

      test('returns null on cache miss', async () => {
        mockCache.get.mockResolvedValue(null)

        const result = await cacheService.getByKey('pending:::1')

        expect(result).toBeNull()
      })

      test('returns null on cache error', async () => {
        mockCache.get.mockRejectedValue(new Error('Cache error'))

        const result = await cacheService.getByKey('pending:::1')

        expect(result).toBeNull()
      })
    })

    describe('setByKey', () => {
      test('stores data in cache with correct TTL', async () => {
        const data = { data: [{ id: 1 }] }

        await cacheService.setByKey('pending:::1', data)

        expect(mockCache.set).toHaveBeenCalledWith(
          'pending:::1',
          data,
          DEFAULT_TTL
        )
      })

      test('handles cache error gracefully', async () => {
        mockCache.set.mockRejectedValue(new Error('Cache error'))

        // Should not throw
        await cacheService.setByKey('pending:::1', { data: [] })
      })
    })

    describe('dropByKey', () => {
      test('drops cache for specified key', async () => {
        await cacheService.dropByKey('pending:*')

        expect(mockCache.drop).toHaveBeenCalledWith('pending:*')
      })

      test('handles cache error gracefully', async () => {
        mockCache.drop.mockRejectedValue(new Error('Cache error'))

        // Should not throw
        await cacheService.dropByKey('pending:*')
      })
    })

    describe('invalidateByStatus', () => {
      test('drops all cache (not just specified status)', async () => {
        await cacheService.invalidateByStatus('pending')

        expect(mockCache.drop).toHaveBeenCalledWith('*')
      })
    })

    describe('addToList', () => {
      test('invalidates all cache when adding account to list', async () => {
        const account = { id: 1, status: 'pending' }

        await cacheService.addToList(account, { status: 'pending' })

        expect(mockCache.drop).toHaveBeenCalledWith('*')
      })
    })

    describe('removeFromList', () => {
      test('invalidates all cache and drops account key', async () => {
        await cacheService.removeFromList(1, 'pending')

        expect(mockCache.drop).toHaveBeenCalledWith('*')
        expect(mockCache.drop).toHaveBeenCalledWith('account:1')
      })
    })

    describe('getAccount', () => {
      test('returns cached account on hit', async () => {
        const account = { id: 1, firstName: 'John' }
        mockCache.get.mockResolvedValue(account)

        const result = await cacheService.getAccount(1)

        expect(result).toEqual(account)
        expect(mockCache.get).toHaveBeenCalledWith('account:1')
      })
    })

    describe('setAccount', () => {
      test('caches single account', async () => {
        const account = { id: 1, firstName: 'John' }

        await cacheService.setAccount(1, account)

        expect(mockCache.set).toHaveBeenCalledWith(
          'account:1',
          account,
          DEFAULT_TTL
        )
      })
    })

    describe('invalidateAccount', () => {
      test('invalidates account and all list caches', async () => {
        await cacheService.invalidateAccount(1)

        expect(mockCache.drop).toHaveBeenCalledWith('account:1')
      })
    })

    describe('updateAccount', () => {
      test('updates account and invalidates all cache', async () => {
        const account = { id: 1, status: 'active' }

        await cacheService.updateAccount(1, account)

        expect(mockCache.set).toHaveBeenCalledWith(
          'account:1',
          account,
          DEFAULT_TTL
        )
        expect(mockCache.drop).toHaveBeenCalledWith('*')
      })

      test('invalidates all cache twice when status changes', async () => {
        const account = { id: 1, status: 'active' }

        await cacheService.updateAccount(1, account, 'pending')

        // Called twice because both new and old status trigger invalidateAll
        expect(mockCache.drop).toHaveBeenCalledWith('*')
        expect(mockCache.drop).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('when caching is disabled (memory)', () => {
    beforeEach(() => {
      config.get.mockReturnValue('memory')
      cacheService = new AccountsCacheService(mockServer)
    })

    test('isCacheEnabled returns false', () => {
      expect(cacheService.isCacheEnabled()).toBe(false)
    })

    test('getByKey returns null without calling cache', async () => {
      const result = await cacheService.getByKey('pending:::1')

      expect(result).toBeNull()
      expect(mockServer.cache).not.toHaveBeenCalled()
    })

    test('setByKey does nothing', async () => {
      await cacheService.setByKey('pending:::1', { data: [] })

      expect(mockServer.cache).not.toHaveBeenCalled()
    })

    test('invalidateByStatus does nothing', async () => {
      await cacheService.invalidateByStatus('pending')

      expect(mockServer.cache).not.toHaveBeenCalled()
    })
  })

  describe('createAccountsCacheService', () => {
    test('creates cache service instance', () => {
      config.get.mockReturnValue('redis')
      const service = createAccountsCacheService(mockServer)

      expect(service).toBeInstanceOf(AccountsCacheService)
    })
  })
})
