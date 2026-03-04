import { requireAuth } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { fetchProjectForOverview } from '../../../projects/helpers/project-edit-session.js'
import {
  requireViewPermission,
  requireStatusManagePermission
} from '../../../projects/helpers/permissions.js'
import { archiveController } from './controller.js'
import { projectsListingController } from '../../../projects/listing/controller.js'

export const projectArchive = {
  plugin: {
    name: 'General - Project Archive',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.ARCHIVE,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectsListingController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.ARCHIVE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForOverview },
              { method: requireViewPermission },
              { method: requireStatusManagePermission }
            ],
            handler: archiveController.archiveHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.ARCHIVE_CONFIRMATION,
          options: {
            pre: [{ method: requireAuth }],
            handler: archiveController.confirmationHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.REVERT_TO_DRAFT,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForOverview },
              { method: requireViewPermission },
              { method: requireStatusManagePermission }
            ],
            handler: archiveController.revertToDraftHandler
          }
        }
      ])
    }
  }
}
