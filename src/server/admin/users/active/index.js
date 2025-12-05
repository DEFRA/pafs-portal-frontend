import { activeUsersController } from './controller.js'
import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const activeUsers = {
  plugin: {
    name: 'Admin Active Users',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USERS_ACTIVE,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...activeUsersController
        }
      ])
    }
  }
}
