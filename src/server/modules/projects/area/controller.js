import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { PROJECT_PAYLOAD_LEVELS } from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import {
  buildViewData,
  loggedInUserAreaOptions,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import { validateAreaId } from '../schema.js'

class AreaController {
  _getViewData(request) {
    return buildViewData(request, {
      localKeyPrefix: 'projects.area_selection',
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.NAME,
        conditionalRedirect: true
      },
      additionalData: {
        areaOptions: loggedInUserAreaOptions(request)
      }
    })
  }

  async get(request, h) {
    return h.view(PROJECT_VIEWS.AREA, this._getViewData(request))
  }

  async _postEditMode(request, h) {
    const referenceNumber = request.params?.referenceNumber || ''
    if (!referenceNumber) {
      return null
    }
    const viewData = this._getViewData(request)
    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.PROJECT_AREA,
      viewData,
      PROJECT_VIEWS.AREA,
      { emitSuccessMetric: false }
    )
    if (saveError) {
      return saveError
    }
    request.metrics?.counter('proposalStepVisit', 1, {
      step: 'PROJECT_AREA',
      result: 'submitted'
    })
    return navigateToProjectOverview(referenceNumber, h)
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
        request.metrics?.counter('proposalStepVisit', 1, {
          step: 'PROJECT_AREA',
          result: 'validation_error'
        })
        return validationError
      }

      const editResponse = await this._postEditMode(request, h)
      if (editResponse) {
        return editResponse
      }

      request.metrics?.counter('proposalStepVisit', 1, {
        step: 'PROJECT_AREA',
        result: 'submitted'
      })
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
