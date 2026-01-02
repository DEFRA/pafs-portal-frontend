import {
  ACCOUNT_VIEWS,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'

/**
 * Confirmation Controller
 * Displays confirmation page after account submission
 * Shows different content based on submission status (pending/approved)
 */
class ConfirmationController {
  async get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}

    const { submissionStatus, email } = sessionData

    // Redirect if no submission status (user hasn't submitted)
    if (!submissionStatus) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS
          : ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS
      )
    }

    // Determine status (default to pending if not specified)
    const status = submissionStatus === 'approved' ? 'approved' : 'pending'

    return h.view(
      ACCOUNT_VIEWS.CONFIRMATION,
      this.buildViewData(request, isAdmin, status, email)
    )
  }

  buildViewData(request, isAdmin, status, email) {
    const localeKey = isAdmin ? 'add_user' : 'request_account'
    const translationBase = `accounts.${localeKey}.confirmation.${status}`

    return {
      pageTitle: request.t(`${translationBase}.panelTitle`),
      isAdmin,
      status,
      email,
      translationBase,
      localeKey,
      signInRoute: ROUTES.LOGIN,
      ERROR_CODES: VIEW_ERROR_CODES
    }
  }
}

const controller = new ConfirmationController()

export const confirmationController = {
  handler: (request, h) => controller.get(request, h)
}
