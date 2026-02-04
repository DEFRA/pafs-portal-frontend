import { ROUTES } from '../../../common/constants/routes.js'
import {
  noEditSessionRequired,
  requireProjectNameSet,
  requireRmaUser
} from '../helpers/permissions.js'
import { areaController } from './controller.js'

export const projectArea = {
  plugin: {
    name: 'Project - Project Area',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.PROJECT.AREA,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireProjectNameSet
            ],
            handler: areaController.getHandler
          }
        },
        {
          method: 'POST',
          path: ROUTES.PROJECT.AREA,
          options: {
            pre: [
              { method: requireRmaUser },
              { method: noEditSessionRequired },
              requireProjectNameSet
            ],
            handler: areaController.postHandler
          }
        }
      ])
    }
  }
}
