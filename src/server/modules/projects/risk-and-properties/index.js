import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { riskAndPropertiesController } from './controller.js'

// Helper function to create route pair (GET and POST)
const createRoutePair = (path, preHandlers, controller) => [
  {
    method: 'GET',
    path,
    options: {
      pre: preHandlers,
      handler: controller.getHandler
    }
  },
  {
    method: 'POST',
    path,
    options: {
      pre: preHandlers,
      handler: controller.postHandler
    }
  }
]

// Helper function to create all risk and properties routes
const createRiskAndPropertiesRoutes = (editPreHandlers) => [
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.RISK,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.MAIN_RISK,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.CURRENT_FLOOD_FLUVIAL_RISK,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK,
    editPreHandlers,
    riskAndPropertiesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.CURRENT_COASTAL_EROSION_RISK,
    editPreHandlers,
    riskAndPropertiesController
  )
]

export const projectRiskAndProperties = {
  plugin: {
    name: 'Project - Risk and Properties Benefitting',
    register(server) {
      // All risk and properties routes are edit-only (require referenceNumber)
      const editPreHandlers = [
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireEditPermission }
      ]

      server.route(createRiskAndPropertiesRoutes(editPreHandlers))
    }
  }
}
