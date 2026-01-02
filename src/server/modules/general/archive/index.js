import { archiveController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const archive = {
  plugin: {
    name: 'Archive',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.ARCHIVE,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...archiveController
        }
      ])
    }
  }
}
