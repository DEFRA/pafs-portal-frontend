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

export async function requireAuth(request, h) {
  const session = getAuthSession(request)

  if (!session) {
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  if (isSessionExpired(session)) {
    clearAuthSession(request)
    request.yar.flash('authError', SESSION.SESSION_TIMEOUT)
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  // Validate session on every page load with lightweight API call
  const validationResult = await validateSession(session.accessToken)
  if (!validationResult.success) {
    const errorCode = validationResult.errors?.[0]?.errorCode

    if (errorCode === AUTH_ERROR_CODES.SESSION_MISMATCH) {
      clearAuthSession(request)
      request.yar.flash('authError', SESSION.SESSION_MISMATCH)
      return h.redirect(ROUTES.LOGIN).takeover()
    }

    // Otherwise show session timeout message
    clearAuthSession(request)
    request.yar.flash('authError', SESSION.SESSION_TIMEOUT)
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  if (shouldRefreshToken(session)) {
    const result = await refreshAuthSession(request)

    if (!result.success) {
      // Check for concurrent session (session mismatch)
      if (result.reason === AUTH_ERROR_CODES.SESSION_MISMATCH) {
        request.yar.flash('authError', SESSION.SESSION_MISMATCH)
        return h.redirect(ROUTES.LOGIN).takeover()
      }
      // All other errors show session timeout
      request.yar.flash('authError', SESSION.SESSION_TIMEOUT)
      return h.redirect(ROUTES.LOGIN).takeover()
    }
  }

  updateActivity(request)
  return h.continue
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
    if (session.user.admin) {
      return h.redirect(ROUTES.ADMIN.USERS).takeover()
    }
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}
