import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  setPasswordController,
  setPasswordPostController,
  setPasswordTokenExpiredController
} from './controller.js'
import { VIEW_ERROR_CODES } from '../../../common/constants/validation.js'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../../../common/services/auth/auth-service.js')
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../schema.js', () => ({
  passwordFormSchema: {
    validate: vi.fn()
  }
}))

const { validateInvitationToken, setPassword, login } =
  await import('../../../common/services/auth/auth-service.js')
const { setAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')
const { passwordFormSchema } = await import('../schema.js')

describe('setPasswordController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      query: { token: 'valid-invitation-token' },
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn(),
        set: vi.fn(),
        get: vi.fn(),
        clear: vi.fn()
      },
      server: {
        logger: {
          error: vi.fn(),
          warn: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis()
    }
  })

  describe('GET /set-password', () => {
    it('redirects to login when no token provided', async () => {
      mockRequest.query = {}

      await setPasswordController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.LOGIN)
    })

    it('validates invitation token', async () => {
      validateInvitationToken.mockResolvedValue({
        success: true,
        data: { email: 'test@example.com' }
      })

      await setPasswordController.handler(mockRequest, mockH)

      expect(validateInvitationToken).toHaveBeenCalledWith(
        'valid-invitation-token'
      )
    })

    it('stores email in session on valid token', async () => {
      validateInvitationToken.mockResolvedValue({
        success: true,
        data: { email: 'test@example.com' }
      })

      await setPasswordController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'setPasswordEmail',
        'test@example.com'
      )
    })

    it('renders set password form with flowType on valid token', async () => {
      validateInvitationToken.mockResolvedValue({
        success: true,
        data: { email: 'test@example.com' }
      })

      await setPasswordController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/auth/reset-password/index',
        expect.objectContaining({
          token: 'valid-invitation-token',
          flowType: 'invitation',
          fieldErrors: {},
          errorCode: ''
        })
      )
    })

    it('redirects to link-expired on invalid token', async () => {
      validateInvitationToken.mockResolvedValue({ success: false })

      await setPasswordController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('tokenExpired', true)
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.SET_PASSWORD_TOKEN_EXPIRED
      )
    })

    it('redirects to link-expired on error', async () => {
      validateInvitationToken.mockRejectedValue(new Error('API error'))

      await setPasswordController.handler(mockRequest, mockH)

      expect(mockRequest.yar.flash).toHaveBeenCalledWith('tokenExpired', true)
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.SET_PASSWORD_TOKEN_EXPIRED
      )
    })
  })
})

describe('setPasswordPostController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {
        token: 'valid-token',
        newPassword: 'Password123!',
        confirmPassword: 'Password123!'
      },
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn(),
        set: vi.fn(),
        get: vi.fn().mockReturnValue('test@example.com'),
        clear: vi.fn()
      },
      server: {
        logger: {
          error: vi.fn(),
          warn: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis()
    }

    passwordFormSchema.validate.mockReturnValue({
      error: null,
      value: {
        token: 'valid-token',
        newPassword: 'Password123!',
        confirmPassword: 'Password123!'
      }
    })
  })

  it('redirects to link-expired when no token provided', async () => {
    mockRequest.payload = {}

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith('tokenExpired', true)
    expect(mockH.redirect).toHaveBeenCalledWith(
      ROUTES.SET_PASSWORD_TOKEN_EXPIRED
    )
  })

  it('retrieves email from session', async () => {
    setPassword.mockResolvedValue({ success: true })
    login.mockResolvedValue({
      success: true,
      data: { user: { admin: false } }
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.get).toHaveBeenCalledWith('setPasswordEmail')
  })

  it('returns validation errors with flowType', async () => {
    passwordFormSchema.validate.mockReturnValue({
      error: {
        details: [{ path: ['newPassword'], type: 'string.min' }]
      }
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'modules/auth/reset-password/index',
      expect.objectContaining({
        flowType: 'invitation',
        fieldErrors: expect.any(Object),
        token: 'valid-token'
      })
    )
  })

  it('clears session email on successful password set', async () => {
    setPassword.mockResolvedValue({ success: true })
    login.mockResolvedValue({
      success: true,
      data: { user: { admin: false } }
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.clear).toHaveBeenCalledWith('setPasswordEmail')
  })

  it('auto-logs in user on successful password set', async () => {
    setPassword.mockResolvedValue({ success: true })
    login.mockResolvedValue({
      success: true,
      data: { user: { admin: false } }
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(setPassword).toHaveBeenCalledWith(
      'valid-token',
      'Password123!',
      'Password123!'
    )
    expect(login).toHaveBeenCalledWith('test@example.com', 'Password123!')
    expect(setAuthSession).toHaveBeenCalled()
  })

  it('redirects admin users to journey selection', async () => {
    setPassword.mockResolvedValue({ success: true })
    login.mockResolvedValue({
      success: true,
      data: { user: { admin: true } }
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.ADMIN.JOURNEY_SELECTION)
  })

  it('redirects normal users to home', async () => {
    setPassword.mockResolvedValue({ success: true })
    login.mockResolvedValue({
      success: true,
      data: { user: { admin: false } }
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.GENERAL.HOME)
  })

  it('redirects to login if auto-login fails', async () => {
    setPassword.mockResolvedValue({ success: true })
    login.mockResolvedValue({ success: false })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.LOGIN)
  })

  it('redirects to link-expired on invalid token error', async () => {
    setPassword.mockResolvedValue({
      success: false,
      errors: [
        { errorCode: VIEW_ERROR_CODES.INVITATION_TOKEN_EXPIRED_OR_INVALID }
      ]
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith('tokenExpired', true)
    expect(mockH.redirect).toHaveBeenCalledWith(
      ROUTES.SET_PASSWORD_TOKEN_EXPIRED
    )
  })

  it('shows generic error on API failure with flowType', async () => {
    setPassword.mockResolvedValue({
      success: false,
      errors: [{ errorCode: 'SOME_OTHER_ERROR' }]
    })

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'modules/auth/reset-password/index',
      expect.objectContaining({
        flowType: 'invitation',
        errorCode: 'SOME_OTHER_ERROR'
      })
    )
  })

  it('shows network error on exception with flowType', async () => {
    setPassword.mockRejectedValue(new Error('Network error'))

    await setPasswordPostController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'modules/auth/reset-password/index',
      expect.objectContaining({
        flowType: 'invitation',
        errorCode: VIEW_ERROR_CODES.NETWORK_ERROR
      })
    )
  })
})

describe('setPasswordTokenExpiredController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn()
      }
    }

    mockH = {
      view: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis()
    }
  })

  it('redirects to login when no flash session', () => {
    mockRequest.yar.flash.mockReturnValue([])

    setPasswordTokenExpiredController.handler(mockRequest, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.LOGIN)
  })

  it('renders link-expired page when flash session exists', () => {
    mockRequest.yar.flash.mockReturnValue([true])

    setPasswordTokenExpiredController.handler(mockRequest, mockH)

    expect(mockH.view).toHaveBeenCalledWith(
      'modules/auth/set-password/link-expired',
      {
        pageTitle: 'auth.set_password_link_expired.title'
      }
    )
  })
})
