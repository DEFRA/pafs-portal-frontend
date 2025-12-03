import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getAccounts,
  getPendingCount,
  getActiveCount
} from './accounts-service.js'

vi.mock('../../helpers/api-client.js')

const { apiRequest } = await import('../../helpers/api-client.js')

describe('Accounts Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAccounts', () => {
    test('calls API with correct URL and parameters', async () => {
      apiRequest.mockResolvedValue({ success: true, data: {} })

      await getAccounts({
        status: 'pending',
        search: 'john',
        areaId: '5',
        page: 2,
        pageSize: 20,
        accessToken: 'test-token'
      })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/accounts?'),
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer test-token' }
        })
      )

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).toContain('status=pending')
      expect(calledUrl).toContain('search=john')
      expect(calledUrl).toContain('areaId=5')
      expect(calledUrl).toContain('page=2')
      expect(calledUrl).toContain('pageSize=20')
    })

    test('omits empty search parameter', async () => {
      apiRequest.mockResolvedValue({ success: true, data: {} })

      await getAccounts({
        status: 'pending',
        search: '',
        page: 1,
        pageSize: 20
      })

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).not.toContain('search=')
    })

    test('omits empty areaId parameter', async () => {
      apiRequest.mockResolvedValue({ success: true, data: {} })

      await getAccounts({
        status: 'pending',
        areaId: '',
        page: 1,
        pageSize: 20
      })

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).not.toContain('areaId=')
    })

    test('trims search parameter', async () => {
      apiRequest.mockResolvedValue({ success: true, data: {} })

      await getAccounts({
        status: 'pending',
        search: '  john  ',
        page: 1,
        pageSize: 20
      })

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).toContain('search=john')
    })

    test('uses default pagination when not provided', async () => {
      apiRequest.mockResolvedValue({ success: true, data: {} })

      await getAccounts({ status: 'pending' })

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).toContain('page=1')
      expect(calledUrl).toContain('pageSize=20')
    })

    test('does not include authorization header when no token', async () => {
      apiRequest.mockResolvedValue({ success: true, data: {} })

      await getAccounts({ status: 'pending' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('returns API response', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [{ id: 1, email: 'test@example.com' }],
          pagination: { page: 1, total: 1 }
        }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await getAccounts({ status: 'pending' })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('getPendingCount', () => {
    test('fetches pending accounts with minimal page size', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { total: 15 }
        }
      })

      const count = await getPendingCount('test-token')

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).toContain('status=pending')
      expect(calledUrl).toContain('page=1')
      expect(calledUrl).toContain('pageSize=1')
      expect(count).toBe(15)
    })

    test('returns 0 on API failure', async () => {
      apiRequest.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'ERROR' }]
      })

      const count = await getPendingCount('test-token')

      expect(count).toBe(0)
    })

    test('returns 0 when pagination data is missing', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: {}
      })

      const count = await getPendingCount('test-token')

      expect(count).toBe(0)
    })
  })

  describe('getActiveCount', () => {
    test('fetches active accounts with minimal page size', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: {
          data: [],
          pagination: { total: 25 }
        }
      })

      const count = await getActiveCount('test-token')

      const calledUrl = apiRequest.mock.calls[0][0]
      expect(calledUrl).toContain('status=active')
      expect(calledUrl).toContain('page=1')
      expect(calledUrl).toContain('pageSize=1')
      expect(count).toBe(25)
    })

    test('returns 0 on API failure', async () => {
      apiRequest.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'ERROR' }]
      })

      const count = await getActiveCount('test-token')

      expect(count).toBe(0)
    })
  })

  describe('caching', () => {
    let mockCacheService

    beforeEach(() => {
      mockCacheService = {
        get: vi.fn(),
        set: vi.fn(),
        getByKey: vi.fn(),
        setByKey: vi.fn()
      }
    })

    describe('getAccounts with cache', () => {
      test('returns cached data when available', async () => {
        const cachedResponse = {
          success: true,
          data: { data: [{ id: 1 }], pagination: { total: 1 } }
        }
        mockCacheService.get.mockResolvedValue(cachedResponse)

        const result = await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(result).toEqual(cachedResponse)
        expect(mockCacheService.get).toHaveBeenCalledWith({
          status: 'pending',
          search: '',
          areaId: '',
          page: 1
        })
        expect(apiRequest).not.toHaveBeenCalled()
      })

      test('fetches from API on cache miss', async () => {
        mockCacheService.get.mockResolvedValue(null)
        const apiResponse = {
          success: true,
          data: { data: [{ id: 1 }], pagination: { total: 1 } }
        }
        apiRequest.mockResolvedValue(apiResponse)

        const result = await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(result).toEqual(apiResponse)
        expect(apiRequest).toHaveBeenCalled()
      })

      test('caches successful API response', async () => {
        mockCacheService.get.mockResolvedValue(null)
        const apiResponse = {
          success: true,
          data: { data: [{ id: 1 }], pagination: { total: 1 } }
        }
        apiRequest.mockResolvedValue(apiResponse)

        await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(mockCacheService.set).toHaveBeenCalledWith(
          { status: 'pending', search: '', areaId: '', page: 1 },
          apiResponse
        )
      })

      test('does not cache failed API response', async () => {
        mockCacheService.get.mockResolvedValue(null)
        apiRequest.mockResolvedValue({
          success: false,
          errors: [{ errorCode: 'ERROR' }]
        })

        await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(mockCacheService.set).not.toHaveBeenCalled()
      })
    })

    describe('getPendingCount with cache', () => {
      test('returns cached count when available', async () => {
        mockCacheService.getByKey.mockResolvedValue(15)

        const count = await getPendingCount('test-token', mockCacheService)

        expect(count).toBe(15)
        expect(mockCacheService.getByKey).toHaveBeenCalledWith('count:pending')
        expect(apiRequest).not.toHaveBeenCalled()
      })

      test('fetches from API on cache miss and caches result', async () => {
        mockCacheService.getByKey.mockResolvedValue(null)
        apiRequest.mockResolvedValue({
          success: true,
          data: { data: [], pagination: { total: 20 } }
        })

        const count = await getPendingCount('test-token', mockCacheService)

        expect(count).toBe(20)
        expect(mockCacheService.setByKey).toHaveBeenCalledWith(
          'count:pending',
          20
        )
      })
    })

    describe('getActiveCount with cache', () => {
      test('returns cached count when available', async () => {
        mockCacheService.getByKey.mockResolvedValue(25)

        const count = await getActiveCount('test-token', mockCacheService)

        expect(count).toBe(25)
        expect(mockCacheService.getByKey).toHaveBeenCalledWith('count:active')
        expect(apiRequest).not.toHaveBeenCalled()
      })

      test('fetches from API on cache miss and caches result', async () => {
        mockCacheService.getByKey.mockResolvedValue(null)
        apiRequest.mockResolvedValue({
          success: true,
          data: { data: [], pagination: { total: 30 } }
        })

        const count = await getActiveCount('test-token', mockCacheService)

        expect(count).toBe(30)
        expect(mockCacheService.setByKey).toHaveBeenCalledWith(
          'count:active',
          30
        )
      })
    })
  })
})
