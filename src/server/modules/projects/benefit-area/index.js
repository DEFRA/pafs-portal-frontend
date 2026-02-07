import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { benefitAreaController } from './controller.js'

export const projectBenefitArea = {
  plugin: {
    name: 'Project - Benefit Area',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.BENEFIT_AREA,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: benefitAreaController.getHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.BENEFIT_AREA_UPLOAD_STATUS,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: benefitAreaController.uploadStatusHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT.EDIT.BENEFIT_AREA_DELETE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: benefitAreaController.getDeleteHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.EDIT.BENEFIT_AREA_DELETE,
          options: {
            pre: [
              { method: requireAuth },
              { method: fetchProjectForEdit },
              { method: initializeEditSessionPreHandler },
              { method: requireEditPermission }
            ],
            handler: benefitAreaController.postDeleteHandler
          }
        }
      ])
    }
  }
}
