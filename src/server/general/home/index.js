import { homeController } from './controller.js'
import { requireAuth } from '../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../common/constants/routes.js'

/**
 * Sets up the routes used in the home page.
 * These routes are registered in src/server/router.js.
 */
export const home = {
  plugin: {
    name: 'Project Proposals',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.HOME,
          options: {
            pre: [{ method: requireAuth }]
          },
          ...homeController
        }
      ])
    }
  }
}
