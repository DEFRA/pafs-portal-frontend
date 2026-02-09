import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import {
  buildViewData,
  loggedInUserAreaOptions,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import { validateAreaId } from '../schema.js'

class AreaController {
  _getViewData(request) {
    return buildViewData(request, {
      localKeyPrefix: 'projects.area_selection',
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.NAME
      },
      additionalData: {
        areaOptions: loggedInUserAreaOptions(request)
      }
    })
  }

  async get(request, h) {
    return h.view(PROJECT_VIEWS.AREA, this._getViewData(request))
  }

  async post(request, h) {
    // Save form data to session
    updateSessionData(request, request.payload)
    const viewData = this._getViewData(request)
    try {
      const validationError = validatePayload(request, h, {
        template: PROJECT_VIEWS.AREA,
        schema: validateAreaId,
        viewData
      })
      if (validationError) {
        return validationError
      }

      return h.redirect(ROUTES.PROJECT.TYPE).takeover()
    } catch (error) {
      request.logger.error('Error project area POST', error)
      return h.view(PROJECT_VIEWS.AREA, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new AreaController()

export const areaController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
