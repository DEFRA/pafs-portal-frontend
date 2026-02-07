import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { PROJECT_PAYLOAD_LEVELS } from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  extractApiError,
  extractApiValidationErrors
} from '../../../common/helpers/error-renderer/index.js'
import { checkProjectNameExists } from '../../../common/services/project/project-service.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  loggedInUserAreas,
  loggedInUserMainArea,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import { validateProjectName } from '../schema.js'

class NameController {
  _getViewData(request) {
    return buildViewData(request, {
      localKeyPrefix: 'projects.project_name',
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.START,
        conditionalRedirect: true
      }
    })
  }

  async _checkProjectNameDuplicate(request, h, options) {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const sessionData = getSessionData(request)
    const { name, referenceNumber } = sessionData
    const payload = { name, referenceNumber }
    const viewData = this._getViewData(request)

    const result = await checkProjectNameExists(payload, accessToken)

    if (!result.success) {
      if (result.validationErrors) {
        return h.view(
          options.template,
          buildViewData(request, {
            ...viewData,
            fieldErrors: extractApiValidationErrors(result)
          })
        )
      }

      const apiError = extractApiError(result)
      return h.view(
        options.template,
        buildViewData(request, {
          ...viewData,
          errorCode: apiError?.errorCode
        })
      )
    }

    return null
  }

  _projectNamePostRedirect(request, h) {
    const referenceNumber = request.params.referenceNumber || ''
    const isEditMode = !!referenceNumber
    if (isEditMode) {
      request.server.logger.info(
        { referenceNumber },
        'Project name step completed in edit mode, redirecting to overview'
      )
      return navigateToProjectOverview(referenceNumber, h)
    }
    const loggedInUserAreasArray = loggedInUserAreas(request)
    if (loggedInUserAreasArray.length > 1) {
      request.server.logger.info(
        { areasCount: loggedInUserAreasArray.length },
        'User has multiple areas, redirecting to area selection step'
      )
      return h.redirect(ROUTES.PROJECT.AREA).takeover()
    }
    const loggedInUserMainAreaData = loggedInUserMainArea(request)
    const areaId = Number(loggedInUserMainAreaData?.id)
    request.server.logger.info(
      { areaId },
      'User has single area, setting area in session and redirecting to project type step'
    )
    updateSessionData(request, { areaId })
    return h.redirect(ROUTES.PROJECT.TYPE).takeover()
  }

  async get(request, h) {
    return h.view(PROJECT_VIEWS.NAME, this._getViewData(request))
  }

  async _postSubmission(request, h) {
    const referenceNumber = request.params?.referenceNumber || ''
    const isEditMode = !!referenceNumber
    if (!isEditMode) {
      return null
    }
    const viewData = this._getViewData(request)
    return saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.PROJECT_NAME,
      viewData,
      PROJECT_VIEWS.NAME
    )
  }

  async post(request, h) {
    // Save form data to session
    updateSessionData(request, request.payload)
    const viewData = this._getViewData(request)
    try {
      const validationError = validatePayload(request, h, {
        template: PROJECT_VIEWS.NAME,
        schema: validateProjectName,
        viewData
      })
      if (validationError) {
        return validationError
      }

      const duplicateCheckError = await this._checkProjectNameDuplicate(
        request,
        h,
        { template: PROJECT_VIEWS.NAME }
      )
      if (duplicateCheckError) {
        return duplicateCheckError
      }

      const response = await this._postSubmission(request, h)
      if (response) {
        return response
      }

      return this._projectNamePostRedirect(request, h)
    } catch (error) {
      request.logger.error('Error project name POST', error)
      return h.view(PROJECT_VIEWS.NAME, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new NameController()

export const nameController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
