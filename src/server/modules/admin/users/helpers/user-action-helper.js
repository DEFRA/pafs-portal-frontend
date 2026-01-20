import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { ENCODED_ID_PLACEHOLDER } from '../../../../common/constants/accounts.js'

/**
 * Shared error handling for user action API calls
 * @private
 */
export function handleApiError(
  request,
  h,
  encodedId,
  userId,
  response,
  logMessage,
  errorKey
) {
  const errorMessage = extractApiError(response)
  request.server.logger.error({ userId, errors: response.errors }, logMessage)

  request.yar.flash('error', {
    message: errorMessage || request.t(errorKey)
  })
  return h.redirect(
    ROUTES.ADMIN.USER_VIEW.replace(ENCODED_ID_PLACEHOLDER, encodedId)
  )
}

/**
 * Shared unexpected error handling for user actions
 * @private
 */
export function handleUnexpectedError(
  request,
  h,
  encodedId,
  userId,
  error,
  logMessage,
  errorKey
) {
  request.server.logger.error({ error, userId }, logMessage)

  request.yar.flash('error', {
    message: request.t(errorKey)
  })
  return h.redirect(
    ROUTES.ADMIN.USER_VIEW.replace(ENCODED_ID_PLACEHOLDER, encodedId)
  )
}

/**
 * Invalidate cache after user action
 * Clears both individual account cache and common list/count caches
 * @param {Object} request - Hapi request object
 * @param {string} userId - The user ID whose account was modified
 * @param {string} actionName - Name of the action (approve, reactivate, delete, etc) for logging
 */
export async function invalidateUserCache(request, userId, actionName) {
  const cacheService = createAccountsCacheService(request.server)

  try {
    const accountKey = cacheService.generateAccountKey(userId)

    request.server.logger.info(
      { userId, accountKey, segment: 'accounts' },
      'Dropping individual account cache'
    )

    await cacheService.dropByKey(accountKey)

    request.server.logger.info(
      { userId },
      'Dropping common list and count caches'
    )

    await cacheService.invalidateAll()

    request.server.logger.info(
      { userId },
      `Successfully invalidated account cache after ${actionName}`
    )
  } catch (error) {
    request.server.logger.warn(
      { error, userId },
      'Failed to invalidate accounts cache'
    )
  }
}

/**
 * Set flash notification for successful user action
 * @param {Object} request - Hapi request object
 * @param {string} titleKey - i18n key for notification title
 * @param {string} messageKey - i18n key for notification message
 * @param {Object} variables - Optional variables for i18n interpolation
 */
export function setSuccessNotification(
  request,
  titleKey,
  messageKey,
  variables = {}
) {
  request.yar.flash('success', {
    title: request.t(titleKey),
    message: request.t(messageKey, variables)
  })
}

/**
 * Log user action
 * @param {Object} request - Hapi request object
 * @param {string} message - Log message
 * @param {string} userId - User being acted upon
 * @param {Object} session - Auth session
 */
export function logUserAction(request, message, userId, session) {
  request.server.logger.info({ userId, adminId: session?.user?.id }, message)
}

/**
 * Log API response
 * @param {Object} request - Hapi request object
 * @param {string} message - Log message
 * @param {string} userId - User being acted upon
 * @param {Object} data - Additional data to log (e.g., result IDs)
 */
export function logApiResponse(request, message, userId, data = {}) {
  request.server.logger.info({ userId, ...data }, message)
}
