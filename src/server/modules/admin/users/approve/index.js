import { approveUserController } from './controller.js'
import { requireAdmin } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'

export const approveUser = {
  plugin: {
    name: 'Admin Approve User',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USER_ACTIONS.APPROVE,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...approveUserController
        }
      ])
    }
  }
}
