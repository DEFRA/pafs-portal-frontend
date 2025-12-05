import { pendingUsersController } from './controller.js'
import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const pendingUsers = {
  plugin: {
    name: 'Admin Pending Users',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USERS_PENDING,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...pendingUsersController
        }
      ])
    }
  }
}
