import { approveAccount } from '../../../../common/services/accounts/accounts-service.js'
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
 * Approve User Controller
 * Handles approval of pending user accounts
 */
class ApproveUserController {
  async handler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)

    try {
      const session = getAuthSession(request)

      logUserAction(request, 'Admin approving user account', userId, session)

      const response = await approveAccount(userId, session.accessToken)

      if (!response.success) {
        return handleApiError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to approve account',
          'accounts.view_user.errors.approve_failed'
        )
      }

      logApiResponse(request, 'Account approved successfully', userId, {
        approvedUserId: response.data?.userId
      })

      await invalidateUserCache(request, userId, 'approval')

      const userName = response.data?.userName || 'User'
      setSuccessNotification(
        request,
        'accounts.view_user.notifications.approved_title',
        'accounts.view_user.notifications.approved_message',
        { userName }
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
        'Unexpected error approving account',
        'accounts.view_user.errors.approve_failed'
      )
    }
  }
}

const controller = new ApproveUserController()

export const approveUserController = {
  handler: (request, h) => controller.handler(request, h)
}
