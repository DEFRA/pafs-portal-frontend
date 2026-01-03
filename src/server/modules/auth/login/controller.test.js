import { describe, test, expect, beforeEach, vi } from 'vitest'
import { loginController, loginPostController } from './controller.js'
import {
  VALIDATION_CODES,
  VIEW_ERROR_CODES
} from '../../../common/constants/validation.js'

vi.mock('../../../common/services/auth/auth-service.js')
vi.mock('../../../common/helpers/auth/session-manager.js')

const { login } = await import('../../../common/services/auth/auth-service.js')
const { setAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('Login Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      query: {},
      payload: {},
      t: vi.fn((key) => key),
      server: { logger: { error: vi.fn() } },
      yar: {
        flash: vi.fn(() => [])
      }
    }
    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }
    vi.clearAllMocks()
  })

  describe('GET /login', () => {
    test('shows login page', () => {
      loginController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          pageTitle: 'auth.login.title',
          errorCode: '',
          ERROR_CODES: expect.any(Object)
        })
      )
    })

    test('shows error from flash message', () => {
      mockRequest.yar.flash = vi.fn(() => ['session-timeout'])
      loginController.handler(mockRequest, mockH)
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('authError')
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          pageTitle: 'auth.login.title',
          errorCode: 'session-timeout'
        })
      )
    })

    test('shows session-mismatch error from flash', () => {
      mockRequest.yar.flash = vi.fn(() => ['session-mismatch'])
      loginController.handler(mockRequest, mockH)
      expect(mockRequest.yar.flash).toHaveBeenCalledWith('authError')
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          pageTitle: 'auth.login.title',
          errorCode: 'session-mismatch'
        })
      )
    })
  })

  describe('POST /login - validation', () => {
    test('requires email', async () => {
      mockRequest.payload = { password: 'test123' }
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          pageTitle: 'auth.login.title',
          fieldErrors: { email: VALIDATION_CODES.EMAIL_REQUIRED },
          email: ''
        })
      )
    })

    test('validates email format', async () => {
      mockRequest.payload = { email: 'notanemail', password: 'test123' }
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          fieldErrors: { email: VALIDATION_CODES.EMAIL_INVALID_FORMAT },
          email: 'notanemail'
        })
      )
    })

    test('requires password', async () => {
      mockRequest.payload = { email: 'test@example.com' }
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          fieldErrors: { password: VALIDATION_CODES.PASSWORD_REQUIRED },
          email: 'test@example.com'
        })
      )
    })

    test('shows multiple validation errors', async () => {
      mockRequest.payload = {}
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          fieldErrors: {
            email: VALIDATION_CODES.EMAIL_REQUIRED,
            password: VALIDATION_CODES.PASSWORD_REQUIRED
          },
          email: ''
        })
      )
    })
  })

  describe('POST /login - successful login', () => {
    test('redirects general user to home', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'password' }
      login.mockResolvedValue({
        success: true,
        data: {
          user: { id: 1, email: 'user@example.com', admin: false },
          accessToken: 'token123',
          refreshToken: 'refresh123'
        }
      })
      await loginPostController.handler(mockRequest, mockH)
      expect(setAuthSession).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })

    test('redirects admin user to journey selection', async () => {
      mockRequest.payload = { email: 'admin@example.com', password: 'password' }
      login.mockResolvedValue({
        success: true,
        data: {
          user: { id: 1, email: 'admin@example.com', admin: true },
          accessToken: 'token123',
          refreshToken: 'refresh123'
        }
      })
      await loginPostController.handler(mockRequest, mockH)
      expect(setAuthSession).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith('/admin/journey-selection')
    })
  })

  describe('POST /login - backend errors', () => {
    test('shows auth error from backend', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }
      login.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'AUTH_INVALID_CREDENTIALS' }]
      })
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          errorCode: 'AUTH_INVALID_CREDENTIALS',
          warningCode: '',
          supportCode: '',
          pageTitle: 'auth.login.title',
          email: 'user@example.com',
          ERROR_CODES: VIEW_ERROR_CODES
        })
      )
    })

    test('shows backend validation errors as fieldErrors', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }
      login.mockResolvedValue({
        success: false,
        validationErrors: [
          { field: 'email', errorCode: 'VALIDATION_EMAIL_INVALID' }
        ]
      })
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          fieldErrors: { email: 'VALIDATION_EMAIL_INVALID' },
          email: 'user@example.com'
        })
      )
    })

    test('shows warning code', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }
      login.mockResolvedValue({
        success: false,
        errors: [
          {
            errorCode: 'AUTH_INVALID_CREDENTIALS',
            warningCode: 'AUTH_LAST_ATTEMPT_WARNING'
          }
        ]
      })
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({ warningCode: 'AUTH_LAST_ATTEMPT_WARNING' })
      )
    })

    test('shows support code', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }
      login.mockResolvedValue({
        success: false,
        errors: [
          {
            errorCode: 'AUTH_ACCOUNT_DISABLED',
            supportCode: 'AUTH_SUPPORT_CONTACT'
          }
        ]
      })
      await loginPostController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({ supportCode: 'AUTH_SUPPORT_CONTACT' })
      )
    })
  })

  describe('POST /login - service errors', () => {
    test('handles network errors', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'password' }
      login.mockRejectedValue(new Error('Network error'))
      await loginPostController.handler(mockRequest, mockH)
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/login/index',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR',
          email: 'user@example.com'
        })
      )
    })
  })
})
