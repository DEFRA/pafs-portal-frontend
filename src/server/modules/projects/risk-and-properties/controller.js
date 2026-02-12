import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { RISK_AND_PROPERTIES_CONFIG } from '../helpers/project-config.js'
import {
  saveProjectWithErrorHandling,
  submitProject
} from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'

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
    PROJECT_PAYLOAD_LEVELS.FORTY_PERCENT_DEPRIVED
}

// Step sequence for navigation flow
const STEP_SEQUENCE = {
  [PROJECT_STEPS.RISK]: ROUTES.PROJECT.EDIT.MAIN_RISK,
  [PROJECT_STEPS.MAIN_RISK]: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
  [PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING]:
    ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
  [PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION]:
    ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
  [PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED]:
    ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED,
  [PROJECT_STEPS.FORTY_PERCENT_DEPRIVED]: ROUTES.PROJECT.OVERVIEW
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

    // Override back link for property affected flooding based on risks
    if (step === PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING) {
      const risks = sessionData.risks || []

      if (this._shouldSkipMainRisk(risks)) {
        // If only one risk was selected, main risk page was skipped
        // So back goes to risk page
        backLinkOptions = {
          targetURL: ROUTES.PROJECT.OVERVIEW,
          targetEditURL: ROUTES.PROJECT.EDIT.RISK,
          conditionalRedirect: false
        }
      } else {
        // Multiple risks selected, back goes to main risk page
        backLinkOptions = {
          targetURL: ROUTES.PROJECT.OVERVIEW,
          targetEditURL: ROUTES.PROJECT.EDIT.MAIN_RISK,
          conditionalRedirect: false
        }
      }
    }

    // Override back link for property affected coastal erosion based on risks
    if (step === PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION) {
      const risks = sessionData.risks || []
      const mainRisk = sessionData.mainRisk

      if (this._shouldSkipPropertyAffectedFlooding(mainRisk, risks)) {
        // If coastal erosion is the ONLY risk, flooding page was skipped
        if (this._shouldSkipMainRisk(risks)) {
          // Only one risk (coastal erosion), both main risk and flooding pages were skipped
          // So back goes to risk page
          backLinkOptions = {
            targetURL: ROUTES.PROJECT.OVERVIEW,
            targetEditURL: ROUTES.PROJECT.EDIT.RISK,
            conditionalRedirect: false
          }
        } else {
          // Multiple risks but main risk is coastal erosion, main risk page was shown
          // So back goes to main risk page
          backLinkOptions = {
            targetURL: ROUTES.PROJECT.OVERVIEW,
            targetEditURL: ROUTES.PROJECT.EDIT.MAIN_RISK,
            conditionalRedirect: false
          }
        }
      } else {
        // Multiple risks including coastal erosion, flooding page was shown
        // So back goes to flooding page
        backLinkOptions = {
          targetURL: ROUTES.PROJECT.OVERVIEW,
          targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
          conditionalRedirect: false
        }
      }
    }

    // Override back link for twenty percent deprived based on risks
    if (step === PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED) {
      const risks = sessionData.risks || []

      if (this._shouldShowPropertyAffectedCoastalErosion(risks)) {
        // If coastal erosion was selected, back goes to coastal erosion page
        backLinkOptions = {
          targetURL: ROUTES.PROJECT.OVERVIEW,
          targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
          conditionalRedirect: false
        }
      } else {
        // If coastal erosion not selected, back goes to flooding page
        backLinkOptions = {
          targetURL: ROUTES.PROJECT.OVERVIEW,
          targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
          conditionalRedirect: false
        }
      }
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

  /**
   * Check if main risk step should be skipped
   * Skip if only one risk is selected
   * @param {Array} risks - Selected risks
   * @returns {boolean} True if should skip main risk step
   */
  _shouldSkipMainRisk(risks) {
    return risks?.length === 1
  }

  /**
   * Check if property affected flooding step should be skipped
   * Skip if coastal erosion is the ONLY risk selected
   * @param {string} mainRisk - Selected main risk
   * @param {Array} risks - Selected risks
   * @returns {boolean} True if should skip flooding property step
   */
  _shouldSkipPropertyAffectedFlooding(mainRisk, risks) {
    return (
      mainRisk === PROJECT_RISK_TYPES.COASTAL_EROSION && risks?.length === 1
    )
  }

  /**
   * Check if property affected coastal erosion step should be shown
   * Show if risks include coastal erosion
   * @param {Array} risks - Selected risks
   * @returns {boolean} True if should show coastal erosion property step
   */
  _shouldShowPropertyAffectedCoastalErosion(risks) {
    return risks && risks.includes(PROJECT_RISK_TYPES.COASTAL_EROSION)
  }

  async _postRedirect(request, h) {
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData
    const step = getProjectStep(request)

    // Handle RISK step - conditional branching based on number of risks selected
    if (step === PROJECT_STEPS.RISK) {
      const risks = sessionData.risks || []

      if (this._shouldSkipMainRisk(risks)) {
        // If only one risk, auto-set it as main risk
        const mainRisk = risks[0]
        updateSessionData(request, { mainRisk })

        // Save the main risk to backend using submitProject directly
        const result = await submitProject(
          request,
          PROJECT_PAYLOAD_LEVELS.MAIN_RISK
        )

        // If submission failed, log the error (but continue since risk was already saved)
        if (!result.success) {
          request.logger.error('Failed to save main risk', result.error)
        }

        // Check if we should skip flooding property step
        if (this._shouldSkipPropertyAffectedFlooding(mainRisk, risks)) {
          // If main risk is coastal erosion only, check if we should show coastal erosion properties
          if (this._shouldShowPropertyAffectedCoastalErosion(risks)) {
            return h
              .redirect(
                ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION.replace(
                  '{referenceNumber}',
                  referenceNumber
                )
              )
              .takeover()
          }
          // Go to twenty percent deprived page
          return h
            .redirect(
              ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED.replace(
                '{referenceNumber}',
                referenceNumber
              )
            )
            .takeover()
        }

        return h
          .redirect(
            ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING.replace(
              '{referenceNumber}',
              referenceNumber
            )
          )
          .takeover()
      }

      // Multiple risks selected, go to main risk page
      return h
        .redirect(
          ROUTES.PROJECT.EDIT.MAIN_RISK.replace(
            '{referenceNumber}',
            referenceNumber
          )
        )
        .takeover()
    }

    // Handle MAIN_RISK step - conditional branching based on selected main risk
    if (step === PROJECT_STEPS.MAIN_RISK) {
      const mainRisk = sessionData.mainRisk
      const risks = sessionData.risks || []

      if (this._shouldSkipPropertyAffectedFlooding(mainRisk, risks)) {
        // Skip flooding properties (coastal erosion is the only risk), go to coastal erosion if applicable
        if (this._shouldShowPropertyAffectedCoastalErosion(risks)) {
          return h
            .redirect(
              ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION.replace(
                '{referenceNumber}',
                referenceNumber
              )
            )
            .takeover()
        }
        // Go to twenty percent deprived page
        return h
          .redirect(
            ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED.replace(
              '{referenceNumber}',
              referenceNumber
            )
          )
          .takeover()
      }

      return h
        .redirect(
          ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING.replace(
            '{referenceNumber}',
            referenceNumber
          )
        )
        .takeover()
    }

    // Handle PROPERTY_AFFECTED_FLOODING step - check if coastal erosion page needed
    if (step === PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING) {
      const risks = sessionData.risks || []

      if (this._shouldShowPropertyAffectedCoastalErosion(risks)) {
        return h
          .redirect(
            ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION.replace(
              '{referenceNumber}',
              referenceNumber
            )
          )
          .takeover()
      }

      // No coastal erosion, go to twenty percent deprived page
      return h
        .redirect(
          ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED.replace(
            '{referenceNumber}',
            referenceNumber
          )
        )
        .takeover()
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

    // Normalize risks to always be an array
    if (request.payload.risks) {
      if (!Array.isArray(request.payload.risks)) {
        // If it's a comma-separated string, split it
        if (
          typeof request.payload.risks === 'string' &&
          request.payload.risks.includes(',')
        ) {
          request.payload.risks = request.payload.risks
            .split(',')
            .filter((risk) => risk.trim())
        } else {
          request.payload.risks = [request.payload.risks]
        }
      }
    }

    // Handle risk changes - clear property fields when risks change
    if (step === PROJECT_STEPS.RISK) {
      const previousRisks = sessionData.risks || []
      const newRisks = request.payload.risks || []

      // Check if coastal erosion status changed
      const hadCoastalErosion = previousRisks.includes(
        PROJECT_RISK_TYPES.COASTAL_EROSION
      )
      const hasCoastalErosion = newRisks.includes(
        PROJECT_RISK_TYPES.COASTAL_EROSION
      )

      // Check if there are any flood risks (non-coastal erosion risks)
      const hadFloodRisks = previousRisks.some(
        (risk) => risk !== PROJECT_RISK_TYPES.COASTAL_EROSION
      )
      const hasFloodRisks = newRisks.some(
        (risk) => risk !== PROJECT_RISK_TYPES.COASTAL_EROSION
      )

      // If we no longer have coastal erosion, clear coastal erosion property fields
      if (hadCoastalErosion && !hasCoastalErosion) {
        request.payload[
          PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK
        ] = null
        request.payload[
          PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL
        ] = null
        request.payload[
          PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION
        ] = null
      }

      // If we no longer have flood risks (only coastal erosion or nothing), clear flooding property fields
      if (hadFloodRisks && !hasFloodRisks) {
        request.payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK] = null
        request.payload[PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS] =
          null
        request.payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS] =
          null
        request.payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50] =
          null
        request.payload[PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE] =
          null
      }
    }

    // Normalize noPropertiesAtRisk checkbox - if unchecked, it won't be in payload
    if (step === PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING) {
      // Convert checkbox value to boolean for validation
      if (request.payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK]) {
        request.payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK] = true
        // Clear property field values when checkbox is checked
        request.payload[PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS] =
          null
        request.payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS] =
          null
        request.payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50] =
          null
        request.payload[PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE] =
          null
      } else {
        request.payload[PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK] = false
      }
    }

    // Normalize noPropertiesAtCoastalErosionRisk checkbox
    if (step === PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION) {
      // Convert checkbox value to boolean for validation
      if (
        request.payload[
          PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK
        ]
      ) {
        request.payload[
          PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK
        ] = true
        // Clear property field values when checkbox is checked
        request.payload[
          PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL
        ] = null
        request.payload[
          PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION
        ] = null
      } else {
        request.payload[
          PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK
        ] = false
      }
    }

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
