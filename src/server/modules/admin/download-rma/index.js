import { downloadRMAController } from './controller.js'
import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const downloadRMA = {
  plugin: {
    name: 'Admin Download RMA',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.DOWNLOAD_RMA,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...downloadRMAController
        }
      ])
    }
  }
}
