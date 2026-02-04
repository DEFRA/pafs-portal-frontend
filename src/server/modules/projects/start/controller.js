import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { buildViewData, resetSessionData } from '../helpers/project-utils.js'

class StartController {
  async get(request, h) {
    resetSessionData(request)

    const viewData = buildViewData(request, {
      localKeyPrefix: 'projects.start_proposal',
      backLinkOptions: { targetURL: ROUTES.GENERAL.HOME }
    })

    return h.view(PROJECT_VIEWS.START, viewData)
  }
}

const controller = new StartController()

export const startController = {
  getHandler: (request, h) => controller.get(request, h)
}
