import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { importantDatesController } from './controller.js'

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

// Helper function to create all important dates routes
const createImportantDatesRoutes = (editPreHandlers) => [
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
    editPreHandlers,
    importantDatesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE,
    editPreHandlers,
    importantDatesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT,
    editPreHandlers,
    importantDatesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.START_WORK,
    editPreHandlers,
    importantDatesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.START_BENEFITS,
    editPreHandlers,
    importantDatesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.COULD_START_EARLY,
    editPreHandlers,
    importantDatesController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.EARLIEST_START_DATE,
    editPreHandlers,
    importantDatesController
  )
]

export const projectImportantDates = {
  plugin: {
    name: 'Project - Important Dates',
    register(server) {
      // All important dates routes are edit-only (require referenceNumber)
      const editPreHandlers = [
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireEditPermission }
      ]

      server.route(createImportantDatesRoutes(editPreHandlers))
    }
  }
}
