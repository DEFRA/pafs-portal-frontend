import { reactivateAccount } from '../../../../common/services/accounts/accounts-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'

/**
 * Reactivate User Controller
 * Handles reactivation of disabled user accounts
 */
class ReactivateUserController {
  async handler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)

    try {
      const session = getAuthSession(request)

      request.server.logger.info(
        { userId, adminId: session?.user?.id },
        'Admin reactivating user account'
      )

      // Call backend API to reactivate account
      const response = await reactivateAccount(userId, session.accessToken)

      if (!response.success) {
        return this.handleError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to reactivate account'
        )
      }

      request.server.logger.info(
        { userId, reactivatedUserId: response.data?.account?.id },
        'Account reactivated successfully'
      )

      // Invalidate accounts cache to refresh counts and lists
      await this.invalidateCache(request, userId)

      // Set success notification with user name
      const userName =
        `${response.data?.account?.firstName || ''} ${response.data?.account?.lastName || ''}`.trim() ||
        'User'
      request.yar.flash('success', {
        title: request.t('accounts.view_user.notifications.reactivated_title'),
        message: request.t(
          'accounts.view_user.notifications.reactivated_message',
          { userName }
        )
      })

      // Redirect back to view account page
      return h.redirect(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
      )
    } catch (error) {
      return this.handleUnexpectedError(request, h, encodedId, userId, error)
    }
  }

  handleError(request, h, encodedId, userId, response, logMessage) {
    const errorMessage = extractApiError(response)
    request.server.logger.error({ userId, errors: response.errors }, logMessage)

    request.yar.flash('error', {
      message:
        errorMessage || request.t('accounts.view_user.errors.reactivate_failed')
    })
    return h.redirect(ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId))
  }

  handleUnexpectedError(request, h, encodedId, userId, error) {
    request.server.logger.error(
      { error, userId },
      'Unexpected error reactivating account'
    )

    request.yar.flash('error', {
      message: request.t('accounts.view_user.errors.reactivate_failed')
    })
    return h.redirect(ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId))
  }

  async invalidateCache(request, userId) {
    const cacheService = createAccountsCacheService(request.server)

    try {
      const accountKey = cacheService.generateAccountKey(userId)

      request.server.logger.info(
        { userId, accountKey, segment: 'accounts' },
        'Dropping individual account cache'
      )

      // Invalidate the specific account cache to get fresh status
      await cacheService.dropByKey(accountKey)

      request.server.logger.info(
        { userId },
        'Dropping common list and count caches'
      )

      // Invalidate common list and count caches
      await cacheService.invalidateAll()

      request.server.logger.info(
        { userId },
        'Successfully invalidated account cache after reactivation'
      )
    } catch (error) {
      request.server.logger.warn(
        { error, userId },
        'Failed to invalidate accounts cache'
      )
    }
  }
}

const controller = new ReactivateUserController()

export const reactivateUserController = {
  handler: (request, h) => controller.handler(request, h)
}
