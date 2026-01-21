import { resendInvitationController } from './controller.js'
import { requireAdmin } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'

export const resendInvitation = {
  plugin: {
    name: 'Admin Resend Invitation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.USER_ACTIONS.RESEND_INVITATION,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...resendInvitationController
        }
      ])
    }
  }
}
