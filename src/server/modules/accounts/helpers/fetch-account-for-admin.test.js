import { describe, test, expect, beforeEach, vi } from 'vitest'
import { fetchAccountForAdmin } from './fetch-account-for-admin.js'

vi.mock('../../../common/services/accounts/accounts-service.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/services/accounts/accounts-cache.js')
vi.mock('../../../common/helpers/security/encoder.js')

const { getAccountById } =
  await import('../../../common/services/accounts/accounts-service.js')
const { extractApiError } =
  await import('../../../common/helpers/error-renderer/index.js')
const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')
const { createAccountsCacheService } =
  await import('../../../common/services/accounts/accounts-cache.js')
const { decodeUserId } =
  await import('../../../common/helpers/security/encoder.js')

describe('fetchAccountForAdmin', () => {
  let mockRequest
  let mockH
  let mockCacheService

  beforeEach(() => {
    mockCacheService = {
      getAccount: vi.fn(),
      setAccount: vi.fn()
    }

    mockRequest = {
      params: {
        encodedId: 'encoded123'
      },
      getAreas: vi.fn().mockResolvedValue({
        EA: [{ id: '1', name: 'Wessex' }],
        PSO: [],
        RMA: []
      }),
      server: {
        logger: {
          warn: vi.fn(),
          error: vi.fn()
        }
      }
    }

    mockH = {
      redirect: vi.fn().mockReturnValue({
        takeover: vi.fn().mockReturnThis()
      })
    }

    vi.clearAllMocks()
  })

  describe('Pre-handler function', () => {
    test('successfully fetches account and areas data', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: true,
        data: {
          id: 'user123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          status: 'active'
        }
      })

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(decodeUserId).toHaveBeenCalledWith('encoded123')
      expect(getAuthSession).toHaveBeenCalledWith(mockRequest)
      expect(getAccountById).toHaveBeenCalledWith(
        'user123',
        'token123',
        mockCacheService
      )
      expect(mockRequest.getAreas).toHaveBeenCalled()
      expect(result).toEqual({
        account: expect.objectContaining({
          id: 'user123',
          firstName: 'John'
        }),
        areasData: expect.any(Object),
        userId: 'user123'
      })
    })

    test('redirects to active users if encodedId is invalid', async () => {
      decodeUserId.mockReturnValue(null)

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        { encodedId: 'encoded123' },
        'Invalid encoded ID'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
      expect(result.takeover).toHaveBeenCalled()
    })

    test('redirects to login if no access token found', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue(null)

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        'No access token found'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/login')
      expect(result.takeover).toHaveBeenCalled()
    })

    test('redirects to login if access token is undefined', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: undefined })

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        'No access token found'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/login')
      expect(result.takeover).toHaveBeenCalled()
    })

    test('redirects to pending users if API call fails', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'NOT_FOUND' }]
      })
      extractApiError.mockReturnValue({ errorCode: 'NOT_FOUND' })

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        { userId: 'user123', errorCode: { errorCode: 'NOT_FOUND' } },
        'Failed to fetch account details'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/pending')
      expect(result.takeover).toHaveBeenCalled()
    })

    test('handles API errors without error code', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: false,
        errors: []
      })
      extractApiError.mockReturnValue(null)

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        { userId: 'user123', errorCode: null },
        'Failed to fetch account details'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/pending')
      expect(result.takeover).toHaveBeenCalled()
    })

    test('fetches areas data after successful account fetch', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: true,
        data: { id: 'user123', firstName: 'John' }
      })

      const mockAreasData = {
        EA: [{ id: '1', name: 'Test Area' }],
        PSO: [],
        RMA: []
      }
      mockRequest.getAreas.mockResolvedValue(mockAreasData)

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockRequest.getAreas).toHaveBeenCalled()
      expect(result.areasData).toEqual(mockAreasData)
    })
  })

  describe('Usage as pre-handler', () => {
    test('can be used in Hapi route pre-handler configuration', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: true,
        data: { id: 'user123', firstName: 'John' }
      })

      const result = await fetchAccountForAdmin(mockRequest, mockH)

      // Pre-handler returns data that can be assigned to request.pre
      expect(result).toEqual({
        account: expect.objectContaining({ id: 'user123' }),
        areasData: expect.any(Object),
        userId: 'user123'
      })
    })

    test('uses takeover() for redirects to prevent handler execution', async () => {
      decodeUserId.mockReturnValue(null)

      await fetchAccountForAdmin(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })
  })

  describe('Edge cases', () => {
    test('handles cache service creation', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: true,
        data: { id: 'user123' }
      })

      await fetchAccountForAdmin(mockRequest, mockH)

      expect(createAccountsCacheService).toHaveBeenCalledWith(
        mockRequest.server
      )
    })

    test('passes cache service to getAccountById', async () => {
      decodeUserId.mockReturnValue('user123')
      getAuthSession.mockReturnValue({ accessToken: 'token123' })
      createAccountsCacheService.mockReturnValue(mockCacheService)
      getAccountById.mockResolvedValue({
        success: true,
        data: { id: 'user123' }
      })

      await fetchAccountForAdmin(mockRequest, mockH)

      expect(getAccountById).toHaveBeenCalledWith(
        'user123',
        'token123',
        mockCacheService
      )
    })
  })
})
