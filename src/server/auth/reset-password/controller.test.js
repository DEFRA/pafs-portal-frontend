import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  resetPasswordController,
  resetPasswordPostController,
  resetPasswordSuccessController,
  resetPasswordTokenExpiredController
} from './controller.js'

vi.mock('../../common/services/auth/auth-service.js', () => ({
  validateResetToken: vi.fn(),
  resetPassword: vi.fn()
}))

describe('ResetPasswordController', () => {
  let mockRequest
  let mockH
  let mockLogger

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      error: vi.fn()
    }

    mockRequest = {
      payload: {},
      query: {},
      server: {
        logger: mockLogger
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn((template, context) => ({
        template,
        context,
        unstate: vi.fn(function () {
          return this
        })
      })),
      redirect: vi.fn((path) => ({
        path,
        state: vi.fn(function () {
          return this
        })
      }))
    }
  })

  describe('GET /reset-password', () => {
    it('renders reset password page with valid token', async () => {
      const { validateResetToken } = await import(
        '../../common/services/auth/auth-service.js'
      )
      validateResetToken.mockResolvedValue({ success: true })

      mockRequest.query = { token: 'valid-token-123' }

      await resetPasswordController.handler(mockRequest, mockH)

      expect(validateResetToken).toHaveBeenCalledWith('valid-token-123')
      expect(mockH.view).toHaveBeenCalledWith('auth/reset-password/index', {
        pageTitle: 'password-reset.reset_password.title',
        token: 'valid-token-123'
      })
    })

    it('redirects to token expired page if token is invalid', async () => {
      const { validateResetToken } = await import(
        '../../common/services/auth/auth-service.js'
      )
      validateResetToken.mockResolvedValue({ success: false })

      mockRequest.query = { token: 'invalid-token' }

      await resetPasswordController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })

    it('redirects to login if no token provided', async () => {
      mockRequest.query = {}

      await resetPasswordController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    it('redirects to token expired on validation error', async () => {
      const { validateResetToken } = await import(
        '../../common/services/auth/auth-service.js'
      )
      validateResetToken.mockRejectedValue(new Error('Network error'))

      mockRequest.query = { token: 'valid-token-123' }

      await resetPasswordController.handler(mockRequest, mockH)

      expect(mockLogger.error).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })
  })

  describe('POST /reset-password', () => {
    beforeEach(() => {
      mockRequest.payload = {
        token: 'valid-token-123',
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      }
    })

    it('redirects to token expired if no token in payload', async () => {
      mockRequest.payload = {
        newPassword: 'ValidPass123!',
        confirmPassword: 'ValidPass123!'
      }

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })

    it('validates password is required', async () => {
      mockRequest.payload.newPassword = ''

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          validationErrors: expect.arrayContaining(['password-required'])
        })
      )
    })

    it('validates password minimum length', async () => {
      mockRequest.payload.newPassword = 'Short1!'
      mockRequest.payload.confirmPassword = 'Short1!'

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          validationErrors: expect.arrayContaining(['password-min-length'])
        })
      )
    })

    it('validates password requires uppercase letter', async () => {
      mockRequest.payload.newPassword = 'validpass123!'
      mockRequest.payload.confirmPassword = 'validpass123!'

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          validationErrors: expect.arrayContaining(['password-uppercase'])
        })
      )
    })

    it('validates passwords match', async () => {
      mockRequest.payload.newPassword = 'ValidPass123!'
      mockRequest.payload.confirmPassword = 'DifferentPass123!'

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          validationErrors: expect.arrayContaining(['password-mismatch'])
        })
      )
    })

    it('successfully resets password and redirects to success', async () => {
      const { resetPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      resetPassword.mockResolvedValue({ success: true })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(resetPassword).toHaveBeenCalledWith(
        'valid-token-123',
        'ValidPass123!',
        'ValidPass123!'
      )
      expect(mockH.redirect).toHaveBeenCalledWith('/reset-password/success')
    })

    it('handles expired token error from backend', async () => {
      const { resetPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      resetPassword.mockResolvedValue({
        success: false,
        error: { errorCode: 'AUTH_PASSWORD_RESET_EXPIRED_TOKEN' }
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/reset-password/token-expired'
      )
    })

    it('handles password used previously error', async () => {
      const { resetPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      resetPassword.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_PASSWORD_RESET_PASSWORD_WAS_USED_PREVIOUSLY'
        }
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          validationErrors: ['password-used-previously'],
          token: 'valid-token-123'
        })
      )
    })

    it('handles same as current password error', async () => {
      const { resetPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      resetPassword.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_PASSWORD_RESET_SAME_AS_CURRENT',
          message: 'New password cannot be the same as your current password'
        }
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          validationErrors: ['password-same-as-current'],
          token: 'valid-token-123'
        })
      )
    })

    it('handles generic error from backend', async () => {
      const { resetPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      resetPassword.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'SOME_UNKNOWN_ERROR',
          message: 'An unexpected error occurred'
        }
      })

      await resetPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/index',
        expect.objectContaining({
          errorCode: 'SOME_UNKNOWN_ERROR',
          token: 'valid-token-123'
        })
      )
    })
  })

  describe('GET /reset-password/success', () => {
    it('redirects to login if accessed directly', () => {
      mockRequest.state = {}

      resetPasswordSuccessController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    it('renders success page when canViewSuccess is true', () => {
      mockRequest.state = { canViewSuccess: true }

      const mockUnstate = vi.fn()
      mockH.view = vi.fn(() => ({
        unstate: mockUnstate
      }))

      resetPasswordSuccessController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/reset-password/success', {
        pageTitle: 'password-reset.reset_password_success.title'
      })
      expect(mockUnstate).toHaveBeenCalledWith('canViewSuccess')
    })
  })

  describe('GET /reset-password/token-expired', () => {
    it('redirects to forgot-password if accessed directly', () => {
      mockRequest.state = {}

      resetPasswordTokenExpiredController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/forgot-password')
    })

    it('renders token expired page when canViewTokenExpired is true', () => {
      mockRequest.state = { canViewTokenExpired: true }

      const mockUnstate = vi.fn()
      mockH.view = vi.fn(() => ({
        unstate: mockUnstate
      }))

      resetPasswordTokenExpiredController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/reset-password/token-expired',
        {
          pageTitle: 'password-reset.reset_password_token_expired.title'
        }
      )
      expect(mockUnstate).toHaveBeenCalledWith('canViewTokenExpired')
    })
  })
})
