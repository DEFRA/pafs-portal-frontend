import { ACCOUNT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'

class IsAdminController {
  get(request, h) {
    const sessionKey = getSessionKey(true)
    const sessionData = request.yar.get(sessionKey) || {}

    return h.view(ACCOUNT_VIEWS.IS_ADMIN, {
      pageTitle: request.t('accounts.add_user.admin_question.title'),
      admin: sessionData.admin,
      backLink: ROUTES.ADMIN.ACCOUNTS.START,
      submitRoute: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN
    })
  }

  post(request, h) {
    const { admin } = request.payload
    const sessionKey = getSessionKey(true)

    if (admin === undefined || admin === null) {
      return h.view(ACCOUNT_VIEWS.IS_ADMIN, {
        pageTitle: request.t('accounts.add_user.admin_question.title'),
        errors: {
          admin: {
            text: request.t(
              'accounts.validation.add_user.VALIDATION_ADMIN_FLAG_REQUIRED'
            ),
            href: '#admin'
          }
        },
        errorSummary: [
          {
            text: request.t(
              'accounts.validation.add_user.VALIDATION_ADMIN_FLAG_REQUIRED'
            ),
            href: '#admin'
          }
        ],
        backLink: ROUTES.ADMIN.ACCOUNTS.START,
        submitRoute: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN
      })
    }

    const sessionData = request.yar.get(sessionKey) || {}
    // Preserve existing session data and add admin flag
    sessionData.admin = admin === 'true' || admin === true
    request.yar.set(sessionKey, sessionData)

    return h.redirect(ROUTES.ADMIN.ACCOUNTS.DETAILS)
  }
}

const controller = new IsAdminController()

export const isAdminController = {
  handler: (request, h) => controller.get(request, h)
}

export const isAdminPostController = {
  handler: (request, h) => controller.post(request, h)
}
