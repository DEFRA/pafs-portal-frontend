import { projectNameController } from './controller.js'
import { requireAuth } from '../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../common/constants/routes.js'

export const projectName = {
  plugin: {
    name: 'Project Proposal - Project Name',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.PROJECT_NAME,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectNameController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.PROJECT_NAME,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectNameController
        }
      ])
    }
  }
}
