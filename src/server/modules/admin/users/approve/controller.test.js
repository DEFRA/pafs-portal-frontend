import { describe, test, expect, beforeEach, vi } from 'vitest'
import { approveUserController } from './controller.js'

vi.mock('../../../../common/services/accounts/accounts-service.js')
vi.mock('../../../../common/services/accounts/accounts-cache.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/helpers/error-renderer/index.js')
vi.mock('../../../../common/helpers/security/encoder.js')

const { approveAccount } =
  await import('../../../../common/services/accounts/accounts-service.js')
const { createAccountsCacheService } =
  await import('../../../../common/services/accounts/accounts-cache.js')
const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { extractApiError } =
  await import('../../../../common/helpers/error-renderer/index.js')
const { decodeUserId } =
  await import('../../../../common/helpers/security/encoder.js')

describe('ApproveUserController', () => {
  let mockRequest
  let mockH
  let mockCacheService

  beforeEach(() => {
    mockRequest = {
      params: {
        encodedId: Buffer.from('123', 'utf-8').toString('base64url')
      },
      auth: {
        credentials: {
          user: { id: 100, email: 'admin@example.com' },
          accessToken: 'test-token'
        }
      },
      server: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          debug: vi.fn()
        }
      },
      yar: {
        flash: vi.fn()
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      redirect: vi.fn()
    }

    // Mock session
    getAuthSession.mockReturnValue({
      accessToken: 'test-token',
      user: { id: 100, email: 'admin@example.com' }
    })

    // Mock cache service
    const mockListCacheService = {
      invalidateAll: vi.fn().mockResolvedValue(undefined)
    }
    mockCacheService = {
      invalidateAll: vi.fn().mockResolvedValue(undefined),
      dropByKey: vi.fn().mockResolvedValue(undefined),
      generateAccountKey: vi.fn((id) => `account:${id}`),
      listCacheService: mockListCacheService
    }
    createAccountsCacheService.mockReturnValue(mockCacheService)

    extractApiError.mockReturnValue('API error message')

    // Mock decodeUserId to return numeric ID
    decodeUserId.mockImplementation((encodedId) => {
      if (encodedId === Buffer.from('123', 'utf-8').toString('base64url')) {
        return 123
      }
      if (encodedId === Buffer.from('456', 'utf-8').toString('base64url')) {
        return 456
      }
      return null
    })

    vi.clearAllMocks()
  })

  describe('handler', () => {
    test('successfully approves user and redirects to view account page', async () => {
      approveAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, userName: 'John Smith' }
      })

      await approveUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123, adminId: 100 },
        'Admin approving user account'
      )

      expect(approveAccount).toHaveBeenCalledWith(123, 'test-token')

      expect(mockCacheService.generateAccountKey).toHaveBeenCalledWith(123)
      expect(mockCacheService.dropByKey).toHaveBeenCalledWith('account:123')
      expect(mockCacheService.invalidateAll).toHaveBeenCalled()

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.view_user.notifications.approved_title',
        message: 'accounts.view_user.notifications.approved_message'
      })

      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('handles API error response', async () => {
      approveAccount.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'USER_NOT_FOUND' }]
      })

      await approveUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { userId: 123, errors: [{ errorCode: 'USER_NOT_FOUND' }] },
        'Failed to approve account'
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'API error message'
      })

      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('handles unexpected error', async () => {
      const error = new Error('Network error')
      approveAccount.mockRejectedValue(error)

      await approveUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error, userId: 123 },
        'Unexpected error approving account'
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.view_user.errors.approve_failed'
      })

      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('logs cache invalidation warning on failure', async () => {
      approveAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, userName: 'John Smith' }
      })

      const cacheError = new Error('Cache error')
      mockCacheService.dropByKey.mockRejectedValue(cacheError)

      await approveUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        { error: cacheError, userId: 123 },
        'Failed to invalidate accounts cache'
      )

      // Should still redirect successfully to view account page
      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('decodes user ID from encoded parameter', async () => {
      const userId = '456'
      mockRequest.params.encodedId = Buffer.from(userId, 'utf-8').toString(
        'base64url'
      )

      approveAccount.mockResolvedValue({
        success: true,
        data: { userId: 456, userName: 'Jane Doe' }
      })

      await approveUserController.handler(mockRequest, mockH)

      expect(decodeUserId).toHaveBeenCalledWith(mockRequest.params.encodedId)
      expect(approveAccount).toHaveBeenCalledWith(456, 'test-token')
    })

    test('uses fallback error message when extractApiError returns empty', async () => {
      extractApiError.mockReturnValue('')

      approveAccount.mockResolvedValue({
        success: false,
        errors: []
      })

      await approveUserController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.view_user.errors.approve_failed'
      })
    })
  })
})
