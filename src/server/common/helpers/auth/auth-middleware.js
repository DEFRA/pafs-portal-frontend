import {
  getAuthSession,
  isSessionExpired,
  shouldRefreshToken,
  refreshAuthSession,
  updateActivity,
  clearAuthSession
} from './session-manager.js'
import { ROUTES } from '../../constants/routes.js'
import { validateSession } from '../../services/auth/auth-service.js'
import { AUTH_ERROR_CODES } from '../../constants/validation.js'
import { SESSION } from '../../constants/common.js'

/**
 * Redirect to login with error message
 * @private
 */
function redirectToLogin(request, h, errorMessage) {
  clearAuthSession(request)
  request.yar.flash('authError', errorMessage)
  return h.redirect(ROUTES.LOGIN).takeover()
}

/**
 * Get appropriate error message based on error code
 * @private
 */
function getErrorMessage(errorCode) {
  return errorCode === AUTH_ERROR_CODES.SESSION_MISMATCH
    ? SESSION.SESSION_MISMATCH
    : SESSION.SESSION_TIMEOUT
}

/**
 * Validate session token
 * @private
 */
async function validateSessionToken(request, h, accessToken) {
  const validationResult = await validateSession(accessToken)
  if (!validationResult.success) {
    const errorCode = validationResult.errors?.[0]?.errorCode
    return redirectToLogin(request, h, getErrorMessage(errorCode))
  }
  return null
}

/**
 * Handle token refresh and validation
 * @private
 */
async function handleTokenRefresh(request, h) {
  const result = await refreshAuthSession(request)
  if (!result.success) {
    return redirectToLogin(request, h, getErrorMessage(result.reason))
  }

  const refreshedSession = getAuthSession(request)
  if (!refreshedSession) {
    return redirectToLogin(request, h, SESSION.SESSION_TIMEOUT)
  }

  return validateSessionToken(request, h, refreshedSession.accessToken)
}

/**
 * Handle validation failure with optional refresh attempt
 * @private
 */
async function handleValidationFailure(request, h, session, errorCode) {
  if (errorCode === AUTH_ERROR_CODES.SESSION_MISMATCH) {
    return redirectToLogin(request, h, SESSION.SESSION_MISMATCH)
  }

  if (isSessionExpired(session)) {
    return redirectToLogin(request, h, SESSION.SESSION_TIMEOUT)
  }

  const refreshResult = await refreshAuthSession(request)
  if (refreshResult.success) {
    updateActivity(request)
    return h.continue
  }

  return redirectToLogin(request, h, SESSION.SESSION_TIMEOUT)
}

export async function requireAuth(request, h) {
  const session = getAuthSession(request)

  if (!session) {
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  if (isSessionExpired(session)) {
    return redirectToLogin(request, h, SESSION.SESSION_TIMEOUT)
  }

  if (shouldRefreshToken(session)) {
    const refreshError = await handleTokenRefresh(request, h)
    if (refreshError) {
      return refreshError
    }
    updateActivity(request)
    return h.continue
  }

  const validationResult = await validateSession(session.accessToken)
  if (validationResult.success) {
    updateActivity(request)
    return h.continue
  }

  const errorCode = validationResult.errors?.[0]?.errorCode
  return handleValidationFailure(request, h, session, errorCode)
}

export async function requireAdmin(request, h) {
  const authResult = await requireAuth(request, h)

  if (authResult !== h.continue) {
    return authResult
  }

  const session = getAuthSession(request)

  if (!session?.user?.admin) {
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}

export function redirectIfAuth(request, h) {
  const session = getAuthSession(request)

  if (session && !isSessionExpired(session)) {
    const redirectRoute = session.user?.admin
      ? ROUTES.ADMIN.USERS
      : ROUTES.GENERAL.HOME
    return h.redirect(redirectRoute).takeover()
  }

  return h.continue
}
