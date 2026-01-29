import { projectTypeController } from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireProjectName } from '../common/proposal-guard.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const projectType = {
  plugin: {
    name: 'Project Proposal - Project Type',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE,
          options: {
            pre: [{ method: requireAuth }, requireProjectName]
          },
          ...projectTypeController
        },
        {
          method: 'GET',
          path: ROUTES.PROJECT_PROPOSAL.EDIT.PROJECT_TYPE,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectTypeController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE,
          options: {
            pre: [{ method: requireAuth }, requireProjectName]
          },
          ...projectTypeController
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT_PROPOSAL.EDIT.PROJECT_TYPE,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectTypeController
        }
      ])
    }
  }
}
