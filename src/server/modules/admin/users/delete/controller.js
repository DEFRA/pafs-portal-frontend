import { deleteAccount } from '../../../../common/services/accounts/accounts-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'
import { ADMIN_VIEWS } from '../../../../common/constants/common.js'
import { ENCODED_ID_PLACEHOLDER } from '../../../../common/constants/accounts.js'
import {
  handleApiError,
  handleUnexpectedError,
  invalidateUserCache,
  setSuccessNotification,
  logUserAction
} from '../helpers/user-action-helper.js'

/**
 * Delete User Controller
 * Handles deletion of user accounts (both pending and active)
 */
class DeleteUserController {
  async getHandler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)

    try {
      const session = getAuthSession(request)
      const accountData = request.pre?.accountData

      if (!accountData?.account) {
        request.server.logger.warn(
          { userId },
          'Account data not found in pre-handler'
        )
        return h.redirect(ROUTES.ADMIN.USERS_ACTIVE)
      }

      const { firstName, lastName } = accountData.account
      const userName = `${firstName} ${lastName}`

      request.server.logger.info(
        { userId, adminId: session?.user?.id },
        'Admin viewing delete confirmation page'
      )

      return h.view(ADMIN_VIEWS.DELETE_USER, {
        encodedId,
        pageTitle: request.t('accounts.delete_user.page_title'),
        backLink: ROUTES.ADMIN.USER_VIEW.replace(
          ENCODED_ID_PLACEHOLDER,
          encodedId
        ),
        userName
      })
    } catch (error) {
      request.server.logger.error(
        { error, userId },
        'Error loading delete confirmation page'
      )
      return h.redirect(
        ROUTES.ADMIN.USER_VIEW.replace(ENCODED_ID_PLACEHOLDER, encodedId)
      )
    }
  }

  async postHandler(request, h) {
    const { encodedId } = request.params
    const userId = decodeUserId(encodedId)
    const { confirm } = request.payload || {}

    try {
      const session = getAuthSession(request)

      if (confirm !== 'yes') {
        request.server.logger.info({ userId }, 'Delete cancelled by admin')
        return h.redirect(
          ROUTES.ADMIN.USER_VIEW.replace(ENCODED_ID_PLACEHOLDER, encodedId)
        )
      }

      logUserAction(request, 'Admin deleting user account', userId, session)

      const response = await deleteAccount(userId, session.accessToken)

      if (!response.success) {
        return handleApiError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to delete account',
          'accounts.delete_user.errors.delete_failed'
        )
      }

      request.server.logger.info(
        { userId, deletedUserId: response.data?.userId },
        'Account deleted successfully'
      )

      await invalidateUserCache(request, userId, 'deletion')

      const userName = response.data?.userName || 'User'
      setSuccessNotification(
        request,
        'accounts.delete_user.notifications.deleted_title',
        'accounts.delete_user.notifications.deleted_message',
        { userName }
      )

      const redirectRoute = response.data?.wasActive
        ? ROUTES.ADMIN.USERS_ACTIVE
        : ROUTES.ADMIN.USERS_PENDING

      return h.redirect(redirectRoute)
    } catch (error) {
      return handleUnexpectedError(
        request,
        h,
        encodedId,
        userId,
        error,
        'Unexpected error deleting account',
        'accounts.delete_user.errors.delete_failed'
      )
    }
  }
}

const controller = new DeleteUserController()

export const deleteUserController = {
  getHandler: (request, h) => controller.getHandler(request, h),
  postHandler: (request, h) => controller.postHandler(request, h)
}
