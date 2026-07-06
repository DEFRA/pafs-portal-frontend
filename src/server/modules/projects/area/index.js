import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  noEditSessionRequired,
  requireProjectNameSet,
  requireProposalCreator,
  requireEditableStatus,
  requireEditPermission
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { areaController } from './controller.js'

export const projectArea = {
  plugin: {
    name: 'Project - Project Area',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.AREA,
          options: {
            pre: [
              { method: requireProposalCreator },
              { method: noEditSessionRequired },
              requireProjectNameSet
            ],
            handler: areaController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.AREA,
          options: {
            pre: [
              { method: requireProposalCreator },
              { method: noEditSessionRequired },
              requireProjectNameSet
            ],
            handler: areaController.postHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.AREA,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditableStatus },
              { method: requireEditPermission }
            ],
            handler: areaController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.AREA,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditableStatus },
              { method: requireEditPermission }
            ],
            handler: areaController.postHandler
          }
        }
      ])
    }
  }
}
