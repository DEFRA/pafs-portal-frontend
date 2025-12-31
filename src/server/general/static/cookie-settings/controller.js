import { config } from '../../../../config/config.js'

const COOKIE_POLICY_NAME = 'cookies_policy'
const COOKIE_PREFS_SET_NAME = 'cookies_preferences_set'

class CookieSettingsController {
  get(request, h) {
    let analyticsAccepted = false
    const showConfirmation = request.query?.saved === '1'

    // Parse the JSON cookie value
    const policyRaw = request.state[COOKIE_POLICY_NAME]
    if (policyRaw) {
      try {
        const policy = JSON.parse(policyRaw)
        analyticsAccepted = policy?.analytics === true
      } catch (error) {
        console.error('Error parsing cookie policy:', error)
        // If parsing fails, default to false
        analyticsAccepted = false
      }
    }

    return h.view('general/static/cookie-settings/index', {
      pageTitle: request.t('cookies.pages.settings.title'),
      heading: request.t('cookies.pages.settings.heading'),
      analyticsAccepted,
      showConfirmation
    })
  }

  post(request, h) {
    try {
      const { analytics } = request.payload || {}
      const analyticsAccepted = analytics === 'yes'

      // Create redirect response
      const response = h.redirect(`${request.path}?saved=1`)

      // Set cookies on the response - values must be strings
      response.state(
        COOKIE_POLICY_NAME,
        JSON.stringify({ analytics: analyticsAccepted, preferencesSet: true }),
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
    } catch (error) {
      console.error('Error in cookie settings POST:', error)
      throw error
    }
  }
}

const controller = new CookieSettingsController()

export const cookieSettingsController = {
  handler: {
    get: (request, h) => controller.get(request, h),
    post: (request, h) => controller.post(request, h)
  }
}
