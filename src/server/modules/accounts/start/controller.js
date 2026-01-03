import { ACCOUNT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'

class StartController {
  get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)

    const sessionData = { journeyStarted: true }
    if (!isAdmin) {
      sessionData.admin = false
    }
    request.yar.set(sessionKey, sessionData)

    const nextRoute = isAdmin
      ? ROUTES.ADMIN.ACCOUNTS.IS_ADMIN
      : ROUTES.GENERAL.ACCOUNTS.DETAILS

    return h.view(ACCOUNT_VIEWS.START, {
      pageTitle: request.t(
        `accounts.${isAdmin ? 'add_user' : 'request_account'}.start.title`
      ),
      isAdmin,
      nextRoute,
      loginRoute: ROUTES.LOGIN
    })
  }
}

const controller = new StartController()

export const startController = {
  handler: (request, h) => controller.get(request, h)
}
