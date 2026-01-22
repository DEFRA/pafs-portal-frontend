import { config } from '../../../../config/config.js'

/**
 * Check if user needs to re-accept cookie policy due to version change
 * @param {Object} request - Hapi request object
 * @returns {boolean} True if user needs to re-accept policy
 */
export function needsCookiePolicyReacceptance(request) {
  try {
    const currentPolicyVersion = config.get('cookie.policy.version')
    const cookiePolicyString = request.state.cookies_policy

    // No cookie set - user hasn't accepted yet
    if (!cookiePolicyString) {
      return false // Banner will show anyway for first-time users
    }

    const cookiePolicy = JSON.parse(cookiePolicyString)

    // Check if cookie has version field
    if (!cookiePolicy.policyVersion) {
      // Old cookie format without version - needs re-acceptance
      return true
    }

    // Check if version has changed
    return cookiePolicy.policyVersion < currentPolicyVersion
  } catch {
    // If parsing fails, treat as needs re-acceptance
    return true
  }
}

/**
 * Check if user has set cookie preferences (even if outdated)
 * @param {Object} request - Hapi request object
 * @returns {boolean} True if preferences were set before
 */
export function hasCookiePreferencesSet(request) {
  return Boolean(request.state.cookies_preferences_set)
}

/**
 * Get cookie policy acceptance status
 * @param {Object} request - Hapi request object
 * @returns {Object} Object with status information
 */
export function getCookiePolicyStatus(request) {
  const prefsSet = hasCookiePreferencesSet(request)
  const needsReacceptance = needsCookiePolicyReacceptance(request)

  return {
    hasAcceptedBefore: prefsSet,
    needsReacceptance,
    shouldShowBanner: !prefsSet || needsReacceptance
  }
}
