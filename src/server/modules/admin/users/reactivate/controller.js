import { reactivateAccount } from '../../../../common/services/accounts/accounts-service.js'
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
 * Reactivate User Controller
 * Handles reactivation of disabled user accounts
 */
class ReactivateUserController {
  async handler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)

    try {
      const session = getAuthSession(request)

      logUserAction(request, 'Admin reactivating user account', userId, session)

      const response = await reactivateAccount(userId, session.accessToken)

      if (!response.success) {
        return handleApiError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to reactivate account',
          'accounts.view_user.errors.reactivate_failed'
        )
      }

      logApiResponse(request, 'Account reactivated successfully', userId, {
        reactivatedUserId: response.data?.account?.id
      })

      await invalidateUserCache(request, userId, 'reactivation')

      const userName =
        `${response.data?.account?.firstName || ''} ${response.data?.account?.lastName || ''}`.trim() ||
        'User'
      setSuccessNotification(
        request,
        'accounts.view_user.notifications.reactivated_title',
        'accounts.view_user.notifications.reactivated_message',
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
        'Unexpected error reactivating account',
        'accounts.view_user.errors.reactivate_failed'
      )
    }
  }
}

const controller = new ReactivateUserController()

export const reactivateUserController = {
  handler: (request, h) => controller.handler(request, h)
}
