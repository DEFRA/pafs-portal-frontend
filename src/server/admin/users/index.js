import { usersController } from './controller.js'
import { requireAdmin } from '../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../common/constants/routes.js'

export const users = {
  plugin: {
    name: 'Admin Users',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USERS,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...usersController
        }
      ])
    }
  }
}
