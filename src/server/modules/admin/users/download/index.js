import { downloadUsersController } from './controller.js'
import { requireAdmin } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'

export const downloadUsers = {
  plugin: {
    name: 'Admin Download Users',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USERS_DOWNLOAD,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...downloadUsersController
        }
      ])
    }
  }
}
