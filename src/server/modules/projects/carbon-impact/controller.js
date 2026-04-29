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
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import { CARBON_HIDDEN_PROJECT_TYPES } from '../schemas/carbon-impact-schema.js'
import { getCarbonImpactCalc } from '../../../common/services/project/project-service.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  DISPLAY_PAGE_SEQUENCE,
  getCarbonFields,
  getNextRouteForStep,
  getPreviousRouteForStep,
  getRouteForStep,
  getStep,
  hasCarbonPrerequisites,
  INPUT_PAGE_SEQUENCE,
  STEP_PAYLOAD_LEVEL_MAP,
  STEP_SCHEMA_MAP,
  STEP_TO_CONFIG,
  VIEW
} from './controller-helpers.js'
import {
  applyFallbackValues,
  buildInitialDisplayData,
  extractCarbonCosts,
  logError,
  mergeCalculatedValues
} from './carbon-display-helpers.js'

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

    if (stepConfig?.introCount != null) {
      extraDataToPass.introCount = stepConfig.introCount
    }
    if (stepConfig?.afterCount != null) {
      extraDataToPass.afterCount = stepConfig.afterCount
    }
    if (stepConfig?.hasIntroLink) {
      extraDataToPass.hasIntroLink = stepConfig.hasIntroLink
    }
    if (stepConfig?.hasIntroLinkSuffix) {
      extraDataToPass.hasIntroLinkSuffix = stepConfig.hasIntroLinkSuffix
    }
    if (stepConfig?.inputType) {
      extraDataToPass.inputType = stepConfig.inputType
    }
    if (stepConfig?.displayValueKey) {
      extraDataToPass.displayValueKey = stepConfig.displayValueKey
    }

    // Info/guidance pages (CARBON_REQUIRED_INFORMATION, CARBON_PREPARE) link back
    // to the project overview. All subsequent input and display pages link back to
    // the preceding page in the wizard sequence.
    const isInfoPage = [
      PROJECT_STEPS.CARBON_REQUIRED_INFORMATION,
      PROJECT_STEPS.CARBON_PREPARE
    ].includes(step)

    const backLinkOptions = isInfoPage
      ? { conditionalRedirect: true }
      : { targetEditURL: getPreviousRouteForStep(step) }

    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions,
      additionalData: {
        step,
        carbonFields: getCarbonFields(),
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
      const infoStepConfig = STEP_TO_CONFIG[step]
      return h.view(infoStepConfig.view, this._buildViewData(request))
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
    const carbonCosts = extractCarbonCosts(sessionData)
    const displayData = buildInitialDisplayData(sessionData, carbonCosts)

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
        const enriched = mergeCalculatedValues(displayData, calcResult.data)
        Object.assign(displayData, enriched)
      } else {
        applyFallbackValues(displayData)
      }
    } catch (err) {
      logError(
        request,
        ['warn', 'carbon-impact'],
        `Carbon impact calc fetch failed: ${err.message}`
      )
      applyFallbackValues(displayData)
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
      logError(
        request,
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
  async _handleInputStep(request, h, step) {
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
      const inputResponse = await this._handleInputStep(request, h, step)
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
