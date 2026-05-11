import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { PROJECT_PAYLOAD_LEVELS } from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { buildViewData, resetSessionData } from '../helpers/project-utils.js'

class StartController {
  async get(request, h) {
    resetSessionData(request)

    request.metrics?.counter('proposalStepVisit', 1, {
      step: PROJECT_PAYLOAD_LEVELS.INITIAL_SAVE,
      result: 'submitted'
    })

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
