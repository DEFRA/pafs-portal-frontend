/**
 * Safely retrieves the authentication session from request.yar
 * @param {Object} request - Hapi request object
 * @returns {Object|null} Session object or null if unavailable
 */
export function getAuthSession(request) {
  if (request?.yar?.get && typeof request.yar.get === 'function') {
    return request.yar.get('auth')
  }

  return null
}
