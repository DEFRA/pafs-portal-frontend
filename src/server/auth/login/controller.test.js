import { describe, test, expect, beforeEach, vi } from 'vitest'
import { loginController, loginPostController } from './controller.js'

vi.mock('../../common/services/auth/auth-service.js')
vi.mock('../../common/helpers/auth/session-manager.js')

const { login } = await import('../../common/services/auth/auth-service.js')
const { setAuthSession } = await import(
  '../../common/helpers/auth/session-manager.js'
)

describe('Login Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      query: {},
      payload: {},
      t: vi.fn((key) => key),
      server: {
        logger: {
          error: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    vi.clearAllMocks()
  })

  describe('GET /login', () => {
    test('shows login page', async () => {
      await loginController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        error: undefined
      })
    })

    test('shows error from query string', async () => {
      mockRequest.query.error = 'session-timeout'

      await loginController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        errorCode: 'session-timeout'
      })
    })
  })

  describe('POST /login - validation', () => {
    test('requires email', async () => {
      mockRequest.payload = { password: 'test123' }

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        validationErrors: ['email-required'],
        email: ''
      })
    })

    test('validates email format', async () => {
      mockRequest.payload = { email: 'notanemail', password: 'test123' }

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        validationErrors: ['email-invalid'],
        email: 'notanemail'
      })
    })

    test('requires password', async () => {
      mockRequest.payload = { email: 'test@example.com' }

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        validationErrors: ['password-required'],
        email: 'test@example.com'
      })
    })

    test('shows multiple validation errors', async () => {
      mockRequest.payload = {} // Both email and password missing

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        validationErrors: ['email-required', 'password-required'],
        email: ''
      })
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

    test('redirects admin user to journey selection page', async () => {
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
    test('shows error message from backend', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }

      login.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_INVALID_CREDENTIALS'
        }
      })

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        warningCode: undefined,
        supportCode: undefined,
        email: 'user@example.com'
      })
    })

    test('shows warning message', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }

      login.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_INVALID_CREDENTIALS',
          warningCode: 'AUTH_LAST_ATTEMPT_WARNING'
        }
      })

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/login/index',
        expect.objectContaining({
          warningCode: 'AUTH_LAST_ATTEMPT_WARNING'
        })
      )
    })

    test('shows support message', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'wrong' }

      login.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_ACCOUNT_DISABLED',
          supportCode: 'AUTH_SUPPORT_CONTACT'
        }
      })

      await loginPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'auth/login/index',
        expect.objectContaining({
          supportCode: 'AUTH_SUPPORT_CONTACT'
        })
      )
    })
  })

  describe('POST /login - service errors', () => {
    test('handles unexpected errors', async () => {
      mockRequest.payload = { email: 'user@example.com', password: 'password' }

      login.mockRejectedValue(new Error('Network error'))

      await loginPostController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith('auth/login/index', {
        pageTitle: 'common.sign_in',
        errorMessage: 'auth.service_error',
        email: 'user@example.com'
      })
    })
  })
})
