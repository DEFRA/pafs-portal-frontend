import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { submitProject } from '../../helpers/project-submission.js'
import { updateSessionData } from '../../helpers/project-utils.js'
import {
  replaceReferenceNumber,
  shouldSkipMainRisk,
  shouldSkipPropertyAffectedFlooding,
  shouldShowPropertyAffectedCoastalErosion,
  getNextStepAfterFortyPercent,
  getNextStepAfterCurrentFloodRisk,
  getNextStepAfterCurrentSurfaceWaterRisk
} from './navigation-helpers.js'

/**
 * Handle redirect after RISK step
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @param {object} sessionData - Session data
 * @param {string} referenceNumber - Project reference number
 * @returns {object} Redirect response
 */
export async function handleRiskStepRedirect(
  request,
  h,
  sessionData,
  referenceNumber
) {
  const risks = sessionData.risks || []

  if (shouldSkipMainRisk(risks)) {
    const mainRisk = risks[0]
    updateSessionData(request, { mainRisk })

    const result = await submitProject(
      request,
      PROJECT_PAYLOAD_LEVELS.MAIN_RISK
    )

    if (!result.success) {
      request.logger.error('Failed to save main risk', result.error)
    }

    if (shouldSkipPropertyAffectedFlooding(mainRisk, risks)) {
      if (shouldShowPropertyAffectedCoastalErosion(risks)) {
        return h
          .redirect(
            replaceReferenceNumber(
              ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
              referenceNumber
            )
          )
          .takeover()
      }

      return h
        .redirect(
          replaceReferenceNumber(
            ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
            referenceNumber
          )
        )
        .takeover()
    }

    return h
      .redirect(
        replaceReferenceNumber(
          ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
          referenceNumber
        )
      )
      .takeover()
  }

  return h
    .redirect(
      replaceReferenceNumber(ROUTES.PROJECT.EDIT.MAIN_RISK, referenceNumber)
    )
    .takeover()
}

/**
 * Handle redirect after MAIN_RISK step
 * @param {object} h - Hapi response toolkit
 * @param {object} sessionData - Session data
 * @param {string} referenceNumber - Project reference number
 * @returns {object} Redirect response
 */
export function handleMainRiskStepRedirect(h, sessionData, referenceNumber) {
  const mainRisk = sessionData.mainRisk
  const risks = sessionData.risks || []

  if (shouldSkipPropertyAffectedFlooding(mainRisk, risks)) {
    if (shouldShowPropertyAffectedCoastalErosion(risks)) {
      return h
        .redirect(
          replaceReferenceNumber(
            ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
            referenceNumber
          )
        )
        .takeover()
    }

    return h
      .redirect(
        replaceReferenceNumber(
          ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
          referenceNumber
        )
      )
      .takeover()
  }

  return h
    .redirect(
      replaceReferenceNumber(
        ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
        referenceNumber
      )
    )
    .takeover()
}

/**
 * Handle redirect after PROPERTY_AFFECTED_FLOODING step
 * @param {object} h - Hapi response toolkit
 * @param {object} sessionData - Session data
 * @param {string} referenceNumber - Project reference number
 * @returns {object} Redirect response
 */
export function handlePropertyAffectedFloodingRedirect(
  h,
  sessionData,
  referenceNumber
) {
  const risks = sessionData.risks || []

  if (shouldShowPropertyAffectedCoastalErosion(risks)) {
    return h
      .redirect(
        replaceReferenceNumber(
          ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
          referenceNumber
        )
      )
      .takeover()
  }

  return h
    .redirect(
      replaceReferenceNumber(
        ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
        referenceNumber
      )
    )
    .takeover()
}

/**
 * Handle conditional redirects based on step
 * @param {string} step - Current step
 * @param {object} request - Hapi request object
 * @param {object} h - Hapi response toolkit
 * @param {object} sessionData - Session data
 * @param {string} referenceNumber - Project reference number
 * @returns {Promise<object>|object|null} Redirect response or null if using static sequence
 */
export function handleConditionalRedirect(
  step,
  request,
  h,
  sessionData,
  referenceNumber
) {
  const risks = sessionData.risks || []

  switch (step) {
    case PROJECT_STEPS.RISK:
      // Only this case returns a Promise and needs to be awaited by caller
      return handleRiskStepRedirect(request, h, sessionData, referenceNumber)

    case PROJECT_STEPS.MAIN_RISK:
      return handleMainRiskStepRedirect(h, sessionData, referenceNumber)

    case PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING:
      return handlePropertyAffectedFloodingRedirect(
        h,
        sessionData,
        referenceNumber
      )

    case PROJECT_STEPS.FORTY_PERCENT_DEPRIVED:
      return h
        .redirect(getNextStepAfterFortyPercent(risks, referenceNumber))
        .takeover()

    case PROJECT_STEPS.CURRENT_FLOOD_RISK:
      return h
        .redirect(getNextStepAfterCurrentFloodRisk(risks, referenceNumber))
        .takeover()

    case PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK:
      return h
        .redirect(
          getNextStepAfterCurrentSurfaceWaterRisk(risks, referenceNumber)
        )
        .takeover()

    default:
      return null
  }
}
