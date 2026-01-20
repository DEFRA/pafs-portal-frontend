import { resendInvitation } from '../../../../common/services/accounts/accounts-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'

/**
 * Resend Invitation Controller
 * Handles resending invitation emails to approved user accounts
 */
class ResendInvitationController {
  async handler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)

    try {
      const session = getAuthSession(request)

      request.server.logger.info(
        { userId, adminId: session?.user?.id },
        'Admin resending invitation to user'
      )

      // Call backend API to resend invitation
      const response = await resendInvitation(userId, session.accessToken)

      if (!response.success) {
        return this.handleError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to resend invitation'
        )
      }

      request.server.logger.info(
        { userId, resentUserId: response.data?.userId },
        'Invitation resent successfully'
      )

      // Invalidate accounts cache to refresh data
      await this.invalidateCache(request, userId)

      // Set success notification
      request.yar.flash('success', {
        title: request.t(
          'accounts.view_user.notifications.resend_invitation_title'
        ),
        message: request.t(
          'accounts.view_user.notifications.resend_invitation_message'
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
        errorMessage ||
        request.t('accounts.view_user.errors.resend_invitation_failed')
    })
    return h.redirect(ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId))
  }

  handleUnexpectedError(request, h, encodedId, userId, error) {
    request.server.logger.error(
      { error, userId },
      'Unexpected error resending invitation'
    )

    request.yar.flash('error', {
      message: request.t('accounts.view_user.errors.resend_invitation_failed')
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

      // Invalidate the specific account cache to get fresh data
      await cacheService.dropByKey(accountKey)

      request.server.logger.info(
        { userId },
        'Successfully invalidated account cache after resending invitation'
      )
    } catch (error) {
      request.server.logger.warn(
        { error, userId },
        'Failed to invalidate accounts cache'
      )
    }
  }
}

const controller = new ResendInvitationController()

export const resendInvitationController = {
  handler: (request, h) => controller.handler(request, h)
}
