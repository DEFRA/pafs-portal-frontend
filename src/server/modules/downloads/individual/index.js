import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForOverview,
  initializeEditSessionPreHandler
} from '../../projects/helpers/project-edit-session.js'
import { individualDownloadsController } from './controller.js'
import { requireViewPermission } from '../../projects/helpers/permissions.js'

const PRE_HANDLERS = [
  { method: requireAuth },
  { method: fetchProjectForOverview },
  {
    method: (request, h) =>
      initializeEditSessionPreHandler(request, h, {
        forceRefresh: true
      })
  },
  { method: requireViewPermission }
]

export const individualDownloads = {
  plugin: {
    name: 'Downloads - Individual Project',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.INDIVIDUAL,
          options: {
            pre: PRE_HANDLERS,
            handler: individualDownloadsController.getHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.MODERATION,
          options: {
            pre: PRE_HANDLERS,
            handler: individualDownloadsController.downloadModerationHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.FCERM1_LEGACY,
          options: {
            pre: PRE_HANDLERS,
            handler: individualDownloadsController.downloadFcerm1LegacyHandler
          }
        }
      ])
    }
  }
}
