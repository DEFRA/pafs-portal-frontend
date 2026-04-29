import { logout } from '../../../common/services/auth/auth-service.js'
import {
  getAuthSession,
  clearAuthSession
} from '../../../common/helpers/auth/session-manager.js'
import { isValidReturnUrl } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

class LogoutController {
  async get(request, h) {
    const session = getAuthSession(request)
    const userId = session?.user?.id
    const logger = request.server.logger

    // Capture where the user was before logout, so they return there on next login.
    // Must be extracted before yar.reset() wipes the session.
    let returnPath = null
    const referer = request.info.referrer
    if (referer) {
      try {
        const { pathname, search } = new URL(referer)
        const candidate = pathname + (search || '')
        if (isValidReturnUrl(candidate)) {
          returnPath = candidate
        }
      } catch (err) {
        logger.debug(
          { err },
          'Malformed Referer header on logout — returnTo not saved'
        )
      }
    }

    // Always clear session first (calls yar.reset() — wipes everything)
    clearAuthSession(request)

    // Re-set returnTo after the reset so the login controller can use it
    if (returnPath) {
      request.yar.set('returnTo', returnPath)
    }

    // Attempt to notify backend, but don't block logout if it fails
    if (session?.accessToken) {
      try {
        await logout(session.accessToken)
        logger.info({ userId }, 'User logged out successfully')
      } catch (error) {
        // Log error but still proceed with logout
        logger.warn(
          { err: error, userId },
          'Logout API call failed, but session cleared'
        )
      }
    } else {
      logger.info({ userId }, 'User logged out (no active session)')
    }

    return h.redirect(ROUTES.LOGIN)
  }
}

const controller = new LogoutController()

export const logoutController = {
  handler: (request, h) => controller.get(request, h)
}
