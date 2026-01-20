import { getAccountById } from '../../../common/services/accounts/accounts-service.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { createAccountsCacheService } from '../../../common/services/accounts/accounts-cache.js'
import { decodeUserId } from '../../../common/helpers/security/encoder.js'
import { ROUTES } from '../../../common/constants/routes.js'

/**
 * Pre-handler to fetch and validate account data for admin operations (view/edit)
 * Handles decoding, authentication, API calls, and area data fetching
 * Attaches account data to request.pre for use in route handlers
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Promise<Object>} Continues to handler or redirects on error
 */
export async function fetchAccountForAdmin(request, h) {
  const { encodedId } = request.params

  // Decode the user ID
  const userId = decodeUserId(encodedId)

  if (!userId) {
    request.server.logger.warn({ encodedId }, 'Invalid encoded ID')
    return h.redirect(ROUTES.ADMIN.USERS_ACTIVE).takeover()
  }

  // Get access token
  const authSession = getAuthSession(request)
  const accessToken = authSession?.accessToken

  if (!accessToken) {
    request.server.logger.warn('No access token found')
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  // Fetch account details from API (with caching)
  const cacheService = createAccountsCacheService(request.server)
  const apiResponse = await getAccountById(userId, accessToken, cacheService)

  if (!apiResponse.success) {
    const errorCode = extractApiError(apiResponse)
    request.server.logger.warn(
      { userId, errorCode },
      'Failed to fetch account details'
    )
    return h.redirect(ROUTES.ADMIN.USERS_PENDING).takeover()
  }

  // Fetch areas data for display
  const areasData = await request.getAreas()

  // Attach to request.pre for use in handler
  return {
    account: apiResponse.data,
    areasData,
    userId
  }
}
