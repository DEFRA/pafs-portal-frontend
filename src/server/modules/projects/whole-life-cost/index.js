import { ROUTES } from '../../../common/constants/routes.js'
import { createEditRoutePair } from '../helpers/route-helpers.js'
import { wholeLifeCostController } from './controller.js'

export const projectWholeLifeCost = {
  plugin: {
    name: 'Project - Whole Life Cost',
    register(server) {
      server.route([
        ...createEditRoutePair(
          ROUTES.PROJECT.EDIT.WHOLE_LIFE_COST,
          wholeLifeCostController
        )
      ])
    }
  }
}
