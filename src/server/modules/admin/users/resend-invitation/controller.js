import { resendInvitation } from '../../../../common/services/accounts/accounts-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'
import { ENCODED_ID_PLACEHOLDER } from '../../../../common/constants/accounts.js'
import {
  handleApiError,
  handleUnexpectedError,
  invalidateUserCache,
  setSuccessNotification,
  logUserAction,
  logApiResponse
} from '../helpers/user-action-helper.js'

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

      logUserAction(
        request,
        'Admin resending invitation to user',
        userId,
        session
      )

      const response = await resendInvitation(userId, session.accessToken)

      if (!response.success) {
        return handleApiError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to resend invitation',
          'accounts.view_user.errors.resend_invitation_failed'
        )
      }

      logApiResponse(request, 'Invitation resent successfully', userId, {
        resentUserId: response.data?.userId
      })

      await invalidateUserCache(request, userId, 'resending invitation')

      setSuccessNotification(
        request,
        'accounts.view_user.notifications.resend_invitation_title',
        'accounts.view_user.notifications.resend_invitation_message'
      )

      return h.redirect(
        ROUTES.ADMIN.USER_VIEW.replace(ENCODED_ID_PLACEHOLDER, encodedId)
      )
    } catch (error) {
      return handleUnexpectedError(
        request,
        h,
        encodedId,
        userId,
        error,
        'Unexpected error resending invitation',
        'accounts.view_user.errors.resend_invitation_failed'
      )
    }
  }
}

const controller = new ResendInvitationController()

export const resendInvitationController = {
  handler: (request, h) => controller.handler(request, h)
}
