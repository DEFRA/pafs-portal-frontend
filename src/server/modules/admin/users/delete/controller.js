import { deleteAccount } from '../../../../common/services/accounts/accounts-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { createAccountsCacheService } from '../../../../common/services/accounts/accounts-cache.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { decodeUserId } from '../../../../common/helpers/security/encoder.js'
import { ADMIN_VIEWS } from '../../../../common/constants/common.js'

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
        backLink: ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId),
        userName
      })
    } catch (error) {
      request.server.logger.error(
        { error, userId },
        'Error loading delete confirmation page'
      )
      return h.redirect(
        ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
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
          ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
        )
      }

      request.server.logger.info(
        { userId, adminId: session?.user?.id },
        'Admin deleting user account'
      )

      // Call backend API to delete account
      const response = await deleteAccount(userId, session.accessToken)

      if (!response.success) {
        return this.handleError(
          request,
          h,
          encodedId,
          userId,
          response,
          'Failed to delete account'
        )
      }

      request.server.logger.info(
        { userId, deletedUserId: response.data?.userId },
        'Account deleted successfully'
      )

      // Invalidate accounts cache to refresh counts and lists
      await this.invalidateCache(request, userId)

      // Set success notification with user name
      const userName = response.data?.userName || 'User'
      request.yar.flash('success', {
        title: request.t('accounts.delete_user.notifications.deleted_title'),
        message: request.t(
          'accounts.delete_user.notifications.deleted_message',
          { userName }
        )
      })

      // Redirect to users list (active or pending based on user status)
      const redirectRoute = response.data?.wasActive
        ? ROUTES.ADMIN.USERS_ACTIVE
        : ROUTES.ADMIN.USERS_PENDING

      return h.redirect(redirectRoute)
    } catch (error) {
      return this.handleUnexpectedError(request, h, encodedId, userId, error)
    }
  }

  handleError(request, h, encodedId, userId, response, logMessage) {
    const errorMessage = extractApiError(response)
    request.server.logger.error({ userId, errors: response.errors }, logMessage)

    request.yar.flash('error', {
      message:
        errorMessage || request.t('accounts.delete_user.errors.delete_failed')
    })
    return h.redirect(ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId))
  }

  handleUnexpectedError(request, h, encodedId, userId, error) {
    request.server.logger.error(
      { error, userId },
      'Unexpected error deleting account'
    )

    request.yar.flash('error', {
      message: request.t('accounts.delete_user.errors.delete_failed')
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

      // Invalidate the specific account cache
      await cacheService.dropByKey(accountKey)

      request.server.logger.info(
        { userId },
        'Dropping common list and count caches'
      )

      // Invalidate common list and count caches
      await cacheService.invalidateAll()

      request.server.logger.info(
        { userId },
        'Successfully invalidated account cache after deletion'
      )
    } catch (error) {
      request.server.logger.warn(
        { error, userId },
        'Failed to invalidate accounts cache'
      )
    }
  }
}

const controller = new DeleteUserController()

export const deleteUserController = {
  getHandler: (request, h) => controller.getHandler(request, h),
  postHandler: (request, h) => controller.postHandler(request, h)
}
