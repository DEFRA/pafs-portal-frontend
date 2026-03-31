import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { wholeLifeBenefitsController } from './controller.js'

export const projectWholeLifeBenefits = {
  plugin: {
    name: 'Project - Whole Life Benefits',
    register(server) {
      server.route([
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.WHOLE_LIFE_BENEFITS,
          wholeLifeBenefitsController
        )
      ])
    }
  }
}
