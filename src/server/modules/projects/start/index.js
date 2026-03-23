import { ROUTES } from '../../../common/constants/routes.js'
import { requireProposalCreator } from '../helpers/permissions.js'
import { startController } from './controller.js'

export const startProject = {
  plugin: {
    name: 'Project - Start Project',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.START,
          options: {
            pre: [{ method: requireProposalCreator }],
            handler: startController.getHandler
          }
        }
      ])
    }
  }
}
