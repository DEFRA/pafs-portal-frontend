import { downloadController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const download = {
  plugin: {
    name: 'Download',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.DOWNLOAD,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...downloadController
        }
      ])
    }
  }
}
