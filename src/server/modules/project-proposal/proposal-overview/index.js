import { proposalOverviewController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const proposalOverview = {
  plugin: {
    name: 'Project Proposal - Proposal Overview',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.PROPOSAL_OVERVIEW,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...proposalOverviewController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.PROPOSAL_OVERVIEW,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...proposalOverviewController
        }
      ])
    }
  }
}
