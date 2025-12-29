import { config } from '../../../../config/config.js'

const COOKIE_POLICY_NAME = 'cookies_policy'
const COOKIE_PREFS_SET_NAME = 'cookies_preferences_set'
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000

class CookieSettingsController {
  get(request, h) {
    const policy = request.state[COOKIE_POLICY_NAME]
    const analyticsAccepted = policy?.analytics === true
    const showConfirmation = request.query?.saved === '1'

    return h.view('general/static/cookie-settings/index', {
      pageTitle: request.t('cookies.pages.settings.title'),
      heading: request.t('cookies.pages.settings.heading'),
      analyticsAccepted,
      showConfirmation
    })
  }

  post(request, h) {
    const { analytics } = request.payload || {}
    const analyticsAccepted = analytics === 'yes'

    // Store preference in cookie
    const stateOptions = {
      isSecure: config.get('session.cookie.secure'),
      isHttpOnly: true,
      isSameSite: 'Lax',
      path: '/',
      ttl: ONE_YEAR_MS
    }

    h.state(
      COOKIE_POLICY_NAME,
      { analytics: analyticsAccepted, preferencesSet: true },
      stateOptions
    )
    h.state(COOKIE_PREFS_SET_NAME, true, stateOptions)

    return h.redirect(`${request.path}?saved=1`)
  }
}

const controller = new CookieSettingsController()

export const cookieSettingsController = {
  options: {
    validate: {
      payload: (value, options) => value, // accept any payload shape
      failAction: (request, h, err) => {
        // fall back to GET with current state; minimal validation needed here
        return h.redirect(request.path).takeover()
      }
    }
  },
  handler: {
    GET: (request, h) => controller.get(request, h),
    POST: (request, h) => controller.post(request, h)
  }
}
