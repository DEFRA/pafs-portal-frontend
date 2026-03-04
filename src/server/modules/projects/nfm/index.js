import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireNfmOrSudIntervention } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { nfmController } from './controller.js'

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

export const projectNfm = {
  plugin: {
    name: 'Project - NFM',
    register(server) {
      const editPreHandlers = [
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireNfmOrSudIntervention }
      ]

      server.route([
        ...createRoutePair(
          ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
          editPreHandlers,
          nfmController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
          editPreHandlers,
          nfmController
        ),
        ...createRoutePair(
          ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
          editPreHandlers,
          nfmController
        )
      ])
    }
  }
}
