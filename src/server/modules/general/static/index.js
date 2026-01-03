import { staticPageController } from './controller.js'
import { ROUTES } from '../../../common/constants/routes.js'

/**
 * Sets up the routes used in the static page.
 * These routes are registered in src/server/router.js.
 */
export const staticPages = {
  plugin: {
    name: 'Static Pages',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.STATIC_PAGES.PRIVACY_NOTICE,
          ...staticPageController
        }
      ])
    }
  }
}
