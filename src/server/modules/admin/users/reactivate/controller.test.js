import { describe, test, expect, beforeEach, vi } from 'vitest'
import { reactivateUserController } from './controller.js'

vi.mock('../../../../common/services/accounts/accounts-service.js')
vi.mock('../../../../common/services/accounts/accounts-cache.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/helpers/error-renderer/index.js')
vi.mock('../../../../common/helpers/security/encoder.js')

const { reactivateAccount } =
  await import('../../../../common/services/accounts/accounts-service.js')
const { createAccountsCacheService } =
  await import('../../../../common/services/accounts/accounts-cache.js')
const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { extractApiError } =
  await import('../../../../common/helpers/error-renderer/index.js')
const { decodeUserId } =
  await import('../../../../common/helpers/security/encoder.js')

describe('ReactivateUserController', () => {
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
    test('successfully reactivates user and redirects to view account page', async () => {
      reactivateAccount.mockResolvedValue({
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

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123, adminId: 100 },
        'Admin reactivating user account'
      )

      expect(reactivateAccount).toHaveBeenCalledWith(123, 'test-token')

      expect(mockCacheService.generateAccountKey).toHaveBeenCalledWith(123)
      expect(mockCacheService.dropByKey).toHaveBeenCalledWith('account:123')
      expect(mockCacheService.invalidateAll).toHaveBeenCalled()

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.view_user.notifications.reactivated_title',
        message: 'accounts.view_user.notifications.reactivated_message'
      })

      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('handles API error response', async () => {
      reactivateAccount.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'USER_NOT_FOUND' }]
      })

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { userId: 123, errors: [{ errorCode: 'USER_NOT_FOUND' }] },
        'Failed to reactivate account'
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
      reactivateAccount.mockRejectedValue(error)

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error, userId: 123 },
        'Unexpected error reactivating account'
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.view_user.errors.reactivate_failed'
      })

      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('logs cache invalidation warning on failure', async () => {
      reactivateAccount.mockResolvedValue({
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

      const cacheError = new Error('Cache error')
      mockCacheService.dropByKey.mockRejectedValue(cacheError)

      await reactivateUserController.handler(mockRequest, mockH)

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

      reactivateAccount.mockResolvedValue({
        success: true,
        data: {
          account: {
            id: 456,
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@example.com'
          }
        }
      })

      await reactivateUserController.handler(mockRequest, mockH)

      expect(decodeUserId).toHaveBeenCalledWith(mockRequest.params.encodedId)
      expect(reactivateAccount).toHaveBeenCalledWith(456, 'test-token')
    })

    test('uses fallback error message when extractApiError returns empty', async () => {
      extractApiError.mockReturnValue('')

      reactivateAccount.mockResolvedValue({
        success: false,
        errors: []
      })

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.view_user.errors.reactivate_failed'
      })
    })

    test('handles account with only first name', async () => {
      reactivateAccount.mockResolvedValue({
        success: true,
        data: {
          account: {
            id: 123,
            firstName: 'John',
            lastName: '',
            email: 'john@example.com'
          }
        }
      })

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.view_user.notifications.reactivated_title',
        message: 'accounts.view_user.notifications.reactivated_message'
      })
    })

    test('handles account with missing name fields', async () => {
      reactivateAccount.mockResolvedValue({
        success: true,
        data: {
          account: {
            id: 123,
            email: 'user@example.com'
          }
        }
      })

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.view_user.notifications.reactivated_title',
        message: 'accounts.view_user.notifications.reactivated_message'
      })
    })

    test('logs successful reactivation with account ID', async () => {
      reactivateAccount.mockResolvedValue({
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

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123, reactivatedUserId: 123 },
        'Account reactivated successfully'
      )
    })

    test('handles account not disabled error', async () => {
      reactivateAccount.mockResolvedValue({
        success: false,
        errors: [
          {
            errorCode: 'ACCOUNT_NOT_DISABLED',
            message: 'Account is not disabled'
          }
        ]
      })

      await reactivateUserController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        {
          userId: 123,
          errors: [
            {
              errorCode: 'ACCOUNT_NOT_DISABLED',
              message: 'Account is not disabled'
            }
          ]
        },
        'Failed to reactivate account'
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'API error message'
      })
    })
  })
})
