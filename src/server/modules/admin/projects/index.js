import { projectsListingController } from './listing/controller.js'
import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const projects = {
  plugin: {
    name: 'Admin Projects',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.ADMIN.PROJECTS,
          options: {
            pre: [{ method: requireAdmin }]
          },
          ...projectsListingController
        }
      ])
    }
  }
}
