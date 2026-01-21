import { ACCOUNT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers/session-helpers.js'
import { addEditModeContext } from '../helpers/view-data-helper.js'
import { getNextRouteAfterIsAdmin } from '../helpers/navigation-helper.js'

class IsAdminController {
  get(request, h) {
    const sessionKey = getSessionKey(true)
    const sessionData = request.yar.get(sessionKey) || {}
    const encodedId = request.params?.encodedId
    const isEditMode = !!encodedId

    let viewData = {
      pageTitle: request.t(
        isEditMode
          ? 'accounts.add_user.admin_question.edit_title'
          : 'accounts.add_user.admin_question.title'
      ),
      admin: sessionData.admin,
      backLink: ROUTES.ADMIN.ACCOUNTS.START,
      submitRoute: ROUTES.ADMIN.ACCOUNTS.IS_ADMIN
    }

    viewData = addEditModeContext(request, viewData, {
      editRoute: ROUTES.ADMIN.ACCOUNTS.EDIT.IS_ADMIN
    })

    return h.view(ACCOUNT_VIEWS.IS_ADMIN, viewData)
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

    const nextRoute = getNextRouteAfterIsAdmin(request, sessionData)
    return h.redirect(nextRoute)
  }
}

const controller = new IsAdminController()

export const isAdminController = {
  handler: (request, h) => controller.get(request, h)
}

export const isAdminPostController = {
  handler: (request, h) => controller.post(request, h)
}
