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
          handler: staticPageController.handler
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.STATIC_PAGES.ACCESSIBILITY,
          handler: staticPageController.handler
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.STATIC_PAGES.COOKIES,
          handler: staticPageController.handler
        },
        {
          method: 'GET',
          path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS,
          handler: staticPageController.handler
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS,
          handler: staticPageController.postHandler
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_CONSENT_ACCEPT,
          handler: staticPageController.acceptCookiesHandler
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_CONSENT_REJECT,
          handler: staticPageController.rejectCookiesHandler
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.STATIC_PAGES.COOKIE_CONSENT_HIDE,
          handler: staticPageController.hideMessageHandler
        }
      ])
    }
  }
}
