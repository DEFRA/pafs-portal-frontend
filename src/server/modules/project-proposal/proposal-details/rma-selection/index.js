import { rmaSelectionController } from './controller.js'
import { requireAuth } from '../../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { requireProjectName } from '../../helpers/proposal-guard.js'

export const rmaSelection = {
  plugin: {
    name: 'Project Proposal - RMA Selection',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.RMA_SELECTION,
          options: {
            pre: [{ method: requireAuth }, requireProjectName]
          },
          ...rmaSelectionController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.RMA_SELECTION,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...rmaSelectionController
        }
      ])
    }
  }
}
