import { ROUTES } from '../../../common/constants/routes.js'
import {
  noEditSessionRequired,
  requireProjectNameSet,
  requireProposalCreator
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
              { method: requireProposalCreator },
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
              { method: requireProposalCreator },
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
