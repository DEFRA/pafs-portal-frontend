import { approveAccount } from '../../../../common/services/accounts/accounts-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'

/**
 * Approve User Controller
 * Handles approval of pending user accounts
 */
class ApproveUserController {
  async handler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)

    try {
      const session = getAuthSession(request)

      request.server.logger.info(
        { userId, adminId: session?.user?.id },
        'Admin approving user account'
      )

      // Call backend API to approve account
      const response = await approveAccount(userId, session.accessToken)

      if (!response.success) {
        return this.handleError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to approve account'
        )
      }

      request.server.logger.info(
        { userId, approvedUserId: response.data?.userId },
        'Account approved successfully'
      )

      // Invalidate accounts cache to refresh counts and lists
      await this.invalidateCache(request, userId)

      // Set success notification with user name
      const userName = response.data?.userName || 'User'
      request.yar.flash('success', {
        title: request.t('accounts.view_user.notifications.approved_title'),
        message: request.t(
          'accounts.view_user.notifications.approved_message',
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
        errorMessage || request.t('accounts.view_user.errors.approve_failed')
    })
    return h.redirect(ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId))
  }

  handleUnexpectedError(request, h, encodedId, userId, error) {
    request.server.logger.error(
      { error, userId },
      'Unexpected error approving account'
    )

    request.yar.flash('error', {
      message: request.t('accounts.view_user.errors.approve_failed')
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
        'Successfully invalidated account cache after approval'
      )
    } catch (error) {
      request.server.logger.warn(
        { error, userId },
        'Failed to invalidate accounts cache'
      )
    }
  }
}

const controller = new ApproveUserController()

export const approveUserController = {
  handler: (request, h) => controller.handler(request, h)
}
