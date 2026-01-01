import { logout } from '../../../common/services/auth/auth-service.js'
import {
  getAuthSession,
  clearAuthSession
} from '../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../common/constants/routes.js'

class LogoutController {
  async get(request, h) {
    const session = getAuthSession(request)
    const userId = session?.user?.id
    const logger = request.server.logger

    // Always clear session first
    clearAuthSession(request)

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
