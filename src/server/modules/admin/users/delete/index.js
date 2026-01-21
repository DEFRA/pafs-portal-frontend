import { deleteUserController } from './controller.js'
import { requireAdmin } from '../../../../common/helpers/auth/auth-middleware.js'
import { fetchAccountForAdmin } from '../../../accounts/helpers/fetch-account-for-admin.js'
import { ROUTES } from '../../../../common/constants/routes.js'

export const deleteUser = {
  plugin: {
    name: 'Admin Delete User',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USER_ACTIONS.DELETE,
          options: {
            pre: [
              { method: requireAdmin },
              { method: fetchAccountForAdmin, assign: 'accountData' }
            ]
          },
          handler: deleteUserController.getHandler
        },
        {
          method: 'POST',
          path: ROUTES.ADMIN.USER_ACTIONS.DELETE,
          options: {
            pre: [{ method: requireAdmin }]
          },
          handler: deleteUserController.postHandler
        }
      ])
    }
  }
}
