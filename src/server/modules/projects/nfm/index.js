import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireNfmOrSudIntervention } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { requireSelectedMeasure } from './helpers/measure-guard.js'
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

const createEditPreHandlers = () => [
  { method: requireAuth },
  { method: fetchProjectForEdit },
  { method: initializeEditSessionPreHandler },
  { method: requireNfmOrSudIntervention }
]

const createMeasureEditPreHandlers = () => [
  ...createEditPreHandlers(),
  { method: requireSelectedMeasure }
]

const getNfmMeasureRoutes = (editPreHandlers, measureEditPreHandlers) => [
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.WOODLAND,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.HEADWATER_DRAINAGE,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.RUNOFF_MANAGEMENT,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.SALTMARSH,
    measureEditPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.SAND_DUNE,
    measureEditPreHandlers,
    nfmController
  )
]

const getNfmLandUseRoutes = (editPreHandlers) => [
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_ARABLE_FARMLAND,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_DAIRYING_FARMLAND,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_SEMI_NATURAL_GRASSLAND,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_MOUNTAIN_MOORS_AND_HEATH,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_PEATLAND_RESTORATION,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_RIVERS_WETLANDS_FRESHWATER,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_COASTAL_MARGINS,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.LANDOWNER_CONSENT,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.EXPERIENCE,
    editPreHandlers,
    nfmController
  ),
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.PROJECT_READINESS,
    editPreHandlers,
    nfmController
  )
]

export const projectNfm = {
  plugin: {
    name: 'Project - NFM',
    register(server) {
      const editPreHandlers = createEditPreHandlers()
      const measureEditPreHandlers = createMeasureEditPreHandlers()
      server.route([
        ...getNfmMeasureRoutes(editPreHandlers, measureEditPreHandlers),
        ...getNfmLandUseRoutes(editPreHandlers)
      ])
    }
  }
}
