import { interventionTypeController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  requireProjectName,
  requireProjectType
} from '../helpers/proposal-guard.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const interventionType = {
  plugin: {
    name: 'Project Proposal - Intervention Type',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType
            ]
          },
          ...interventionTypeController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE,
          options: {
            pre: [
              { method: requireAuth },
              requireProjectName,
              requireProjectType
            ]
          },
          ...interventionTypeController
        }
      ])
    }
  }
}
