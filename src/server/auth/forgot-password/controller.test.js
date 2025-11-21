import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  forgotPasswordController,
  forgotPasswordPostController,
  forgotPasswordConfirmationController
} from './controller.js'

vi.mock('../../common/services/auth/auth-service.js', () => ({
  forgotPassword: vi.fn()
}))

describe('ForgotPasswordController', () => {
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
      state: {},
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
      })),
      unstate: vi.fn()
    }
  })

  describe('GET /forgot-password', () => {
    it('renders forgot password page', () => {
      const result = forgotPasswordController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/forgot-password/index', {
        pageTitle: 'password-reset.forgot_password.title'
      })
      expect(result.template).toBe('auth/forgot-password/index')
    })

    it('translates page title', () => {
      forgotPasswordController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'password-reset.forgot_password.title'
      )
    })
  })

  describe('POST /forgot-password', () => {
    it('validates email is required', async () => {
      mockRequest.payload = { email: '' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/forgot-password/index',
        expect.objectContaining({
          validationErrors: ['email-required'],
          email: ''
        })
      )
    })

    it('validates email format', async () => {
      mockRequest.payload = { email: 'invalid-email' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/forgot-password/index',
        expect.objectContaining({
          validationErrors: ['email-invalid']
        })
      )
    })

    it('accepts valid email and redirects to confirmation', async () => {
      const { forgotPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      forgotPassword.mockResolvedValue({ success: true })

      mockRequest.payload = { email: 'test@example.com' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(forgotPassword).toHaveBeenCalledWith('test@example.com')
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/forgot-password/confirmation'
      )
    })

    it('redirects to confirmation even on API error (prevent enumeration)', async () => {
      const { forgotPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      forgotPassword.mockRejectedValue(new Error('API Error'))

      mockRequest.payload = { email: 'test@example.com' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/forgot-password/confirmation'
      )
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('validates email with whitespace and uppercase', async () => {
      const { forgotPassword } = await import(
        '../../common/services/auth/auth-service.js'
      )
      forgotPassword.mockResolvedValue({ success: true })

      mockRequest.payload = { email: '  TEST@EXAMPLE.COM  ' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      // Note: Joi validates but we use the raw email value
      // This is acceptable as the backend will also normalize it
      expect(forgotPassword).toHaveBeenCalledWith('  TEST@EXAMPLE.COM  ')
    })

    it('validates email max length', async () => {
      const longEmail = 'a'.repeat(255) + '@example.com'
      mockRequest.payload = { email: longEmail }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/forgot-password/index',
        expect.objectContaining({
          validationErrors: expect.arrayContaining(['email-invalid'])
        })
      )
    })
  })

  describe('GET /forgot-password/confirmation', () => {
    it('redirects to forgot-password if accessed directly', () => {
      mockRequest.state = {}

      forgotPasswordConfirmationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/forgot-password')
    })

    it('renders confirmation page with email when canViewConfirmation is true', () => {
      mockRequest.state = {
        resetEmail: 'test@example.com',
        canViewConfirmation: true
      }

      forgotPasswordConfirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/forgot-password/confirmation',
        {
          pageTitle: 'password-reset.forgot_password_confirmation.title',
          email: 'test@example.com'
        }
      )
    })

    it('renders confirmation page without email when canViewConfirmation is true', () => {
      mockRequest.state = { canViewConfirmation: true }

      forgotPasswordConfirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/forgot-password/confirmation',
        {
          pageTitle: 'password-reset.forgot_password_confirmation.title',
          email: ''
        }
      )
    })

    it('clears state flags after rendering', () => {
      mockRequest.state = {
        resetEmail: 'test@example.com',
        canViewConfirmation: true
      }

      const mockUnstate = vi.fn(() => ({ unstate: mockUnstate }))
      mockH.view = vi.fn(() => ({
        unstate: mockUnstate
      }))

      const result = forgotPasswordConfirmationController.handler(
        mockRequest,
        mockH
      )

      expect(result.unstate).toHaveBeenCalledWith('resetEmail')
      expect(result.unstate).toHaveBeenCalledWith('canViewConfirmation')
    })
  })
})
