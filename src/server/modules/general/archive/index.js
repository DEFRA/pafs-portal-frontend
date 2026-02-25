import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { projectsListingController } from '../../projects/listing/controller.js'

export const archive = {
  plugin: {
    name: 'Archive',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.ARCHIVE,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...projectsListingController
        }
      ])
    }
  }
}
