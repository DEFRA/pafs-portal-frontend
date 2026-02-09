import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  noEditSessionRequired,
  requireEditPermission,
  requireJourneyStarted,
  requireRmaUser
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { nameController } from './controller.js'

export const projectName = {
  plugin: {
    name: 'Project - Project Name',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.NAME,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireJourneyStarted
            ],
            handler: nameController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.NAME,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireJourneyStarted
            ],
            handler: nameController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.NAME,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: nameController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.NAME,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: nameController.postHandler
          }
        }
      ])
    }
  }
}
