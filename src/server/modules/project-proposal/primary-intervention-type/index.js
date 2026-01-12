import { primaryInterventionTypeController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  requireProjectName,
  requireProjectType,
  requireInterventionType
} from '../common/proposal-guard.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const primaryInterventionType = {
  plugin: {
    name: 'Project Proposal - Primary Intervention Type',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.PRIMARY_INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType,
              requireInterventionType
            ]
          },
          ...primaryInterventionTypeController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.PRIMARY_INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType,
              requireInterventionType
            ]
          },
          ...primaryInterventionTypeController
        }
      ])
    }
  }
}
