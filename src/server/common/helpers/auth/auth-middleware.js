import {
  getAuthSession,
  isSessionExpired,
  shouldRefreshToken,
  refreshAuthSession,
  updateActivity,
  clearAuthSession
} from './session-manager.js'
import { ROUTES } from '../../constants/routes.js'

export async function requireAuth(request, h) {
  const session = getAuthSession(request)

  if (!session) {
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  if (isSessionExpired(session)) {
    clearAuthSession(request)
    return h.redirect(`${ROUTES.LOGIN}?error=session-timeout`).takeover()
  }

  if (shouldRefreshToken(session)) {
    const result = await refreshAuthSession(request)

    if (!result.success) {
      // Always show session timeout message for any refresh failure
      return h.redirect(`${ROUTES.LOGIN}?error=session-timeout`).takeover()
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
