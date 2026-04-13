import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForOverview,
  initializeEditSessionPreHandler
} from '../../projects/helpers/project-edit-session.js'
import { individualDownloadsController } from './controller.js'
import { requireViewPermission } from '../../projects/helpers/permissions.js'

export const individualDownloads = {
  plugin: {
    name: 'Downloads - Individual Project',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.INDIVIDUAL,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForOverview },
              {
                method: (request, h) =>
                  initializeEditSessionPreHandler(request, h, {
                    forceRefresh: true
                  })
              },
              { method: requireViewPermission }
            ],
            handler: individualDownloadsController.getHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.MODERATION,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForOverview },
              {
                method: (request, h) =>
                  initializeEditSessionPreHandler(request, h, {
                    forceRefresh: true
                  })
              },
              { method: requireViewPermission }
            ],
            handler: individualDownloadsController.downloadModerationHandler
          }
        }
      ])
    }
  }
}
