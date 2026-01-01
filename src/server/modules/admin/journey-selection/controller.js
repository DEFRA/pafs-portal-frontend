import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { ADMIN_VIEWS } from '../../../common/constants/common.js'

class JourneySelectionController {
  get(request, h) {
    const session = getAuthSession(request)

    return h.view(ADMIN_VIEWS.JOURNEY_SELECTION, {
      pageTitle: request.t('journey_selection.title'),
      user: session?.user
    })
  }

  post(request, h) {
    const { journey } = request.payload || {}

    if (journey === 'admin') {
      return h.redirect(ROUTES.ADMIN.USERS)
    }

    return h.redirect(ROUTES.GENERAL.HOME)
  }
}

const controller = new JourneySelectionController()

export const journeySelectionController = {
  handler: (request, h) => controller.get(request, h)
}

export const journeySelectionPostController = {
  handler: (request, h) => controller.post(request, h)
}
