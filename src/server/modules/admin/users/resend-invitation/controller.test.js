import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resendInvitationController } from './controller.js'

vi.mock('../../../../common/services/accounts/accounts-service.js')
vi.mock('../../../../common/services/accounts/accounts-cache.js')
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/helpers/security/encoder.js')
vi.mock('../../../../common/helpers/error-renderer/index.js')

const { resendInvitation } =
  await import('../../../../common/services/accounts/accounts-service.js')
const { createAccountsCacheService } =
  await import('../../../../common/services/accounts/accounts-cache.js')
const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { decodeUserId } =
  await import('../../../../common/helpers/security/encoder.js')
const { extractApiError } =
  await import('../../../../common/helpers/error-renderer/index.js')

describe('ResendInvitationController', () => {
  let mockRequest
  let mockH
  let mockLogger
  let mockCacheService

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    }

    mockCacheService = {
      generateAccountKey: vi.fn((userId) => `account:${userId}`),
      dropByKey: vi.fn(),
      invalidateAll: vi.fn()
    }

    mockRequest = {
      params: {
        encodedId: 'encoded123'
      },
      server: {
        logger: mockLogger
      },
      yar: {
        flash: vi.fn()
      },
      t: vi.fn((key, params) => {
        if (params) {
          return `${key}:${JSON.stringify(params)}`
        }
        return key
      })
    }

    mockH = {
      redirect: vi.fn()
    }

    getAuthSession.mockReturnValue({
      user: { id: 100, email: 'admin@example.com' },
      accessToken: 'test-token'
    })

    decodeUserId.mockReturnValue(1)
    createAccountsCacheService.mockReturnValue(mockCacheService)
    extractApiError.mockReturnValue(
      'Can only resend invitation to approved accounts'
    )

    vi.clearAllMocks()
  })

  describe('handler', () => {
    it('successfully resends invitation and redirects to view page', async () => {
      resendInvitation.mockResolvedValue({
        success: true,
        data: { userId: 1, message: 'Invitation email resent successfully' }
      })

      await resendInvitationController.handler(mockRequest, mockH)

      expect(decodeUserId).toHaveBeenCalledWith('encoded123')
      expect(resendInvitation).toHaveBeenCalledWith(1, 'test-token')
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('success', {
        title: expect.any(String),
        message: expect.any(String)
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/users/encoded123/view'
      )
    })

    it('invalidates cache after successful resend', async () => {
      resendInvitation.mockResolvedValue({
        success: true,
        data: { userId: 1 }
      })

      await resendInvitationController.handler(mockRequest, mockH)

      expect(mockCacheService.generateAccountKey).toHaveBeenCalledWith(1)
      expect(mockCacheService.dropByKey).toHaveBeenCalledWith('account:1')
    })

    it('logs resend activity', async () => {
      resendInvitation.mockResolvedValue({
        success: true,
        data: { userId: 1 }
      })

      await resendInvitationController.handler(mockRequest, mockH)

      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId: 1, adminId: 100 },
        'Admin resending invitation to user'
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        { userId: 1, resentUserId: 1 },
        'Invitation resent successfully'
      )
    })

    it('handles API error response', async () => {
      resendInvitation.mockResolvedValue({
        success: false,
        errors: [
          {
            errorCode: 'ACCOUNT_INVALID_STATUS',
            message: 'Can only resend invitation to approved accounts'
          }
        ]
      })

      await resendInvitationController.handler(mockRequest, mockH)

      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'Can only resend invitation to approved accounts'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/users/encoded123/view'
      )
    })

    it('handles unexpected error', async () => {
      resendInvitation.mockRejectedValue(new Error('Network error'))

      await resendInvitationController.handler(mockRequest, mockH)

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
        'Unexpected error resending invitation'
      )
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: 'accounts.view_user.errors.resend_invitation_failed'
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/users/encoded123/view'
      )
    })

    it('handles cache invalidation failure gracefully', async () => {
      resendInvitation.mockResolvedValue({
        success: true,
        data: { userId: 1 }
      })
      mockCacheService.dropByKey.mockRejectedValue(
        new Error('Cache service unavailable')
      )

      await resendInvitationController.handler(mockRequest, mockH)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 1 }),
        'Failed to invalidate accounts cache'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/users/encoded123/view'
      )
    })

    it('uses fallback error message when API error has no message', async () => {
      extractApiError.mockReturnValueOnce(null)
      resendInvitation.mockResolvedValue({
        success: false,
        errors: []
      })

      await resendInvitationController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('error', {
        message: expect.any(String)
      })
    })
  })
})
