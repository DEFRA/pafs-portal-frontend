import { ROUTES } from '../../../common/constants/routes.js'
import { requireRmaUser } from '../helpers/permissions.js'
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
            pre: [{ method: requireRmaUser }],
            handler: startController.getHandler
          }
        }
      ])
    }
  }
}
