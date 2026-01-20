import { reactivateUserController } from './controller.js'
import { requireAdmin } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'

export const reactivateUser = {
  plugin: {
    name: 'Admin Reactivate User',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USER_ACTIONS.REACTIVATE,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...reactivateUserController
        }
      ])
    }
  }
}
