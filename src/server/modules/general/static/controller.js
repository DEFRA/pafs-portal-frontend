import { config } from '../../../../config/config.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { GENERAL_VIEWS } from '../../../common/constants/common.js'

/**
 * Generic controller for static pages
 * Renders different views based on the route path
 */

const COOKIE_POLICY_NAME = 'cookies_policy'
const COOKIE_PREFS_SET_NAME = 'cookies_preferences_set'
class StaticPageController {
  getPageKey(path) {
    let pageKey = null
    if (path === ROUTES.GENERAL.STATIC_PAGES.PRIVACY_NOTICE) {
      pageKey = 'privacy'
    }
    if (path === ROUTES.GENERAL.STATIC_PAGES.ACCESSIBILITY) {
      pageKey = 'accessibility'
    }
    if (path === ROUTES.GENERAL.STATIC_PAGES.COOKIES) {
      pageKey = 'cookies'
    }
    if (path === ROUTES.GENERAL.STATIC_PAGES.COOKIE_SETTINGS) {
      pageKey = 'cookie_settings'
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

    if (pageKey === 'cookie_settings') {
      viewData.analyticsConsent = request.state.analytics_consent || 'no'
      viewData.savedSuccessfully = request.query.saved === 'true'
    }

    return h.view(
      `${GENERAL_VIEWS.STATIC_PAGES[pageKey.toUpperCase()]}`,
      viewData
    )
  }

  /**
   * POST handler for cookie settings page
   * Saves analytics cookie preference then redirects with a success flag
   * @param {Object} request - Hapi request object
   * @param {Object} h - Hapi response toolkit
   * @returns {Object} Redirect response
   */
  post(request, h) {
    const { analyticsConsent } = request.payload

    // Default to "no" if nothing was selected
    const consentValue = analyticsConsent === 'yes' ? 'yes' : 'no'

    const response = h.redirect(`${request.path}?saved=true`)
    // Set cookies on the response - values must be strings
    response.state(
      COOKIE_POLICY_NAME,
      JSON.stringify({ analytics: consentValue, preferencesSet: true }),
      {
        path: '/',
        ttl: config.get('cookie.preferences.ttl'),
        isSecure: config.get('session.cookie.secure'),
        isHttpOnly: true,
        isSameSite: 'Lax'
      }
    )

    response.state(COOKIE_PREFS_SET_NAME, 'true', {
      path: '/',
      ttl: config.get('cookie.preferences.ttl'),
      isSecure: config.get('session.cookie.secure'),
      isHttpOnly: true,
      isSameSite: 'Lax'
    })

    return response
  }
}

const controller = new StaticPageController()

export const staticPageController = {
  handler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
