import {
  setPassword,
  validateInvitationToken,
  login
} from '../../common/services/auth/auth-service.js'
import { setAuthSession } from '../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../common/constants/routes.js'
import { VIEW_ERROR_CODES } from '../../common/constants/validation.js'
import { AUTH_VIEWS, LOCALE_KEYS } from '../../common/constants/common.js'
import { extractJoiErrors } from '../../common/helpers/error-renderer.js'
import { passwordFormSchema } from '../schema.js'

const FLOW_TYPE = 'invitation'
const SESSION_KEY_EMAIL = 'setPasswordEmail'

/**
 * GET /set-password - Show set password form for invitation flow
 */
export const setPasswordController = {
  async handler(request, h) {
    const { token } = request.query

    if (!token) {
      return h.redirect(ROUTES.LOGIN)
    }

    try {
      const result = await validateInvitationToken(token)

      if (!result.success) {
        request.yar.flash('tokenExpired', true)
        return h.redirect(ROUTES.SET_PASSWORD_TOKEN_EXPIRED)
      }

      // Store email in session for use during POST (not in hidden form field)
      request.yar.set(SESSION_KEY_EMAIL, result.data?.email)

      return h.view(AUTH_VIEWS.SET_PASSWORD, {
        pageTitle: request.t(LOCALE_KEYS.PASSWORD_SET),
        flowType: FLOW_TYPE,
        token,
        fieldErrors: {},
        errorCode: '',
        ERROR_CODES: VIEW_ERROR_CODES
      })
    } catch (err) {
      request.server.logger.error({ err }, 'Error validating invitation token')
      request.yar.flash('tokenExpired', true)
      return h.redirect(ROUTES.SET_PASSWORD_TOKEN_EXPIRED)
    }
  }
}

/**
 * POST /set-password - Process password set for invitation flow
 */
export const setPasswordPostController = {
  async handler(request, h) {
    const { token, newPassword, confirmPassword } = request.payload || {}

    if (!token) {
      request.yar.flash('tokenExpired', true)
      return h.redirect(ROUTES.SET_PASSWORD_TOKEN_EXPIRED)
    }

    // Get email from session (set during GET request after token validation)
    const email = request.yar.get(SESSION_KEY_EMAIL)

    // Validate input using schema
    const { error, value } = passwordFormSchema.validate(
      { token, newPassword, confirmPassword },
      { abortEarly: false }
    )

    if (error) {
      return h.view(AUTH_VIEWS.SET_PASSWORD, {
        pageTitle: request.t(LOCALE_KEYS.PASSWORD_SET),
        flowType: FLOW_TYPE,
        fieldErrors: extractJoiErrors(error),
        token,
        errorCode: '',
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }

    try {
      const result = await setPassword(
        value.token,
        value.newPassword,
        value.confirmPassword
      )

      if (!result.success) {
        return handleSetPasswordError(result, token, request, h)
      }

      // Clear the session email
      request.yar.clear(SESSION_KEY_EMAIL)

      // Success - auto-login with the new password
      return await autoLoginAndRedirect(email, value.newPassword, request, h)
    } catch (err) {
      request.server.logger.error({ err }, 'Set password error')
      return h.view(AUTH_VIEWS.SET_PASSWORD, {
        pageTitle: request.t(LOCALE_KEYS.PASSWORD_SET),
        flowType: FLOW_TYPE,
        fieldErrors: {},
        errorCode: VIEW_ERROR_CODES.NETWORK_ERROR,
        token,
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }
  }
}

/**
 * Handle API errors from set password
 */
function handleSetPasswordError(result, token, request, h) {
  const errorData = result.errors?.[0]

  // Token expired or invalid - redirect to token expired page
  if (
    errorData?.errorCode ===
    VIEW_ERROR_CODES.INVITATION_TOKEN_EXPIRED_OR_INVALID
  ) {
    request.yar.flash('tokenExpired', true)
    return h.redirect(ROUTES.SET_PASSWORD_TOKEN_EXPIRED)
  }

  // Generic error
  return h.view(AUTH_VIEWS.SET_PASSWORD, {
    pageTitle: request.t(LOCALE_KEYS.PASSWORD_SET),
    flowType: FLOW_TYPE,
    fieldErrors: {},
    errorCode: errorData?.errorCode || VIEW_ERROR_CODES.UNKNOWN_ERROR,
    token,
    ERROR_CODES: VIEW_ERROR_CODES
  })
}

/**
 * Auto-login the user after successful password set and redirect based on role
 */
async function autoLoginAndRedirect(email, password, request, h) {
  try {
    const loginResult = await login(email, password)

    if (loginResult.success) {
      setAuthSession(request, loginResult.data)

      // Redirect based on user role
      if (loginResult.data.user.admin) {
        return h.redirect(ROUTES.ADMIN.JOURNEY_SELECTION)
      }
      return h.redirect(ROUTES.GENERAL.HOME)
    }

    // If auto-login fails, redirect to login page
    request.server.logger.warn(
      { email },
      'Auto-login failed after password set'
    )
    return h.redirect(ROUTES.LOGIN)
  } catch (err) {
    request.server.logger.error({ err }, 'Auto-login error after password set')
    return h.redirect(ROUTES.LOGIN)
  }
}

/**
 * GET /set-password/link-expired - Show link expired page
 */
export const setPasswordTokenExpiredController = {
  handler(request, h) {
    // Check flash session for access control
    const flashExpired = request.yar.flash('tokenExpired')

    if (!flashExpired?.[0]) {
      return h.redirect(ROUTES.LOGIN)
    }

    return h.view(AUTH_VIEWS.SET_PASSWORD_TOKEN_EXPIRED, {
      pageTitle: request.t('auth.set_password_link_expired.title')
    })
  }
}
