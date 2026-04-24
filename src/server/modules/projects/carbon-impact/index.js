import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { carbonImpactController } from './controller.js'

export const projectCarbonImpact = {
  plugin: {
    name: 'Project - Carbon Impact',
    register(server) {
      server.route([
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_IMPACT,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_REQUIRED_INFORMATION,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_PREPARE,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_COST_BUILD,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_COST_OPERATION,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_COST_SEQUESTERED,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_COST_AVOIDED,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_OPERATIONAL_COST_FORECAST,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.WHOLE_LIFE_CARBON,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.NET_CARBON,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_SUMMARY,
          carbonImpactController
        ),
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.CARBON_IMPACT_ASSESSMENT,
          carbonImpactController
        )
      ])
    }
  }
}
