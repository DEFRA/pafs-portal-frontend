import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  noEditSessionRequired,
  requireEditPermission,
  requireInterventionTypesSet,
  requireProjectAreaSet,
  requireProjectTypeSet,
  requireRmaUser
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { typeController } from './controller.js'

/**
 * Create GET/POST route pair for creation and edit modes
 */
const createRoutePair = (
  createPath,
  editPath,
  createPreHandlers,
  controller
) => {
  const editPreHandlers = [
    { method: requireAuth },
    { method: fetchProjectForEdit },
    { method: initializeEditSessionPreHandler },
    { method: requireEditPermission }
  ]

  return [
    {
      method: 'GET',
      path: createPath,
      options: { pre: createPreHandlers, handler: controller.getHandler }
    },
    {
      method: 'POST',
      path: createPath,
      options: { pre: createPreHandlers, handler: controller.postHandler }
    },
    {
      method: 'GET',
      path: editPath,
      options: { pre: editPreHandlers, handler: controller.getHandler }
    },
    {
      method: 'POST',
      path: editPath,
      options: { pre: editPreHandlers, handler: controller.postHandler }
    }
  ]
}

export const projectType = {
  plugin: {
    name: 'Project - Project Type',
    register(server) {
      const basePreHandlers = [
        { method: requireRmaUser },
        { method: noEditSessionRequired }
      ]

      server.route([
        ...createRoutePair(
          ROUTES.PROJECT.TYPE,
          ROUTES.PROJECT.EDIT.TYPE,
          [...basePreHandlers, requireProjectAreaSet],
          typeController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.INTERVENTION_TYPE,
          ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
          [...basePreHandlers, requireProjectTypeSet],
          typeController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE,
          ROUTES.PROJECT.EDIT.PRIMARY_INTERVENTION_TYPE,
          [...basePreHandlers, requireInterventionTypesSet],
          typeController
        )
      ])
    }
  }
}
