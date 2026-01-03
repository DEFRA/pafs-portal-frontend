import { config } from '../../../../config/config.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { GENERAL_VIEWS } from '../../../common/constants/common.js'

/**
 * Generic controller for static pages
 * Renders different views based on the route path
 */
class StaticPageController {
  getPageKey(path) {
    let pageKey = null
    if (path === ROUTES.GENERAL.STATIC_PAGES.PRIVACY_NOTICE) {
      pageKey = 'privacy'
    }
    return pageKey
  }

  /**
   * GET handler for static pages
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} View response
   */
  get(request, h) {
    const pageKey = this.getPageKey(request.path)

    if (!pageKey) {
      return h.response('Page not found').code(statusCodes.notFound)
    }

    const viewData = {
      pageTitle: request.t(`static-pages.${pageKey}.title`),
      heading: request.t(`static-pages.${pageKey}.heading`),
      privacyLastUpdatedDate: config.get('privacyNotice.lastUpdatedDate'),
      localeNamespace: `static-pages.${pageKey}`
    }

    return h.view(
      `${GENERAL_VIEWS.STATIC_PAGES[pageKey.toUpperCase()]}`,
      viewData
    )
  }
}

const controller = new StaticPageController()

export const staticPageController = {
  handler: (request, h) => controller.get(request, h)
}
