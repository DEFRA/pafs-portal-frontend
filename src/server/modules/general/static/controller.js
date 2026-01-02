import { STATIC_PAGE_CONFIG } from './static-page-config.js'
import { config } from '../../../../config/config.js'
import { statusCodes } from '../../../common/constants/status-codes.js'

/**
 * Generic controller for static pages
 * Renders different views based on the route path
 */
class StaticPageController {
  /**
   * Get the page configuration based on the request path
   * @param {string} path - The request path
   * @returns {Object|null} Page configuration or null if not found
   */
  getPageConfig(path) {
    return STATIC_PAGE_CONFIG[path] || null
  }

  /**
   * GET handler for static pages
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} View response
   */
  get(request, h) {
    const pageConfig = this.getPageConfig(request.path)

    if (!pageConfig) {
      return h.response('Page not found').code(statusCodes.notFound)
    }

    const viewData = {
      pageTitle: request.t(pageConfig.titleKey),
      heading: request.t(pageConfig.headingKey)
    }

    // Add page-specific data
    if (request.path === '/privacy-notice') {
      viewData.lastUpdatedDate = config.get('privacyNotice.lastUpdatedDate')
    }

    return h.view(pageConfig.view, viewData)
  }
}

const controller = new StaticPageController()

export const staticPageController = {
  handler: (request, h) => controller.get(request, h)
}
