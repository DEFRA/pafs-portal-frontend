import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { RISK_AND_PROPERTIES_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import { getDynamicBackLink } from './helpers/navigation-helpers.js'
import { processPayload } from './helpers/payload-helpers.js'
import { handleConditionalRedirect } from './helpers/redirect-helpers.js'

// Payload level mappings for API submission
const PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.RISK]: PROJECT_PAYLOAD_LEVELS.RISK,
  [PROJECT_STEPS.MAIN_RISK]: PROJECT_PAYLOAD_LEVELS.MAIN_RISK,
  [PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING]:
    PROJECT_PAYLOAD_LEVELS.PROPERTY_AFFECTED_FLOODING,
  [PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION]:
    PROJECT_PAYLOAD_LEVELS.PROPERTY_AFFECTED_COASTAL_EROSION,
  [PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED]:
    PROJECT_PAYLOAD_LEVELS.TWENTY_PERCENT_DEPRIVED,
  [PROJECT_STEPS.FORTY_PERCENT_DEPRIVED]:
    PROJECT_PAYLOAD_LEVELS.FORTY_PERCENT_DEPRIVED,
  [PROJECT_STEPS.CURRENT_FLOOD_RISK]: PROJECT_PAYLOAD_LEVELS.CURRENT_FLOOD_RISK,
  [PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK]:
    PROJECT_PAYLOAD_LEVELS.CURRENT_FLOOD_SURFACE_WATER_RISK,
  [PROJECT_STEPS.CURRENT_COASTAL_EROSION_RISK]:
    PROJECT_PAYLOAD_LEVELS.CURRENT_COASTAL_EROSION_RISK
}

// Static step sequence (for steps that don't require conditional logic)
const STEP_SEQUENCE = {
  [PROJECT_STEPS.RISK]: ROUTES.PROJECT.EDIT.MAIN_RISK,
  [PROJECT_STEPS.MAIN_RISK]: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
  [PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING]:
    ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
  [PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION]:
    ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
  [PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED]:
    ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED
  // FORTY_PERCENT_DEPRIVED and risk steps handled by conditional logic
}

/**
 * Risk and Properties Controller
 * Handles all risk and property benefitting fields
 * Only update mode - always requires referenceNumber
 */
class RiskAndPropertiesController {
  _getConfig(step) {
    return RISK_AND_PROPERTIES_CONFIG[step]
  }

  _getRiskOptions(request) {
    const localKeyPrefix = 'projects.risk_and_properties.risk'
    return [
      {
        text: request.t(`${localKeyPrefix}.options.fluvial_flooding`),
        value: PROJECT_RISK_TYPES.FLUVIAL
      },
      {
        text: request.t(`${localKeyPrefix}.options.tidal_flooding`),
        value: PROJECT_RISK_TYPES.TIDAL
      },
      {
        text: request.t(`${localKeyPrefix}.options.groundwater_flooding`),
        value: PROJECT_RISK_TYPES.GROUNDWATER
      },
      {
        text: request.t(`${localKeyPrefix}.options.surface_water_flooding`),
        value: PROJECT_RISK_TYPES.SURFACE_WATER
      },
      {
        text: request.t(`${localKeyPrefix}.options.sea_flooding`),
        value: PROJECT_RISK_TYPES.SEA
      },
      {
        text: request.t(`${localKeyPrefix}.options.reservoir_flooding`),
        value: PROJECT_RISK_TYPES.RESERVOIR
      },
      {
        text: request.t(`${localKeyPrefix}.options.coastal_erosion`),
        value: PROJECT_RISK_TYPES.COASTAL_EROSION
      }
    ]
  }

  _getMainRiskOptions(request) {
    const sessionData = getSessionData(request)
    let selectedRisks = sessionData.risks || []
    const localKeyPrefix = 'projects.risk_and_properties.risk'

    // Ensure risks is an array (it might be a comma-separated string from backend or hidden input)
    if (typeof selectedRisks === 'string') {
      selectedRisks = selectedRisks.split(',').filter((risk) => risk.trim())
    }

    // Build radio options from selected risks
    return selectedRisks.map((risk) => {
      return {
        text: request.t(`${localKeyPrefix}.options.${risk}`),
        value: risk
      }
    })
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    let { backLinkOptions, localKeyPrefix, fieldType } = config
    const sessionData = getSessionData(request)

    // Get dynamic back link if applicable
    const dynamicBackLink = getDynamicBackLink(step, sessionData)
    if (dynamicBackLink) {
      backLinkOptions = dynamicBackLink
    }

    const additionalData = {
      step,
      projectSteps: PROJECT_STEPS,
      fieldType,
      riskOptions: this._getRiskOptions(request),
      mainRiskOptions: this._getMainRiskOptions(request),
      columnWidth: 'full'
    }

    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions,
      additionalData
    })
  }

  _getPayloadLevel(step) {
    return PAYLOAD_LEVEL_MAP[step]
  }

  async _postRedirect(request, h) {
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData
    const step = getProjectStep(request)

    // Handle conditional redirects (await required for async helper functions)
    // eslint-disable-next-line
    const conditionalRedirect = await handleConditionalRedirect(
      step,
      request,
      h,
      sessionData,
      referenceNumber
    )

    if (conditionalRedirect) {
      return conditionalRedirect
    }

    // For all other cases, move to the next step in sequence
    const nextRoute = STEP_SEQUENCE[step]
    if (nextRoute) {
      return h
        .redirect(nextRoute.replace('{referenceNumber}', referenceNumber))
        .takeover()
    }

    // Fallback to overview
    return navigateToProjectOverview(referenceNumber, h)
  }

  async get(request, h) {
    return h.view(PROJECT_VIEWS.RISK_AND_PROPERTIES, this._getViewData(request))
  }

  async _postSubmission(request, h) {
    const step = getProjectStep(request)
    const viewData = this._getViewData(request)
    const level = this._getPayloadLevel(step)

    return saveProjectWithErrorHandling(
      request,
      h,
      level,
      viewData,
      PROJECT_VIEWS.RISK_AND_PROPERTIES
    )
  }

  async post(request, h) {
    const step = getProjectStep(request)
    const sessionData = getSessionData(request)

    // Process and normalize payload
    processPayload(step, request.payload, sessionData)

    // Save form data to session
    updateSessionData(request, request.payload)
    const viewData = this._getViewData(request)
    const config = this._getConfig(step)
    const { schema } = config

    try {
      const validationError = validatePayload(request, h, {
        template: PROJECT_VIEWS.RISK_AND_PROPERTIES,
        schema,
        viewData
      })
      if (validationError) {
        return validationError
      }

      const response = await this._postSubmission(request, h)
      if (response) {
        return response
      }

      return await this._postRedirect(request, h)
    } catch (error) {
      request.logger.error('Error risk and properties POST', error)
      return h.view(PROJECT_VIEWS.RISK_AND_PROPERTIES, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new RiskAndPropertiesController()

export const riskAndPropertiesController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
