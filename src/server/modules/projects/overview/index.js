import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForOverview,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { overviewController } from './controller.js'
import { requireViewPermission } from '../helpers/permissions.js'

export const projectOverview = {
  plugin: {
    name: 'Project - Project Overview',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.OVERVIEW,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForOverview },
              { method: initializeEditSessionPreHandler },
              { method: requireViewPermission }
            ],
            handler: overviewController.getHandler
          }
        }
      ])
    }
  }
}
