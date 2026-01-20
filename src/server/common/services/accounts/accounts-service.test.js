import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getAccounts,
  getPendingCount,
  getActiveCount,
  getAccountById,
  upsertAccount,
  validateEmail,
  approveAccount,
  deleteAccount,
  resendInvitation,
  reactivateAccount
} from './accounts-service.js'

vi.mock('../../helpers/api-client/index.js')

const { apiRequest } = await import('../../helpers/api-client/index.js')

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
        setByKey: vi.fn(),
        getListMetadata: vi.fn(),
        setListMetadata: vi.fn(),
        getAccountsByIds: vi.fn(),
        setAccounts: vi.fn(),
        getAccount: vi.fn(),
        setAccount: vi.fn()
      }
    })

    describe('getAccounts with cache', () => {
      test('returns cached data when available', async () => {
        const metadata = {
          accountIds: [1],
          pagination: { total: 1, page: 1, pageSize: 25 }
        }
        const cachedAccounts = [{ id: 1, firstName: 'John' }]

        mockCacheService.getListMetadata.mockResolvedValue(metadata)
        mockCacheService.getAccountsByIds.mockResolvedValue(cachedAccounts)

        const result = await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(result.success).toBe(true)
        expect(result.data.data).toEqual(cachedAccounts)
        expect(result.data.pagination).toEqual(metadata.pagination)
        expect(mockCacheService.getListMetadata).toHaveBeenCalled()
        expect(mockCacheService.getAccountsByIds).toHaveBeenCalledWith([1])
        expect(apiRequest).not.toHaveBeenCalled()
      })

      test('fetches from API on cache miss', async () => {
        mockCacheService.getListMetadata.mockResolvedValue(null)
        const apiResponse = {
          success: true,
          data: { data: [{ id: 1 }], pagination: { total: 1 } }
        }
        apiRequest.mockResolvedValue(apiResponse)

        const result = await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(result.success).toBe(true)
        expect(result.data.data).toEqual([{ id: 1 }])
        expect(result.data.pagination).toEqual({ total: 1 })
        expect(apiRequest).toHaveBeenCalled()
      })

      test('caches successful API response', async () => {
        mockCacheService.getListMetadata.mockResolvedValue(null)
        const apiResponse = {
          success: true,
          data: { data: [{ id: 1 }], pagination: { total: 1 } }
        }
        apiRequest.mockResolvedValue(apiResponse)

        await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(mockCacheService.setAccounts).toHaveBeenCalledWith([{ id: 1 }])
        expect(mockCacheService.setListMetadata).toHaveBeenCalled()
      })

      test('does not cache failed API response', async () => {
        mockCacheService.getListMetadata.mockResolvedValue(null)
        apiRequest.mockResolvedValue({
          success: false,
          errors: [{ errorCode: 'ERROR' }]
        })

        await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(mockCacheService.setAccounts).not.toHaveBeenCalled()
        expect(mockCacheService.setListMetadata).not.toHaveBeenCalled()
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
    describe('getAccountById', () => {
      test('calls API with correct URL and ID', async () => {
        const mockAccount = {
          success: true,
          data: {
            id: 123,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
          }
        }
        apiRequest.mockResolvedValue(mockAccount)

        const result = await getAccountById(123, 'test-token')

        expect(apiRequest).toHaveBeenCalledWith(
          '/api/v1/accounts/123',
          expect.objectContaining({
            method: 'GET',
            headers: { Authorization: 'Bearer test-token' }
          })
        )
        expect(result).toEqual(mockAccount)
      })

      test('handles string ID', async () => {
        apiRequest.mockResolvedValue({ success: true, data: {} })

        await getAccountById('456', 'token')

        expect(apiRequest).toHaveBeenCalledWith(
          '/api/v1/accounts/456',
          expect.any(Object)
        )
      })

      test('calls API without authorization header when no token provided', async () => {
        apiRequest.mockResolvedValue({ success: true, data: {} })

        await getAccountById(789)

        expect(apiRequest).toHaveBeenCalledWith(
          '/api/v1/accounts/789',
          expect.objectContaining({
            method: 'GET',
            headers: {}
          })
        )
      })

      test('returns cached account when available', async () => {
        const cachedAccount = { id: 123, firstName: 'John', lastName: 'Doe' }
        mockCacheService.getAccount.mockResolvedValue(cachedAccount)

        const result = await getAccountById(123, 'token', mockCacheService)

        expect(result.success).toBe(true)
        expect(result.data).toEqual(cachedAccount)
        expect(apiRequest).not.toHaveBeenCalled()
      })

      test('caches account after successful API call', async () => {
        mockCacheService.getAccount.mockResolvedValue(null)
        const apiAccount = { id: 123, firstName: 'Jane' }
        apiRequest.mockResolvedValue({ success: true, data: apiAccount })

        await getAccountById(123, 'token', mockCacheService)

        expect(mockCacheService.setAccount).toHaveBeenCalledWith(
          123,
          apiAccount
        )
      })

      test('does not cache when API call fails', async () => {
        mockCacheService.getAccount.mockResolvedValue(null)
        apiRequest.mockResolvedValue({ success: false, errors: [] })

        await getAccountById(123, 'token', mockCacheService)

        expect(mockCacheService.setAccount).not.toHaveBeenCalled()
      })
    })

    describe('getAccounts with partial cache', () => {
      test('fetches from API when some accounts are not cached', async () => {
        const metadata = {
          accountIds: [1, 2, 3],
          pagination: { total: 3, page: 1, pageSize: 25 }
        }
        mockCacheService.getListMetadata.mockResolvedValue(metadata)
        mockCacheService.getAccountsByIds.mockResolvedValue([
          { id: 1 },
          null,
          { id: 3 }
        ])

        const apiResponse = {
          success: true,
          data: {
            data: [{ id: 1 }, { id: 2 }, { id: 3 }],
            pagination: metadata.pagination
          }
        }
        apiRequest.mockResolvedValue(apiResponse)

        const result = await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(result.success).toBe(true)
        expect(result.data.data).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }])
        expect(apiRequest).toHaveBeenCalled()
      })

      test('does not cache when accounts array is empty', async () => {
        mockCacheService.getListMetadata.mockResolvedValue(null)
        apiRequest.mockResolvedValue({
          success: true,
          data: { data: [], pagination: { total: 0 } }
        })

        await getAccounts({
          status: 'pending',
          cacheService: mockCacheService
        })

        expect(mockCacheService.setAccounts).not.toHaveBeenCalled()
        expect(mockCacheService.setListMetadata).not.toHaveBeenCalled()
      })
    })
  })

  describe('upsertAccount', () => {
    test('posts account data to API with token', async () => {
      apiRequest.mockResolvedValue({ success: true })

      const accountData = { email: 'test@example.com' }
      await upsertAccount(accountData, 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts',
        expect.objectContaining({
          method: 'POST',
          headers: { Authorization: 'Bearer token' },
          body: JSON.stringify(accountData)
        })
      )
    })

    test('posts account data to API without token', async () => {
      apiRequest.mockResolvedValue({ success: true })

      const accountData = { email: 'test@example.com' }
      await upsertAccount(accountData)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(accountData)
        })
      )
    })

    test('returns API response', async () => {
      const mockResponse = { success: true, data: { userId: 123 } }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await upsertAccount({ email: 'test@example.com' })

      expect(result).toEqual(mockResponse)
    })
  })

  describe('validateEmail', () => {
    test('posts email to validation endpoint', async () => {
      apiRequest.mockResolvedValue({ success: true, valid: true })

      await validateEmail('test@example.com')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/validate-email',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com' })
        })
      )
    })

    test('returns validation result', async () => {
      const mockResponse = { success: true, valid: false }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await validateEmail('invalid@email')

      expect(result).toEqual(mockResponse)
    })
  })

  describe('edge cases', () => {
    test('getAccounts handles null cache service gracefully', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { data: [{ id: 1 }], pagination: { total: 1 } }
      })

      const result = await getAccounts({
        status: 'pending',
        cacheService: null
      })

      expect(result.success).toBe(true)
      expect(apiRequest).toHaveBeenCalled()
    })

    test('getAccountById handles null cache service gracefully', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { id: 1, email: 'test@example.com' }
      })

      const result = await getAccountById(1, 'token', null)

      expect(result.success).toBe(true)
      expect(apiRequest).toHaveBeenCalled()
    })

    test('getAccounts handles missing metadata accountIds', async () => {
      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue({ pagination: { total: 0 } })
      }

      apiRequest.mockResolvedValue({
        success: true,
        data: { data: [], pagination: { total: 0 } }
      })

      await getAccounts({
        status: 'pending',
        cacheService: mockCacheService
      })

      expect(apiRequest).toHaveBeenCalled()
    })
  })

  describe('approveAccount', () => {
    test('calls API with correct URL and authorization', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { userId: 123 }
      })

      await approveAccount('123', 'test-token')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/accounts/123/approve', {
        method: 'PATCH',
        headers: {
          Authorization: 'Bearer test-token'
        }
      })
    })

    test('returns API response', async () => {
      const expectedResponse = {
        success: true,
        data: { userId: 456, message: 'Account approved' }
      }

      apiRequest.mockResolvedValue(expectedResponse)

      const result = await approveAccount('456', 'test-token')

      expect(result).toEqual(expectedResponse)
    })

    test('handles API errors', async () => {
      const errorResponse = {
        success: false,
        errors: [{ errorCode: 'USER_NOT_FOUND' }]
      }

      apiRequest.mockResolvedValue(errorResponse)

      const result = await approveAccount('999', 'test-token')

      expect(result).toEqual(errorResponse)
    })
  })

  describe('deleteAccount', () => {
    test('calls API with correct URL and authorization', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { userId: 123, userName: 'John Smith', wasActive: true }
      })

      await deleteAccount('123', 'test-token')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/accounts/123', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer test-token'
        }
      })
    })

    test('returns API response with user details', async () => {
      const expectedResponse = {
        success: true,
        data: {
          userId: 456,
          userName: 'Jane Doe',
          wasActive: false,
          message: 'Account deleted successfully'
        }
      }

      apiRequest.mockResolvedValue(expectedResponse)

      const result = await deleteAccount('456', 'test-token')

      expect(result).toEqual(expectedResponse)
    })

    test('handles API errors', async () => {
      const errorResponse = {
        success: false,
        errors: [{ errorCode: 'USER_NOT_FOUND' }]
      }

      apiRequest.mockResolvedValue(errorResponse)

      const result = await deleteAccount('999', 'test-token')

      expect(result).toEqual(errorResponse)
    })

    test('handles numeric user ID', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { userId: 789 }
      })

      await deleteAccount(789, 'test-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts/789',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    test('handles deletion of active user', async () => {
      const response = {
        success: true,
        data: {
          userId: 100,
          userName: 'Active User',
          wasActive: true
        }
      }

      apiRequest.mockResolvedValue(response)

      const result = await deleteAccount(100, 'token')

      expect(result.data.wasActive).toBe(true)
    })

    test('handles deletion of pending user', async () => {
      const response = {
        success: true,
        data: {
          userId: 200,
          userName: 'Pending User',
          wasActive: false
        }
      }

      apiRequest.mockResolvedValue(response)

      const result = await deleteAccount(200, 'token')

      expect(result.data.wasActive).toBe(false)
    })
  })

  describe('resendInvitation', () => {
    test('calls API with correct URL and authorization', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { userId: 123, message: 'Invitation email resent successfully' }
      })

      await resendInvitation('123', 'test-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts/123/resend-invitation',
        {
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      )
    })

    test('returns API response with success message', async () => {
      const expectedResponse = {
        success: true,
        data: {
          userId: 456,
          message: 'Invitation email resent successfully'
        }
      }

      apiRequest.mockResolvedValue(expectedResponse)

      const result = await resendInvitation('456', 'test-token')

      expect(result).toEqual(expectedResponse)
    })

    test('handles API errors', async () => {
      const errorResponse = {
        success: false,
        errors: [{ errorCode: 'ACCOUNT_INVALID_STATUS' }]
      }

      apiRequest.mockResolvedValue(errorResponse)

      const result = await resendInvitation('999', 'test-token')

      expect(result).toEqual(errorResponse)
    })

    test('handles numeric user ID', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { userId: 789 }
      })

      await resendInvitation(789, 'test-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts/789/resend-invitation',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('reactivateAccount', () => {
    test('calls API with correct URL and authorization', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: {
          account: {
            id: 123,
            firstName: 'John',
            lastName: 'Smith',
            email: 'john.smith@example.com'
          }
        }
      })

      await reactivateAccount('123', 'test-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts/123/reactivate',
        {
          method: 'PATCH',
          headers: {
            Authorization: 'Bearer test-token'
          }
        }
      )
    })

    test('returns API response with account data', async () => {
      const expectedResponse = {
        success: true,
        data: {
          account: {
            id: 456,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com'
          },
          message: 'Account reactivated successfully'
        }
      }

      apiRequest.mockResolvedValue(expectedResponse)

      const result = await reactivateAccount('456', 'test-token')

      expect(result).toEqual(expectedResponse)
    })

    test('handles API errors', async () => {
      const errorResponse = {
        success: false,
        errors: [{ errorCode: 'USER_NOT_FOUND', message: 'User not found' }]
      }

      apiRequest.mockResolvedValue(errorResponse)

      const result = await reactivateAccount('999', 'test-token')

      expect(result).toEqual(errorResponse)
    })

    test('handles account not disabled error', async () => {
      const errorResponse = {
        success: false,
        errors: [
          {
            errorCode: 'ACCOUNT_NOT_DISABLED',
            message: 'Account is not disabled'
          }
        ]
      }

      apiRequest.mockResolvedValue(errorResponse)

      const result = await reactivateAccount('123', 'test-token')

      expect(result).toEqual(errorResponse)
    })

    test('uses numeric user ID', async () => {
      apiRequest.mockResolvedValue({
        success: true,
        data: { account: { id: 789 } }
      })

      await reactivateAccount(789, 'test-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/accounts/789/reactivate',
        expect.objectContaining({
          method: 'PATCH'
        })
      )
    })
  })
})
