import { staticPageController } from '../controller.js'
import { ROUTES } from '../../../../common/constants/routes.js'

/**
 * Sets up the routes used in the privacy notice page.
 * These routes are registered in src/server/router.js.
 */
export const privacyNotice = {
  plugin: {
    name: 'Privacy Notice',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.PRIVACY_NOTICE,
          ...staticPageController
        }
      ])
    }
  }
}
