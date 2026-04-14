import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import {
  CARBON_HIDDEN_PROJECT_TYPES,
  ALL_CARBON_FIELDS,
  CARBON_STEP_SCHEMAS
} from '../schemas/carbon-impact-schema.js'
import { getCarbonImpactCalc } from '../../../common/services/project/project-service.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

const VIEW = PROJECT_VIEWS.CARBON_IMPACT

/**
 * Carbon field name list — the 6 inputs on the form.
 */
const CARBON_FIELDS = ALL_CARBON_FIELDS

/**
 * Map step to view name and local key prefix
 */
const STEP_TO_CONFIG = {
  [PROJECT_STEPS.CARBON_IMPACT]: {
    view: PROJECT_VIEWS.CARBON_IMPACT,
    localKeyPrefix: 'projects.carbon_impact'
  },
  [PROJECT_STEPS.CARBON_REQUIRED_INFORMATION]: {
    view: PROJECT_VIEWS.CARBON_REQUIRED_INFORMATION,
    localKeyPrefix: 'projects.carbon_required_information'
  },
  [PROJECT_STEPS.CARBON_PREPARE]: {
    view: PROJECT_VIEWS.CARBON_PREPARE,
    localKeyPrefix: 'projects.carbon_prepare'
  },
  [PROJECT_STEPS.CARBON_COST_BUILD]: {
    view: PROJECT_VIEWS.CARBON_COST_BUILD,
    localKeyPrefix: 'projects.carbon_cost_build',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
  },
  [PROJECT_STEPS.CARBON_COST_OPERATION]: {
    view: PROJECT_VIEWS.CARBON_COST_OPERATION,
    localKeyPrefix: 'projects.carbon_cost_operation',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION
  },
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]: {
    view: PROJECT_VIEWS.CARBON_COST_SEQUESTERED,
    localKeyPrefix: 'projects.carbon_cost_sequestered',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED
  },
  [PROJECT_STEPS.CARBON_COST_AVOIDED]: {
    view: PROJECT_VIEWS.CARBON_COST_AVOIDED,
    localKeyPrefix: 'projects.carbon_cost_avoided',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED
  },
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: {
    view: PROJECT_VIEWS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
    localKeyPrefix: 'projects.carbon_savings_net_economic_benefit',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
  },
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]: {
    view: PROJECT_VIEWS.CARBON_OPERATIONAL_COST_FORECAST,
    localKeyPrefix: 'projects.carbon_operational_cost_forecast',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
  },
  [PROJECT_STEPS.WHOLE_LIFE_CARBON]: {
    view: PROJECT_VIEWS.WHOLE_LIFE_CARBON,
    localKeyPrefix: 'projects.carbon_whole_life_carbon',
    isDisplay: true
  },
  [PROJECT_STEPS.NET_CARBON]: {
    view: PROJECT_VIEWS.NET_CARBON,
    localKeyPrefix: 'projects.carbon_net_carbon',
    isDisplay: true
  },
  [PROJECT_STEPS.CARBON_SUMMARY]: {
    view: PROJECT_VIEWS.CARBON_SUMMARY,
    localKeyPrefix: 'projects.carbon_impact_summary',
    isDisplay: true
  },
  [PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT]: {
    view: PROJECT_VIEWS.CARBON_IMPACT_ASSESSMENT,
    localKeyPrefix: 'projects.carbon_impact',
    isDisplay: true
  }
}

/**
 * Navigation sequence for input pages
 */
const INPUT_PAGE_SEQUENCE = [
  PROJECT_STEPS.CARBON_COST_BUILD,
  PROJECT_STEPS.CARBON_COST_OPERATION,
  PROJECT_STEPS.CARBON_COST_SEQUESTERED,
  PROJECT_STEPS.CARBON_COST_AVOIDED,
  PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST
]

/**
 * Complete page sequence including input and display pages
 * Determines navigation flow through the carbon impact wizard
 */
const FULL_PAGE_SEQUENCE = [
  PROJECT_STEPS.CARBON_COST_BUILD,
  PROJECT_STEPS.CARBON_COST_OPERATION,
  PROJECT_STEPS.WHOLE_LIFE_CARBON,
  PROJECT_STEPS.CARBON_COST_SEQUESTERED,
  PROJECT_STEPS.CARBON_COST_AVOIDED,
  PROJECT_STEPS.NET_CARBON,
  PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST,
  PROJECT_STEPS.CARBON_SUMMARY,
  PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT
]

const DISPLAY_PAGE_SEQUENCE = new Set([
  PROJECT_STEPS.WHOLE_LIFE_CARBON,
  PROJECT_STEPS.NET_CARBON,
  PROJECT_STEPS.CARBON_SUMMARY,
  PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT
])

/**
 * Map each input step to its per-step Joi validation schema.
 * Keyed by step name; value is the schema from CARBON_STEP_SCHEMAS.
 */
const STEP_SCHEMA_MAP = {
  [PROJECT_STEPS.CARBON_COST_BUILD]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD],
  [PROJECT_STEPS.CARBON_COST_OPERATION]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION],
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED],
  [PROJECT_STEPS.CARBON_COST_AVOIDED]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED],
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
    CARBON_STEP_SCHEMAS[
      PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
    ],
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]
}

/**
 * Map each input step to its API payload level for database persistence.
 */
const STEP_PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.CARBON_COST_BUILD]: PROJECT_PAYLOAD_LEVELS.CARBON_COST_BUILD,
  [PROJECT_STEPS.CARBON_COST_OPERATION]:
    PROJECT_PAYLOAD_LEVELS.CARBON_COST_OPERATION,
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]:
    PROJECT_PAYLOAD_LEVELS.CARBON_COST_SEQUESTERED,
  [PROJECT_STEPS.CARBON_COST_AVOIDED]:
    PROJECT_PAYLOAD_LEVELS.CARBON_COST_AVOIDED,
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
    PROJECT_PAYLOAD_LEVELS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]:
    PROJECT_PAYLOAD_LEVELS.CARBON_OPERATIONAL_COST_FORECAST
}

const getStep = (request) => {
  if (!request?.route?.path) {
    return PROJECT_STEPS.CARBON_COST_BUILD
  }
  return getProjectStep(request)
}

const hasCarbonPrerequisites = (sessionData = {}) => {
  return (
    sessionData[PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH] != null &&
    sessionData[PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR] != null &&
    sessionData[PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH] != null &&
    sessionData[PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR] != null
  )
}

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  const numericValue = Number(String(value).replaceAll(',', ''))
  if (Number.isNaN(numericValue)) {
    return 'Not provided'
  }

  return `£${new Intl.NumberFormat('en-GB').format(numericValue)}`
}

/**
 * Get next route for a given step
 */
const getNextRouteForStep = (step, referenceNumber) => {
  const pageIndex = FULL_PAGE_SEQUENCE.indexOf(step)
  if (pageIndex !== -1 && pageIndex < FULL_PAGE_SEQUENCE.length - 1) {
    const nextStep = FULL_PAGE_SEQUENCE[pageIndex + 1]
    return getRouteForStep(nextStep, referenceNumber)
  }

  // If at the last page in sequence, redirect to overview
  return ROUTES.PROJECT.OVERVIEW.replace(
    REFERENCE_NUMBER_PARAM,
    referenceNumber
  )
}

/**
 * Get route URL for a given step
 */
const getRouteForStep = (step, referenceNumber) => {
  let route = ROUTES.PROJECT.OVERVIEW
  switch (step) {
    case PROJECT_STEPS.CARBON_REQUIRED_INFORMATION:
      route = ROUTES.PROJECT.EDIT.CARBON_REQUIRED_INFORMATION
      break
    case PROJECT_STEPS.CARBON_PREPARE:
      route = ROUTES.PROJECT.EDIT.CARBON_PREPARE
      break
    case PROJECT_STEPS.CARBON_COST_BUILD:
      route = ROUTES.PROJECT.EDIT.CARBON_COST_BUILD
      break
    case PROJECT_STEPS.CARBON_COST_OPERATION:
      route = ROUTES.PROJECT.EDIT.CARBON_COST_OPERATION
      break
    case PROJECT_STEPS.CARBON_COST_SEQUESTERED:
      route = ROUTES.PROJECT.EDIT.CARBON_COST_SEQUESTERED
      break
    case PROJECT_STEPS.CARBON_COST_AVOIDED:
      route = ROUTES.PROJECT.EDIT.CARBON_COST_AVOIDED
      break
    case PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT:
      route = ROUTES.PROJECT.EDIT.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
      break
    case PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST:
      route = ROUTES.PROJECT.EDIT.CARBON_OPERATIONAL_COST_FORECAST
      break
    case PROJECT_STEPS.WHOLE_LIFE_CARBON:
      route = ROUTES.PROJECT.EDIT.WHOLE_LIFE_CARBON
      break
    case PROJECT_STEPS.NET_CARBON:
      route = ROUTES.PROJECT.EDIT.NET_CARBON
      break
    case PROJECT_STEPS.CARBON_SUMMARY:
      route = ROUTES.PROJECT.EDIT.CARBON_SUMMARY
      break
    case PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT:
      route = ROUTES.PROJECT.EDIT.CARBON_IMPACT_ASSESSMENT
      break
  }

  return route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
}

/**
 * Carbon Impact Controller
 *
 * Multi-step wizard with 12 pages:
 * - Page 1: Entry point (prerequisite check)
 * - Page 2: Required information (if prerequisites NOT met)
 * - Page 3: Prepare (if prerequisites ARE met)
 * - Pages 4-9: Input pages (6 carbon fields)
 * - Pages 10-12: Display pages (calculated values)
 */
class CarbonImpactController {
  _getProjectType(request) {
    const sessionData = getSessionData(request)
    return sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
  }

  _isHiddenForProjectType(projectType) {
    return CARBON_HIDDEN_PROJECT_TYPES.includes(projectType)
  }

  _buildViewData(request, extraData = {}) {
    const step = getStep(request)
    const stepConfig = STEP_TO_CONFIG[step]
    const localKeyPrefix =
      stepConfig?.localKeyPrefix || 'projects.carbon_impact'
    const fieldName = stepConfig?.fieldName

    const extraDataToPass = {
      ...extraData
    }

    if (fieldName) {
      extraDataToPass.fieldName = fieldName
    }

    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions: {
        targetEditURL: ROUTES.PROJECT.OVERVIEW,
        conditionalRedirect: true
      },
      additionalData: {
        step,
        carbonFields: CARBON_FIELDS,
        columnWidth: 'full',
        PROJECT_PAYLOAD_FIELDS,
        ...extraDataToPass
      }
    })
  }

  async get(request, h) {
    const projectType = this._getProjectType(request)
    const step = getStep(request)

    if (this._isHiddenForProjectType(projectType)) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    // Entry point — check prerequisites
    if (step === PROJECT_STEPS.CARBON_IMPACT) {
      const sessionData = getSessionData(request)
      const targetRoute = hasCarbonPrerequisites(sessionData)
        ? ROUTES.PROJECT.EDIT.CARBON_PREPARE
        : ROUTES.PROJECT.EDIT.CARBON_REQUIRED_INFORMATION

      return h
        .redirect(
          targetRoute.replace(
            REFERENCE_NUMBER_PARAM,
            request.params.referenceNumber
          )
        )
        .takeover()
    }

    // Info/guidance pages
    if (
      [
        PROJECT_STEPS.CARBON_REQUIRED_INFORMATION,
        PROJECT_STEPS.CARBON_PREPARE
      ].includes(step)
    ) {
      const stepConfig = STEP_TO_CONFIG[step]
      return h.view(stepConfig.view, this._buildViewData(request))
    }

    // Input and display pages
    const stepConfig = STEP_TO_CONFIG[step]
    if (stepConfig) {
      if (stepConfig.isDisplay) {
        return this._renderDisplayPage(request, h, step, stepConfig)
      }

      const viewData = this._buildViewData(request)
      return h.view(stepConfig.view, viewData)
    }

    return h.view(VIEW, this._buildViewData(request))
  }

  /**
   * Render a display page with session-derived data.
   * For the carbon-impact-assessment page, also calls the backend API
   * to attach calculated baseline/target values.
   */
  async _renderDisplayPage(request, h, step, stepConfig) {
    const sessionData = getSessionData(request)
    const build = Number(
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD] || 0
    )
    const operation = Number(
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION] || 0
    )
    const sequestered = Number(
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED] || 0
    )
    const avoided = Number(
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED] || 0
    )

    const displayData = {
      build,
      operation,
      sequestered,
      avoided,
      wholeLifeCarbon: build + operation,
      netCarbon: build + operation - sequestered - avoided,
      benefit:
        sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT],
      forecast:
        sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST],
      benefitDisplay: formatCurrency(
        sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]
      ),
      forecastDisplay: formatCurrency(
        sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]
      ),
      capitalCostEstimateDisplay: formatCurrency(
        sessionData[
          PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS
        ]
      )
    }

    if (
      step === PROJECT_STEPS.CARBON_SUMMARY ||
      step === PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT
    ) {
      await this._enrichWithCalculatedValues(request, displayData)
    }

    const viewData = this._buildViewData(request, { displayData })
    return h.view(stepConfig.view, viewData)
  }

  /**
   * Fetch calculated carbon impact values from backend and merge into displayData.
   * Non-fatal — page still renders with "Not provided" if the API call fails.
   */
  async _enrichWithCalculatedValues(request, displayData) {
    try {
      const authSession = getAuthSession(request)
      const accessToken = authSession?.accessToken || ''
      const calcResult = await getCarbonImpactCalc(
        request.params.referenceNumber,
        accessToken
      )
      if (calcResult?.success && calcResult?.data) {
        const c = calcResult.data
        displayData.capitalCarbonBaseline = c.capitalCarbonBaseline
        displayData.capitalCarbonTarget = c.capitalCarbonTarget
        displayData.operationalCarbonBaseline = c.operationalCarbonBaseline
        displayData.operationalCarbonTarget = c.operationalCarbonTarget
        displayData.netCarbonEstimate =
          c.netCarbonEstimate ?? displayData.netCarbon
        displayData.netCarbonWithBlanks = c.netCarbonWithBlanks
        displayData.allCarbonValuesPresent =
          c.carbonCostBuild != null &&
          c.carbonCostOperation != null &&
          c.carbonCostSequestered != null &&
          c.carbonCostAvoided != null
        const constructionTotalFundingDisplay = formatCurrency(
          c.constructionTotalFunding
        )
        displayData.constructionTotalFunding = constructionTotalFundingDisplay
        // Keep carbon-summary's capital cost row aligned with overview value source
        displayData.capitalCostEstimateDisplay = constructionTotalFundingDisplay
      } else {
        // Fallback — use session-computed net carbon if API didn't return data
        displayData.netCarbonEstimate = displayData.netCarbon
        displayData.allCarbonValuesPresent = false
      }
    } catch (err) {
      request.log?.(
        ['warn', 'carbon-impact'],
        `Carbon impact calc fetch failed: ${err.message}`
      )
    }
  }

  /**
   * Save the current hexdigest of calculated values to the database.
   * Called when the user completes the carbon-impact-assessment (last) page.
   * This stored value is compared on every overview load to detect drift
   * caused by changes to Important Dates or Funding Sources.
   */
  async _saveHexdigest(request, referenceNumber) {
    try {
      const authSession = getAuthSession(request)
      const accessToken = authSession?.accessToken || ''
      const calcResult = await getCarbonImpactCalc(referenceNumber, accessToken)

      if (calcResult?.success && calcResult?.data?.hexdigest) {
        const sessionData = getSessionData(request)
        sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_VALUES_HEXDIGEST] =
          calcResult.data.hexdigest
        updateSessionData(request, sessionData)

        // Persist hexdigest to database
        await saveProjectWithErrorHandling(
          request,
          null,
          PROJECT_PAYLOAD_LEVELS.CARBON_VALUES_HEXDIGEST,
          {},
          null
        )
      }
    } catch (err) {
      request.log?.(
        ['warn', 'carbon-impact'],
        `Failed to save carbon hexdigest: ${err.message}`
      )
    }
  }

  /**
   * Handle POST for a single input step:
   * validate → session update → DB save → redirect.
   * Returns null on success (caller should redirect), or a Hapi response on error.
   */
  async _handleInputStep(request, h, step, referenceNumber) {
    const stepConfig = STEP_TO_CONFIG[step]
    const fieldName = stepConfig?.fieldName

    if (!fieldName) {
      return h.view(
        stepConfig?.view || VIEW,
        this._buildViewData(request, { error: 'Configuration error' })
      )
    }

    // Extract and sanitize the field value
    let fieldValue = request.payload[fieldName]
    if (typeof fieldValue === 'string') {
      fieldValue = fieldValue.replaceAll(',', '').trim()
    }

    // Run per-step validation if a schema exists for this step
    const stepSchema = STEP_SCHEMA_MAP[step]
    if (stepSchema) {
      const sanitizedPayload = { ...request.payload, [fieldName]: fieldValue }
      const { error } = stepSchema.validate(sanitizedPayload, {
        abortEarly: false
      })

      if (error) {
        const fieldErrors = extractJoiErrors(error)
        return h.view(
          stepConfig.view,
          this._buildViewData(request, {
            fieldErrors,
            formData: { [fieldName]: fieldValue }
          })
        )
      }
    }

    // Store in session
    const sessionData = getSessionData(request)
    sessionData[fieldName] = fieldValue || null
    updateSessionData(request, sessionData)

    // Persist to database if a payload level is mapped for this step
    const payloadLevel = STEP_PAYLOAD_LEVEL_MAP[step]
    if (payloadLevel) {
      const viewData = this._buildViewData(request)
      const saveResponse = await saveProjectWithErrorHandling(
        request,
        h,
        payloadLevel,
        viewData,
        stepConfig.view
      )
      if (saveResponse) {
        return saveResponse
      }
    }

    return null // success — caller redirects
  }

  async post(request, h) {
    const projectType = this._getProjectType(request)
    const step = getStep(request)
    const referenceNumber = request.params.referenceNumber

    if (this._isHiddenForProjectType(projectType)) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    // Prerequisite page — redirect to overview
    if (step === PROJECT_STEPS.CARBON_REQUIRED_INFORMATION) {
      return h
        .redirect(
          ROUTES.PROJECT.OVERVIEW.replace(
            REFERENCE_NUMBER_PARAM,
            referenceNumber
          )
        )
        .takeover()
    }

    // Prepare page — redirect to first input page
    if (step === PROJECT_STEPS.CARBON_PREPARE) {
      return h
        .redirect(getRouteForStep(INPUT_PAGE_SEQUENCE[0], referenceNumber))
        .takeover()
    }

    // Input pages
    if (INPUT_PAGE_SEQUENCE.includes(step)) {
      const inputResponse = await this._handleInputStep(
        request,
        h,
        step,
        referenceNumber
      )
      if (inputResponse) {
        return inputResponse
      }
      const nextRoute = getNextRouteForStep(step, referenceNumber)
      return h.redirect(nextRoute).takeover()
    }

    // Display pages — redirect to next or back to overview
    if (DISPLAY_PAGE_SEQUENCE.has(step)) {
      // On carbon-impact-assessment (last page), save the hexdigest
      // so the overview can detect when calculated values change later
      if (step === PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT) {
        await this._saveHexdigest(request, referenceNumber)
      }
      const nextRoute = getNextRouteForStep(step, referenceNumber)
      return h.redirect(nextRoute).takeover()
    }

    return h.view(VIEW, this._buildViewData(request))
  }
}

const controller = new CarbonImpactController()

export const carbonImpactController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
