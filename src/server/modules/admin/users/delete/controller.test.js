import { describe, test, expect, beforeEach, vi } from 'vitest'
import { deleteUserController } from './controller.js'

vi.mock('../../../../common/services/accounts/accounts-service.js')
vi.mock('../../../../common/services/accounts/accounts-cache.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/helpers/error-renderer/index.js')
vi.mock('../../../../common/helpers/security/encoder.js')

const { deleteAccount } =
  await import('../../../../common/services/accounts/accounts-service.js')
const { createAccountsCacheService } =
  await import('../../../../common/services/accounts/accounts-cache.js')
const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { extractApiError } =
  await import('../../../../common/helpers/error-renderer/index.js')
const { decodeUserId } =
  await import('../../../../common/helpers/security/encoder.js')

describe('DeleteUserController', () => {
  let mockRequest
  let mockH
  let mockCacheService

  beforeEach(() => {
    mockRequest = {
      params: {
        encodedId: Buffer.from('123', 'utf-8').toString('base64url')
      },
      payload: {
        confirm: 'yes'
      },
      auth: {
        credentials: {
          user: { id: 100, email: 'admin@example.com' },
          accessToken: 'test-token'
        }
      },
      pre: {
        accountData: {
          account: {
            id: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            status: 'active'
          },
          userId: 123,
          areasData: {}
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
      redirect: vi.fn(),
      view: vi.fn()
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

  describe('getHandler', () => {
    test('displays delete confirmation page with account name', async () => {
      await deleteUserController.getHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123, adminId: 100 },
        'Admin viewing delete confirmation page'
      )

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/admin/users/delete/index',
        expect.objectContaining({
          encodedId: mockRequest.params.encodedId,
          pageTitle: 'accounts.delete_user.page_title',
          backLink: `/admin/users/${mockRequest.params.encodedId}/view`,
          userName: 'John Doe'
        })
      )
    })

    test('redirects to users list when account data not found', async () => {
      mockRequest.pre.accountData = null

      await deleteUserController.getHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        { userId: 123 },
        'Account data not found in pre-handler'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
    })

    test('redirects to view page on error', async () => {
      const error = new Error('Test error')
      getAuthSession.mockImplementation(() => {
        throw error
      })

      await deleteUserController.getHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error, userId: 123 },
        'Error loading delete confirmation page'
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${mockRequest.params.encodedId}/view`
      )
    })
  })

  describe('postHandler', () => {
    test('successfully deletes active user and redirects to active users list', async () => {
      deleteAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, userName: 'John Smith', wasActive: true }
      })

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123, adminId: 100 },
        'Admin deleting user account'
      )

      expect(deleteAccount).toHaveBeenCalledWith(123, 'test-token')

      expect(mockCacheService.generateAccountKey).toHaveBeenCalledWith(123)
      expect(mockCacheService.dropByKey).toHaveBeenCalledWith('account:123')
      expect(mockCacheService.invalidateAll).toHaveBeenCalled()

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.delete_user.notifications.deleted_title',
        message: 'accounts.delete_user.notifications.deleted_message'
      })

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
    })

    test('successfully deletes pending user and redirects to pending users list', async () => {
      deleteAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, userName: 'Jane Doe', wasActive: false }
      })

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(deleteAccount).toHaveBeenCalledWith(123, 'test-token')

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.delete_user.notifications.deleted_title',
        message: 'accounts.delete_user.notifications.deleted_message'
      })

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/pending')
    })

    test('cancels deletion when confirm is not yes', async () => {
      mockRequest.payload.confirm = 'no'

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { userId: 123 },
        'Delete cancelled by admin'
      )

      expect(deleteAccount).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${mockRequest.params.encodedId}/view`
      )
    })

    test('handles API error response', async () => {
      deleteAccount.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'USER_NOT_FOUND' }]
      })

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { userId: 123, errors: [{ errorCode: 'USER_NOT_FOUND' }] },
        'Failed to delete account'
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
      deleteAccount.mockRejectedValue(error)

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        { error, userId: 123 },
        'Unexpected error deleting account'
      )

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.delete_user.errors.delete_failed'
      })

      const encodedId = mockRequest.params.encodedId
      expect(mockH.redirect).toHaveBeenCalledWith(
        `/admin/users/${encodedId}/view`
      )
    })

    test('logs cache invalidation warning on failure', async () => {
      deleteAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, userName: 'John Smith', wasActive: true }
      })

      const cacheError = new Error('Cache error')
      mockCacheService.dropByKey.mockRejectedValue(cacheError)

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        { error: cacheError, userId: 123 },
        'Failed to invalidate accounts cache'
      )

      // Should still redirect successfully
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users/active')
    })

    test('decodes user ID from encoded parameter', async () => {
      const userId = '456'
      mockRequest.params.encodedId = Buffer.from(userId, 'utf-8').toString(
        'base64url'
      )

      deleteAccount.mockResolvedValue({
        success: true,
        data: { userId: 456, userName: 'Jane Doe', wasActive: false }
      })

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(decodeUserId).toHaveBeenCalledWith(mockRequest.params.encodedId)
      expect(deleteAccount).toHaveBeenCalledWith(456, 'test-token')
    })

    test('uses fallback error message when extractApiError returns empty', async () => {
      extractApiError.mockReturnValue('')

      deleteAccount.mockResolvedValue({
        success: false,
        errors: []
      })

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.delete_user.errors.delete_failed'
      })
    })

    test('uses fallback user name when not provided', async () => {
      deleteAccount.mockResolvedValue({
        success: true,
        data: { userId: 123, wasActive: true }
      })

      await deleteUserController.postHandler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: 'accounts.delete_user.notifications.deleted_title',
        message: 'accounts.delete_user.notifications.deleted_message'
      })
    })
  })
})
