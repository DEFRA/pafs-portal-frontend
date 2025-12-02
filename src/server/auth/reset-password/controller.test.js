import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  resetPasswordController,
  resetPasswordPostController,
  resetPasswordSuccessController,
  resetPasswordTokenExpiredController
} from './controller.js'
import {
  VALIDATION_CODES,
  VIEW_ERROR_CODES
} from '../../common/constants/validation.js'

vi.mock('../../common/services/auth/auth-service.js')

const { validateResetToken, resetPassword } =
  await import('../../common/services/auth/auth-service.js')

describe('Reset Password Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      query: {},
      server: { logger: { error: vi.fn() } },
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn()
      }
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }
  })

  describe('GET /reset-password', () => {
    test('renders reset password page with valid token', async () => {
      validateResetToken.mockResolvedValue({ success: true })
      mockRequest.query = { token: 'valid-token-123' }

      await resetPasswordController.handler(mockRequest, mockH)

      expect(validateResetToken).toHaveBeenCalledWith('valid-token-123')
      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          pageTitle: 'auth.reset_password.title',
          token: 'valid-token-123',
          fieldErrors: {}
        })
      )
    })

    test('redirects to token expired page if token is invalid', async () => {
      validateResetToken.mockResolvedValue({ success: false })
      mockRequest.query = { token: 'invalid-token' }

      await resetPasswordController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('tokenExpired', true)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })

    test('redirects to login if no token provided', async () => {
      mockRequest.query = {}

      await resetPasswordController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    test('redirects to token expired on validation error', async () => {
      validateResetToken.mockRejectedValue(new Error('Network error'))
      mockRequest.query = { token: 'valid-token-123' }

      await resetPasswordController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })
  })

  describe('POST /reset-password - validation', () => {
    beforeEach(() => {
      mockRequest.payload = {
        token: 'valid-token-123',
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      }
    })

    test('redirects to token expired if no token in payload', async () => {
      mockRequest.payload = {
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      }

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })

    test('validates password is required', async () => {
      mockRequest.payload.newPassword = ''

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          fieldErrors: expect.objectContaining({
            newPassword: VALIDATION_CODES.PASSWORD_REQUIRED
          })
        })
      )
    })

    test('validates password minimum length', async () => {
      mockRequest.payload.newPassword = 'Short1!'
      mockRequest.payload.confirmPassword = 'Short1!'

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          fieldErrors: expect.objectContaining({
            newPassword: VALIDATION_CODES.PASSWORD_MIN_LENGTH
          })
        })
      )
    })

    test('validates passwords match', async () => {
      mockRequest.payload.newPassword = 'ValidPass123!'
      mockRequest.payload.confirmPassword = 'DifferentPass123!'

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          fieldErrors: expect.objectContaining({
            confirmPassword: VALIDATION_CODES.PASSWORD_MISMATCH
          })
        })
      )
    })
  })

  describe('POST /reset-password - API responses', () => {
    beforeEach(() => {
      mockRequest.payload = {
        token: 'valid-token-123',
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      }
    })

    test('successfully resets password and redirects to success', async () => {
      resetPassword.mockResolvedValue({ success: true })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(resetPassword).toHaveBeenCalledWith(
        'valid-token-123',
        'ValidPass123!',
        'ValidPass123!'
      )
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('resetSuccess', true)
      expect(mockH.redirect).toHaveBeenCalledWith('/reset-password/success')
    })

    test('handles expired token error from backend', async () => {
      resetPassword.mockResolvedValue({
        success: false,
        errors: [{ errorCode: VIEW_ERROR_CODES.RESET_TOKEN_EXPIRED_OR_INVALID }]
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('tokenExpired', true)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })

    test('handles password used previously error', async () => {
      resetPassword.mockResolvedValue({
        success: false,
        errors: [{ errorCode: VIEW_ERROR_CODES.PASSWORD_WAS_USED_PREVIOUSLY }]
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          fieldErrors: {
            newPassword: VIEW_ERROR_CODES.PASSWORD_WAS_USED_PREVIOUSLY
          },
          token: 'valid-token-123'
        })
      )
    })

    test('handles generic error from backend', async () => {
      resetPassword.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'SOME_OTHER_ERROR' }]
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          fieldErrors: {},
          errorCode: 'SOME_OTHER_ERROR',
          token: 'valid-token-123'
        })
      )
    })

    test('handles network error during reset', async () => {
      resetPassword.mockRejectedValue(new Error('Network error'))

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          fieldErrors: {},
          errorCode: VIEW_ERROR_CODES.NETWORK_ERROR,
          token: 'valid-token-123'
        })
      )
    })
  })

  describe('GET /reset-password/success', () => {
    test('redirects to login if accessed directly', () => {
      mockRequest.yar.flash.mockReturnValue([])

      resetPasswordSuccessController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    test('renders success page when flash is set', () => {
      mockRequest.yar.flash.mockReturnValue([true])

      resetPasswordSuccessController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/reset-password/success', {
        pageTitle: 'auth.reset_password_success.title'
      })
    })
  })

  describe('GET /reset-password/token-expired', () => {
    test('redirects to forgot-password if accessed directly', () => {
      mockRequest.yar.flash.mockReturnValue([])

      resetPasswordTokenExpiredController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/forgot-password')
    })

    test('renders token expired page when flash is set', () => {
      mockRequest.yar.flash.mockReturnValue([true])

      resetPasswordTokenExpiredController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/token-expired',
        {
          pageTitle: 'auth.reset_password_token_expired.title'
        }
      )
    })
  })
})
