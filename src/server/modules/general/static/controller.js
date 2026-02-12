import { config } from '../../../../config/config.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { GENERAL_VIEWS } from '../../../common/constants/common.js'
import {
  COOKIE_NAMES,
  getCookieOptions,
  createCookiePolicyValue
} from '../../../common/helpers/cookie-config.js'

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
      // Parse the cookies_policy JSON to get the current analytics preference
      let cookiePolicy = {}
      try {
        cookiePolicy = request.state.cookies_policy
          ? JSON.parse(request.state.cookies_policy)
          : {}
      } catch {
        cookiePolicy = {}
      }
      viewData.analyticsConsent = cookiePolicy.analytics || 'no'
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

    // For cookie settings page, don't show banner confirmation
    // The page has its own success notification
    const response = h.redirect(`${request.path}?saved=true`)

    this._setCookiePolicy(response, consentValue)

    return response
  }

  /**
   * Accept analytics cookies from banner
   */
  acceptCookies(request, h) {
    return this._setCookieConsent(h, 'yes', request.headers.referer || '/')
  }

  /**
   * Reject analytics cookies from banner
   */
  rejectCookies(request, h) {
    return this._setCookieConsent(h, 'no', request.headers.referer || '/')
  }

  /**
   * Hide the confirmation message
   */
  hideMessage(request, h) {
    const response = h.redirect(request.headers.referer || '/')
    // Clear the confirmation cookie so banner doesn't show
    response.unstate(COOKIE_NAMES.SHOW_CONFIRMATION, {
      path: '/'
    })
    return response
  }

  _setCookiePolicy(response, consentValue) {
    response.state(
      COOKIE_NAMES.POLICY,
      createCookiePolicyValue(consentValue),
      getCookieOptions()
    )

    response.state(COOKIE_NAMES.PREFERENCES_SET, 'true', getCookieOptions())
  }

  /**
   * Helper to set cookie consent
   */
  _setCookieConsent(h, consentValue, redirectPath) {
    const response = h.redirect(redirectPath)
    this._setCookiePolicy(response, consentValue)

    response.state(
      COOKIE_NAMES.SHOW_CONFIRMATION,
      'true',
      getCookieOptions({ ttl: null, isHttpOnly: false })
    )

    return response
  }
}

const controller = new StaticPageController()

export const staticPageController = {
  handler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h),
  acceptCookiesHandler: (request, h) => controller.acceptCookies(request, h),
  rejectCookiesHandler: (request, h) => controller.rejectCookies(request, h),
  hideMessageHandler: (request, h) => controller.hideMessage(request, h)
}
