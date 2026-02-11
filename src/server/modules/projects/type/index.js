import { ROUTES } from '../../../common/constants/routes.js'
import {
  noEditSessionRequired,
  requireInterventionTypesSet,
  requireProjectAreaSet,
  requireProjectTypeSet,
  requireRmaUser
} from '../helpers/permissions.js'
import { createRoutePair } from '../helpers/route-helpers.js'
import { typeController } from './controller.js'

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
