import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { riskAndPropertiesController } from './controller.js'

const controller = riskAndPropertiesController

export const projectRiskAndProperties = {
  plugin: {
    name: 'Project - Risk and Properties Benefitting',
    register(server) {
      server.route([
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.RISK, controller),
        ...createEditRoutePair(ROUTES.PROJECT.EDIT.MAIN_RISK, controller),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CURRENT_FLOOD_FLUVIAL_RISK,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK,
          controller
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CURRENT_COASTAL_EROSION_RISK,
          controller
        )
      ])
    }
  }
}
