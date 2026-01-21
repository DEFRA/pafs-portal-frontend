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
      if (key === 'pagination.defaultPageSize') return 25
      return null
    })
  }
}))

vi.mock('../../helpers/logging/logger.js', () => {
  // Need to define the logger instance inside the factory
  const logger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
  return {
    createLogger: () => logger
  }
})

vi.mock('../../helpers/pagination/index.js', () => ({
  getDefaultPageSize: vi.fn(() => 25)
}))

const { config } = await import('../../../../config/config.js')
const { createLogger } = await import('../../helpers/logging/logger.js')
// Get the logger instance that will be used by base-cache-service
const baseLogger = createLogger()

describe('AccountsCacheService', () => {
  let mockServer
  let mockCache
  let cacheService

  beforeEach(() => {
    vi.clearAllMocks()

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      drop: vi.fn()
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

    describe('generateAccountKey', () => {
      test('generates key for single account', () => {
        const key = cacheService.generateAccountKey(123)

        expect(key).toBe('account:123')
      })
    })

    describe('generateListKey', () => {
      test('generates key for list metadata', () => {
        const params = {
          status: 'pending',
          search: 'test',
          areaId: '1',
          page: 2,
          pageSize: 50
        }
        const key = cacheService.generateListKey(params)

        expect(key).toBe('list:pending:test:1:2:50')
      })

      test('handles default values', () => {
        const params = { status: 'active' }
        const key = cacheService.generateListKey(params)

        // Default page size comes from config (25)
        expect(key).toBe('list:active:::1:25')
      })
    })

    describe('invalidateAll', () => {
      test('drops common cache keys for all statuses', async () => {
        await cacheService.invalidateAll()

        // Should drop list cache for pending and active (first page with default page size)
        expect(mockCache.drop).toHaveBeenCalledWith('list:pending:::1:25')
        expect(mockCache.drop).toHaveBeenCalledWith('list:active:::1:25')

        // Should drop count cache for pending and active
        expect(mockCache.drop).toHaveBeenCalledWith('count:pending')
        expect(mockCache.drop).toHaveBeenCalledWith('count:active')

        // Should be called 4 times total
        expect(mockCache.drop).toHaveBeenCalledTimes(4)
      })

      test('does nothing when cache is disabled', async () => {
        config.get.mockReturnValue('memory')
        const disabledService = new AccountsCacheService(mockServer)

        await disabledService.invalidateAll()

        expect(mockCache.drop).not.toHaveBeenCalled()
      })

      test('logs error and continues on cache drop failure', async () => {
        mockCache.drop.mockRejectedValue(new Error('Cache error'))

        await cacheService.invalidateAll()

        expect(baseLogger.warn).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.any(Error),
            segment: 'accounts'
          }),
          'Failed to drop cache key'
        )
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

    describe('setListMetadata', () => {
      test('caches list metadata with timestamp', async () => {
        const params = { status: 'pending', page: 1, pageSize: 25 }
        const accountIds = [1, 2, 3]
        const pagination = { total: 3, page: 1, pageSize: 25 }

        await cacheService.setListMetadata(params, accountIds, pagination)

        expect(mockCache.set).toHaveBeenCalledWith(
          'list:pending:::1:25',
          expect.objectContaining({
            accountIds,
            pagination,
            timestamp: expect.any(Number)
          }),
          DEFAULT_TTL
        )
      })

      test('does nothing when cache disabled', async () => {
        config.get.mockReturnValue('memory')
        const disabledService = new AccountsCacheService(mockServer)

        await disabledService.setListMetadata({}, [], {})

        expect(mockCache.set).not.toHaveBeenCalled()
      })
    })

    describe('getListMetadata', () => {
      test('returns cached list metadata', async () => {
        const params = { status: 'pending', page: 1, pageSize: 25 }
        const metadata = {
          accountIds: [1, 2],
          pagination: {},
          timestamp: Date.now()
        }
        mockCache.get.mockResolvedValue(metadata)

        const result = await cacheService.getListMetadata(params)

        expect(result).toEqual(metadata)
        expect(mockCache.get).toHaveBeenCalledWith('list:pending:::1:25')
      })

      test('returns null when not cached', async () => {
        const params = { status: 'active', page: 2, pageSize: 50 }
        mockCache.get.mockResolvedValue(null)

        const result = await cacheService.getListMetadata(params)

        expect(result).toBeNull()
      })
    })

    describe('getAccountsByIds', () => {
      test('returns array of cached accounts', async () => {
        const account1 = { id: 1, firstName: 'John' }
        const account2 = { id: 2, firstName: 'Jane' }
        mockCache.get
          .mockResolvedValueOnce(account1)
          .mockResolvedValueOnce(account2)

        const result = await cacheService.getAccountsByIds([1, 2])

        expect(result).toEqual([account1, account2])
        expect(mockCache.get).toHaveBeenCalledWith('account:1')
        expect(mockCache.get).toHaveBeenCalledWith('account:2')
      })

      test('returns null for cache misses', async () => {
        mockCache.get
          .mockResolvedValueOnce({ id: 1 })
          .mockResolvedValueOnce(null)

        const result = await cacheService.getAccountsByIds([1, 2])

        expect(result).toEqual([{ id: 1 }, null])
      })

      test('returns empty array when cache disabled', async () => {
        config.get.mockReturnValue('memory')
        const disabledService = new AccountsCacheService(mockServer)

        const result = await disabledService.getAccountsByIds([1, 2, 3])

        expect(result).toEqual([])
      })

      test('returns empty array when ids is empty', async () => {
        const result = await cacheService.getAccountsByIds([])

        expect(result).toEqual([])
      })

      test('returns empty array when ids is null', async () => {
        const result = await cacheService.getAccountsByIds(null)

        expect(result).toEqual([])
      })
    })

    describe('setAccounts', () => {
      test('caches multiple accounts', async () => {
        const accounts = [
          { id: 1, firstName: 'John' },
          { id: 2, firstName: 'Jane' }
        ]

        await cacheService.setAccounts(accounts)

        expect(mockCache.set).toHaveBeenCalledWith(
          'account:1',
          accounts[0],
          DEFAULT_TTL
        )
        expect(mockCache.set).toHaveBeenCalledWith(
          'account:2',
          accounts[1],
          DEFAULT_TTL
        )
      })

      test('handles accounts with userId field', async () => {
        const accounts = [{ userId: 123, firstName: 'John' }]

        await cacheService.setAccounts(accounts)

        expect(mockCache.set).toHaveBeenCalledWith(
          'account:123',
          accounts[0],
          DEFAULT_TTL
        )
      })

      test('skips accounts without id or userId', async () => {
        const accounts = [{ firstName: 'John' }, { id: 2, firstName: 'Jane' }]

        await cacheService.setAccounts(accounts)

        expect(mockCache.set).toHaveBeenCalledTimes(1)
        expect(mockCache.set).toHaveBeenCalledWith(
          'account:2',
          accounts[1],
          DEFAULT_TTL
        )
      })

      test('does nothing when cache disabled', async () => {
        config.get.mockReturnValue('memory')
        const disabledService = new AccountsCacheService(mockServer)

        await disabledService.setAccounts([{ id: 1 }])

        expect(mockCache.set).not.toHaveBeenCalled()
      })

      test('does nothing when accounts is empty', async () => {
        await cacheService.setAccounts([])

        expect(mockCache.set).not.toHaveBeenCalled()
      })

      test('does nothing when accounts is null', async () => {
        await cacheService.setAccounts(null)

        expect(mockCache.set).not.toHaveBeenCalled()
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
  })

  describe('createAccountsCacheService', () => {
    test('creates cache service instance', () => {
      config.get.mockReturnValue('redis')
      const service = createAccountsCacheService(mockServer)

      expect(service).toBeInstanceOf(AccountsCacheService)
    })
  })
})
