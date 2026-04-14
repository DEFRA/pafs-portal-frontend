/**
 * Safely retrieves the authentication session from request.yar
 * @param {Object} request - Hapi request object
 * @returns {Object|null} Session object or null if unavailable
 */
export function getAuthSession(request) {
  try {
    if (
      request?.yar &&
      request.yar !== null &&
      typeof request.yar.get === 'function'
    ) {
      return request.yar.get('auth')
    }
  } catch {
    // Yar internal store may be null for corrupted/expired sessions
    return null
  }

  return null
}
