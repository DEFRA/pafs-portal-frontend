import { config } from '../../../config/config.js'

/**
 * Cookie name constants
 */
export const COOKIE_NAMES = {
  POLICY: 'cookies_policy',
  PREFERENCES_SET: 'cookies_preferences_set',
  SHOW_CONFIRMATION: 'show_cookie_confirmation'
}

/**
 * Cookie state configuration for server registration
 * These definitions tell Hapi how to encode/decode cookies
 */
export const COOKIE_STATE_CONFIG = {
  encoding: 'base64json',
  clearInvalid: true,
  strictHeader: false
}

/**
 * Get cookie options for setting cookies
 * @param {Object} options - Optional overrides
 * @param {string} options.path - Cookie path (default: '/')
 * @param {number|null} options.ttl - Time to live in ms (default: from config)
 * @param {boolean} options.isHttpOnly - HttpOnly flag (default: true)
 * @param {boolean} options.isSameSite - SameSite setting (default: 'Lax')
 * @returns {Object} Cookie options
 */
export function getCookieOptions(options = {}) {
  return {
    path: options.path || '/',
    ttl:
      options.ttl === undefined
        ? config.get('cookie.preferences.ttl')
        : options.ttl,
    isSecure: config.get('session.cookie.secure'),
    isHttpOnly: options.isHttpOnly === undefined ? true : options.isHttpOnly,
    isSameSite: options.isSameSite === undefined ? 'Lax' : options.isSameSite
  }
}

/**
 * Register cookie state definitions with Hapi server
 * @param {Object} server - Hapi server instance
 */
export function registerCookieStates(server) {
  Object.values(COOKIE_NAMES).forEach((cookieName) => {
    server.state(cookieName, COOKIE_STATE_CONFIG)
  })
}

/**
 * Create cookie policy value
 * @param {string} consentValue - 'yes' or 'no'
 * @returns {string} JSON stringified policy object
 */
export function createCookiePolicyValue(consentValue) {
  const currentPolicyVersion = config.get('cookie.policy.version')
  return JSON.stringify({
    analytics: consentValue,
    policyVersion: currentPolicyVersion
  })
}
