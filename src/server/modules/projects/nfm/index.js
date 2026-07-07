import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireNfmOrSudIntervention } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { requireSelectedMeasure } from './helpers/measure-guard.js'
import { requireNfmInclusion } from './helpers/inclusion-guard.js'
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
  { method: requireNfmOrSudIntervention },
  { method: requireNfmInclusion }
]

const createMeasureEditPreHandlers = () => [
  ...createEditPreHandlers(),
  { method: requireSelectedMeasure }
]

const getRoutesForPaths = (paths, preHandlers) =>
  paths.flatMap((path) => createRoutePair(path, preHandlers, nfmController))

const NFM_MEASURE_PATHS = [
  ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
  ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
  ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
  ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
  ROUTES.PROJECT.EDIT.NFM.WOODLAND,
  ROUTES.PROJECT.EDIT.NFM.HEADWATER_DRAINAGE,
  ROUTES.PROJECT.EDIT.NFM.RUNOFF_MANAGEMENT,
  ROUTES.PROJECT.EDIT.NFM.SALTMARSH,
  ROUTES.PROJECT.EDIT.NFM.SAND_DUNE,
  ROUTES.PROJECT.EDIT.NFM.FLOODPLAIN_WETLAND_RESTORATION
]

const NFM_LAND_USE_PATHS = [
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_ARABLE_FARMLAND,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_DAIRYING_FARMLAND,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_SEMI_NATURAL_GRASSLAND,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND_FOR_TIMBER_HARVESTING,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_MOUNTAIN_MOORS_AND_HEATH,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_PEATLAND_DEGRADED,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_PEATLAND_RESTORATION,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_RIVERS_WETLANDS_FRESHWATER,
  ROUTES.PROJECT.EDIT.NFM.LAND_USE_COASTAL_MARGINS,
  ROUTES.PROJECT.EDIT.NFM.LANDOWNER_CONSENT,
  ROUTES.PROJECT.EDIT.NFM.EXPERIENCE,
  ROUTES.PROJECT.EDIT.NFM.PROJECT_READINESS
]

const getNfmMeasureRoutes = (editPreHandlers, measureEditPreHandlers) => [
  ...createRoutePair(
    ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
    editPreHandlers,
    nfmController
  ),
  ...getRoutesForPaths(NFM_MEASURE_PATHS.slice(1), measureEditPreHandlers)
]

const getNfmLandUseRoutes = (editPreHandlers) =>
  getRoutesForPaths(NFM_LAND_USE_PATHS, editPreHandlers)

export const projectNfm = {
  plugin: {
    name: 'Project - NFM',
    register(server) {
      const editPreHandlers = createEditPreHandlers()
      const measureEditPreHandlers = createMeasureEditPreHandlers()

      // NFM Inclusion route (SUDS-only intervention types)
      const inclusionPreHandlers = [
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireNfmOrSudIntervention }
      ]

      server.route([
        ...createRoutePair(
          ROUTES.PROJECT.EDIT.NFM.INCLUSION,
          inclusionPreHandlers,
          nfmController
        ),
        ...getNfmMeasureRoutes(editPreHandlers, measureEditPreHandlers),
        ...getNfmLandUseRoutes(editPreHandlers)
      ])
    }
  }
}
