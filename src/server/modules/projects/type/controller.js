import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import {
  interventionTypesLocalKeyPrefix,
  PROJECT_TYPES_CONFIG,
  projectTypesLocalKeyPrefix
} from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  requiredInterventionTypesForProjectType,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'

const REFERENCE_NUMBER_PLACEHOLDER = '{referenceNumber}'

class TypeController {
  _getConfig(step) {
    return PROJECT_TYPES_CONFIG[step]
  }

  _getProjectTypeOptions(request, localKeyPrefix) {
    return [
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.DEF.toLowerCase()}`
        ),
        value: PROJECT_TYPES.DEF
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.REP.toLowerCase()}`
        ),
        value: PROJECT_TYPES.REP
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.REF.toLowerCase()}`
        ),
        value: PROJECT_TYPES.REF
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.HCR.toLowerCase()}`
        ),
        value: PROJECT_TYPES.HCR
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.STR.toLowerCase()}`
        ),
        value: PROJECT_TYPES.STR
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.STU.toLowerCase()}`
        ),
        value: PROJECT_TYPES.STU
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_TYPES.ELO.toLowerCase()}`
        ),
        value: PROJECT_TYPES.ELO
      }
    ]
  }

  _getInterventionTypeOptions(request, localKeyPrefix) {
    const projectSession = getSessionData(request)
    const interventionTypes = [
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_INTERVENTION_TYPES.NFM.toLowerCase()}`
        ),
        value: PROJECT_INTERVENTION_TYPES.NFM
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_INTERVENTION_TYPES.SUDS.toLowerCase()}`
        ),
        value: PROJECT_INTERVENTION_TYPES.SUDS
      }
    ]
    if (projectSession.projectType !== PROJECT_TYPES.REF) {
      interventionTypes.push({
        text: request.t(
          `${localKeyPrefix}.options.${PROJECT_INTERVENTION_TYPES.PFR.toLowerCase()}`
        ),
        value: PROJECT_INTERVENTION_TYPES.PFR
      })
    }
    interventionTypes.push({
      text: request.t(
        `${localKeyPrefix}.options.${PROJECT_INTERVENTION_TYPES.OTHER.toLowerCase()}`
      ),
      value: PROJECT_INTERVENTION_TYPES.OTHER
    })
    return interventionTypes
  }

  _getMainInterventionTypeOptions(request, localKeyPrefix) {
    const projectSession = getSessionData(request)
    const selectedInterventionTypes =
      projectSession.projectInterventionTypes || []

    // Build radio options from selected intervention types
    return selectedInterventionTypes.map((type) => ({
      text: request.t(`${localKeyPrefix}.options.${type.toLowerCase()}`),
      value: type
    }))
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const { backLinkOptions, localKeyPrefix } = config
    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions,
      additionalData: {
        step,
        projectSteps: PROJECT_STEPS,
        projectTypeOptions: this._getProjectTypeOptions(
          request,
          projectTypesLocalKeyPrefix
        ),
        interventionTypeOptions: this._getInterventionTypeOptions(
          request,
          interventionTypesLocalKeyPrefix
        ),
        mainInterventionTypeOptions: this._getMainInterventionTypeOptions(
          request,
          interventionTypesLocalKeyPrefix
        )
      }
    })
  }

  /**
   * Check if intervention types step should be skipped
   * @param {string} projectType - The project type
   * @returns {boolean} True if intervention types not required
   */
  _shouldSkipInterventionTypes(projectType) {
    return !requiredInterventionTypesForProjectType(projectType)
  }

  /**
   * Check if primary intervention type step should be skipped
   * @param {Array} interventionTypes - Selected intervention types
   * @returns {boolean} True if only one intervention type selected
   */
  _shouldSkipPrimaryInterventionType(interventionTypes) {
    return interventionTypes?.length === 1
  }

  /**
   * Get route with reference number replacement
   * @private
   */
  _replaceReferenceNumber(route, referenceNumber) {
    return route.replace(REFERENCE_NUMBER_PLACEHOLDER, referenceNumber || '')
  }

  /**
   * Get next route for TYPE step
   * @private
   */
  _getTypeStepRoute(projectType, isEditMode, referenceNumber, h) {
    if (this._shouldSkipInterventionTypes(projectType)) {
      return isEditMode
        ? navigateToProjectOverview(referenceNumber, h)
        : ROUTES.PROJECT.FINANCIAL_START_YEAR
    }
    return isEditMode
      ? this._replaceReferenceNumber(
          ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
          referenceNumber
        )
      : ROUTES.PROJECT.INTERVENTION_TYPE
  }

  /**
   * Get next route for INTERVENTION_TYPE step
   * @private
   */
  _getInterventionTypeStepRoute(
    projectInterventionTypes,
    isEditMode,
    referenceNumber,
    h
  ) {
    if (this._shouldSkipPrimaryInterventionType(projectInterventionTypes)) {
      return isEditMode
        ? navigateToProjectOverview(referenceNumber, h)
        : ROUTES.PROJECT.FINANCIAL_START_YEAR
    }
    const route = isEditMode
      ? ROUTES.PROJECT.EDIT.PRIMARY_INTERVENTION_TYPE
      : ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE
    return this._replaceReferenceNumber(route, referenceNumber)
  }

  /**
   * Determine next route based on current step and session data
   * @param {string} step - Current step
   * @param {Object} projectSession - Project session data
   * @param {boolean} isEditMode - Whether in edit mode
   * @param {Object} h - Hapi response toolkit
   * @returns {string|Object} Next route path or response object
   */
  _getNextRoute(step, projectSession, isEditMode, h) {
    const {
      projectType,
      projectInterventionTypes,
      slug: referenceNumber
    } = projectSession

    if (step === PROJECT_STEPS.TYPE) {
      return this._getTypeStepRoute(projectType, isEditMode, referenceNumber, h)
    }

    if (step === PROJECT_STEPS.INTERVENTION_TYPE) {
      return this._getInterventionTypeStepRoute(
        projectInterventionTypes,
        isEditMode,
        referenceNumber,
        h
      )
    }

    if (step === PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE) {
      return isEditMode
        ? navigateToProjectOverview(referenceNumber, h)
        : ROUTES.PROJECT.FINANCIAL_START_YEAR
    }

    return ROUTES.PROJECT.START
  }

  /**
   * Determine if project should be submitted in current step
   * Only submit when in edit mode and completing final step of type section
   * @param {string} step - Current step
   * @param {Object} payload - Request payload
   * @param {boolean} isEditMode - Whether in edit mode
   * @returns {boolean} True if should submit to API
   */
  _shouldSubmitProject(step, payload, isEditMode) {
    if (!isEditMode) {
      return false
    }

    const { projectType, projectInterventionTypes } = payload

    return (
      (step === PROJECT_STEPS.TYPE &&
        this._shouldSkipInterventionTypes(projectType)) ||
      (step === PROJECT_STEPS.INTERVENTION_TYPE &&
        this._shouldSkipPrimaryInterventionType(projectInterventionTypes)) ||
      step === PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE
    )
  }

  async get(request, h) {
    return h.view(PROJECT_VIEWS.TYPE, this._getViewData(request))
  }

  /**
   * Update session with normalized payload data
   * Clears intervention type fields when not required
   */
  _updateTypeInSession(request) {
    const payload = request.payload
    const step = getProjectStep(request)
    const { projectType, projectInterventionTypes } = payload

    let finalPayload = { ...payload }

    // Clear intervention data if not required for project type
    if (
      step === PROJECT_STEPS.TYPE &&
      this._shouldSkipInterventionTypes(projectType)
    ) {
      finalPayload = {
        ...finalPayload,
        projectInterventionTypes: [],
        mainInterventionType: ''
      }
    }

    // Auto-select main intervention type if only one selected
    if (
      step === PROJECT_STEPS.INTERVENTION_TYPE &&
      this._shouldSkipPrimaryInterventionType(projectInterventionTypes)
    ) {
      finalPayload = {
        ...finalPayload,
        mainInterventionType: projectInterventionTypes[0]
      }
    }

    updateSessionData(request, finalPayload)
  }

  async post(request, h) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const { schema } = config

    try {
      // Normalize projectInterventionTypes to always be an array
      if (
        request.payload.projectInterventionTypes &&
        !Array.isArray(request.payload.projectInterventionTypes)
      ) {
        request.payload.projectInterventionTypes = [
          request.payload.projectInterventionTypes
        ]
      }

      // Save form data to session
      this._updateTypeInSession(request)
      const viewData = this._getViewData(request)

      // Validate payload
      const validationError = validatePayload(request, h, {
        template: PROJECT_VIEWS.TYPE,
        schema,
        viewData
      })
      if (validationError) {
        return validationError
      }

      // Submit to API if in edit mode and at final step of type section
      const referenceNumber = request.params?.referenceNumber || ''
      const isEditMode = !!referenceNumber

      if (this._shouldSubmitProject(step, request.payload, isEditMode)) {
        const response = await saveProjectWithErrorHandling(
          request,
          h,
          PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
          viewData,
          PROJECT_VIEWS.TYPE
        )
        if (response) {
          return response
        }
      }

      // Navigate to next step
      const projectSession = getSessionData(request)
      const nextRoute = this._getNextRoute(step, projectSession, isEditMode, h)

      return typeof nextRoute === 'object'
        ? nextRoute // Already a response object from navigateToProjectOverview
        : h.redirect(nextRoute).takeover()
    } catch (error) {
      const viewData = this._getViewData(request)
      request.logger.error('Error project type POST', error)
      return h.view(PROJECT_VIEWS.TYPE, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new TypeController()

export const typeController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
