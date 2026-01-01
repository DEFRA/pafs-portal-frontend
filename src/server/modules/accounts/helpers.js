import { ACCOUNT_SESSION_KEYS } from '../../common/constants/common.js'
import { ROUTES } from '../../common/constants/routes.js'
import { getAuthSession } from '../../common/helpers/auth/session-manager.js'

/**
 * Get the appropriate session key based on context
 * @param {boolean} isAdmin - Whether the request is from an admin context
 * @returns {string} The session key to use
 */
export function getSessionKey(isAdmin) {
  return isAdmin
    ? ACCOUNT_SESSION_KEYS.ADMIN_USER_CREATION
    : ACCOUNT_SESSION_KEYS.SELF_REGISTRATION
}

/**
 * Middleware to ensure account journey starts from the start page
 * Redirects to start if session data doesn't exist (journey not started)
 * @param {boolean} isAdmin - Whether this is an admin flow
 */
export function requireJourneyStarted(isAdmin) {
  return function (request, h) {
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey)

    // If no session data exists or journey not started, redirect to start page
    if (!sessionData || !sessionData.journeyStarted) {
      const startRoute = isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.START
        : ROUTES.GENERAL.ACCOUNTS.START
      return h.redirect(startRoute).takeover()
    }

    return h.continue
  }
}

/**
 * Middleware to prevent logged-in users from accessing self-registration
 * Only applies to general user self-registration flow
 */
export function requireNotAuthenticated(request, h) {
  const session = getAuthSession(request)

  // If user is logged in, redirect to home
  if (session?.user) {
    if (session.user.admin) {
      return h.redirect(ROUTES.ADMIN.JOURNEY_SELECTION).takeover()
    }
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}
