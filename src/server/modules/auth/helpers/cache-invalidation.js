import { createAccountsCacheService } from '../../../common/services/accounts/accounts-cache.js'

/**
 * Invalidate accounts cache after authentication events
 * This ensures any cached user data is refreshed after login or password changes
 * @param {Object} request - Hapi request object
 * @param {string} context - Context for logging (e.g., 'login', 'auto-login')
 */
export async function invalidateAccountsCacheOnAuth(request, context = 'auth') {
  const cacheService = createAccountsCacheService(request.server)

  await cacheService.invalidateAll().catch((error) => {
    request.server.logger.warn(
      { error, context },
      `Failed to invalidate accounts cache during ${context}`
    )
  })
}
