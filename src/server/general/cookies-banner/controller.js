import { config } from '../../../config/config.js'

const COOKIE_POLICY_NAME = 'cookies_policy'
const COOKIE_PREFS_SET_NAME = 'cookies_preferences_set'

// Define the TTL constant here
const PREFERENCES_TTL = config.get('cookie.preferences.ttl')
const IS_SECURE = config.get('session.cookie.secure')

class CookiesBannerController {
  /**
   * Accept analytics cookies
   */
  accept(request, h) {
    const response = h.redirect(request.headers.referer || '/')

    // Set analytics accepted cookies
    response.state(
      COOKIE_POLICY_NAME,
      JSON.stringify({ analytics: true, preferencesSet: true }),
      {
        path: '/',
        ttl: PREFERENCES_TTL,
        isSecure: IS_SECURE,
        isHttpOnly: true,
        isSameSite: 'Lax'
      }
    )

    response.state(COOKIE_PREFS_SET_NAME, 'true', {
      path: '/',
      ttl: PREFERENCES_TTL,
      isSecure: IS_SECURE,
      isHttpOnly: true,
      isSameSite: 'Lax'
    })

    // Set query parameter to show accepted message
    response.state('cookie_banner_message', 'accepted', {
      path: '/',
      ttl: 5000, // 5 seconds - just for the redirect
      isSecure: IS_SECURE,
      isHttpOnly: true,
      isSameSite: 'Lax'
    })

    return response
  }

  /**
   * Reject analytics cookies
   */
  reject(request, h) {
    const response = h.redirect(request.headers.referer || '/')

    // Set analytics rejected cookies
    response.state(
      COOKIE_POLICY_NAME,
      JSON.stringify({ analytics: false, preferencesSet: true }),
      {
        path: '/',
        ttl: PREFERENCES_TTL,
        isSecure: IS_SECURE,
        isHttpOnly: true,
        isSameSite: 'Lax'
      }
    )

    response.state(COOKIE_PREFS_SET_NAME, 'true', {
      path: '/',
      ttl: PREFERENCES_TTL,
      isSecure: IS_SECURE,
      isHttpOnly: true,
      isSameSite: 'Lax'
    })

    // Set query parameter to show rejected message
    response.state('cookie_banner_message', 'rejected', {
      path: '/',
      ttl: 5000, // 5 seconds - just for the redirect
      isSecure: IS_SECURE,
      isHttpOnly: true,
      isSameSite: 'Lax'
    })

    return response
  }
}

const controller = new CookiesBannerController()

export const cookiesBannerController = {
  handler: {
    accept: (request, h) => controller.accept(request, h),
    reject: (request, h) => controller.reject(request, h)
  }
}
