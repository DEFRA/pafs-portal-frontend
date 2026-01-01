import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  forgotPasswordController,
  forgotPasswordPostController,
  forgotPasswordConfirmationController
} from './controller.js'
import { VALIDATION_CODES } from '../../../common/constants/validation.js'

vi.mock('../../../common/services/auth/auth-service.js')

const { forgotPassword } =
  await import('../../../common/services/auth/auth-service.js')

describe('Forgot Password Controller', () => {
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

  describe('GET /forgot-password', () => {
    test('renders forgot password page', () => {
      forgotPasswordController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/forgot-password/index',
        expect.objectContaining({
          pageTitle: 'auth.forgot_password.title',
          fieldErrors: {},
          email: ''
        })
      )
    })
  })

  describe('POST /forgot-password - validation', () => {
    test('requires email', async () => {
      mockRequest.payload = { email: '' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/forgot-password/index',
        expect.objectContaining({
          fieldErrors: { email: VALIDATION_CODES.EMAIL_REQUIRED }
        })
      )
    })

    test('validates email format', async () => {
      mockRequest.payload = { email: 'invalid-email' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/forgot-password/index',
        expect.objectContaining({
          fieldErrors: { email: VALIDATION_CODES.EMAIL_INVALID_FORMAT }
        })
      )
    })
  })

  describe('POST /forgot-password - success', () => {
    test('calls API and redirects to confirmation', async () => {
      forgotPassword.mockResolvedValue({ success: true })
      mockRequest.payload = { email: 'test@example.com' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(forgotPassword).toHaveBeenCalledWith('test@example.com')
      expect(mockRequest.yar.flash).toHaveBeenCalledWith(
        'resetEmail',
        'test@example.com'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/forgot-password/confirmation'
      )
    })

    test('redirects to confirmation even on API error (prevent enumeration)', async () => {
      forgotPassword.mockRejectedValue(new Error('API Error'))
      mockRequest.payload = { email: 'test@example.com' }

      await forgotPasswordPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/forgot-password/confirmation'
      )
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })
  })

  describe('GET /forgot-password/confirmation', () => {
    test('redirects to forgot-password if accessed directly', () => {
      mockRequest.yar.flash.mockReturnValue([])

      forgotPasswordConfirmationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/forgot-password')
    })

    test('renders confirmation page with email from flash', () => {
      mockRequest.yar.flash.mockReturnValue(['test@example.com'])

      forgotPasswordConfirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/forgot-password/confirmation',
        {
          pageTitle: 'auth.forgot_password_confirmation.title',
          email: 'test@example.com'
        }
      )
    })
  })
})
