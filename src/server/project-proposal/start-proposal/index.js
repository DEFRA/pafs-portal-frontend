import { projectProposalStartController } from './controller.js'
import { requireAuth } from '../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../common/constants/routes.js'

/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const projectProposalStart = {
  plugin: {
    name: 'Start Proposal',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.START_PROPOSAL,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectProposalStartController
        }
      ])
    }
  }
}
