import {
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

// Constant for reference number placeholder
const REFERENCE_NUMBER_PLACEHOLDER = '{referenceNumber}'

/**
 * Replace the reference number placeholder in a route
 * @param {string} route - Route with placeholder
 * @param {string} referenceNumber - Actual reference number
 * @returns {string} Route with reference number
 */
export function replaceReferenceNumber(route, referenceNumber) {
  return route.replace(REFERENCE_NUMBER_PLACEHOLDER, referenceNumber)
}

/**
 * Check if main risk selection page should be skipped
 * Skip if only one risk was selected (auto-select as main risk)
 * @param {Array} risks - Selected risks
 * @returns {boolean} True if should skip main risk page
 */
export function shouldSkipMainRisk(risks) {
  return risks?.length === 1
}

/**
 * Check if property affected flooding page should be skipped
 * Skip if coastal erosion is the ONLY risk (no flooding risks)
 * @param {string} mainRisk - Selected main risk
 * @param {Array} risks - Selected risks
 * @returns {boolean} True if should skip flooding properties page
 */
export function shouldSkipPropertyAffectedFlooding(mainRisk, risks) {
  return (
    mainRisk === PROJECT_RISK_TYPES.COASTAL_EROSION &&
    risks?.length === 1 &&
    risks[0] === PROJECT_RISK_TYPES.COASTAL_EROSION
  )
}

/**
 * Check if property affected coastal erosion page should be shown
 * Show if risks include coastal erosion
 * @param {Array} risks - Selected risks
 * @returns {boolean} True if should show coastal erosion properties page
 */
export function shouldShowPropertyAffectedCoastalErosion(risks) {
  return risks?.includes(PROJECT_RISK_TYPES.COASTAL_EROSION)
}

/**
 * Check if current flood risk page should be shown
 * Show if risks include fluvial, tidal, or sea flooding
 * @param {Array} risks - Selected risks
 * @returns {boolean} True if should show current flood risk page
 */
export function shouldShowCurrentFloodRisk(risks) {
  return (
    risks?.includes(PROJECT_RISK_TYPES.FLUVIAL) ||
    risks?.includes(PROJECT_RISK_TYPES.TIDAL) ||
    risks?.includes(PROJECT_RISK_TYPES.SEA)
  )
}

/**
 * Check if current surface water flood risk page should be shown
 * Show if risks include surface water flooding
 * @param {Array} risks - Selected risks
 * @returns {boolean} True if should show current surface water flood risk page
 */
export function shouldShowCurrentFloodSurfaceWaterRisk(risks) {
  return risks?.includes(PROJECT_RISK_TYPES.SURFACE_WATER)
}

/**
 * Check if current coastal erosion risk page should be shown
 * Show if risks include coastal erosion
 * @param {Array} risks - Selected risks
 * @returns {boolean} True if should show current coastal erosion risk page
 */
export function shouldShowCurrentCoastalErosionRisk(risks) {
  return risks?.includes(PROJECT_RISK_TYPES.COASTAL_EROSION)
}

/**
 * Get the back link for property affected flooding page
 * @param {Array} risks - Selected risks
 * @returns {object} Back link options
 */
export function getPropertyAffectedFloodingBackLink(risks) {
  if (shouldSkipMainRisk(risks)) {
    return {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.RISK,
      conditionalRedirect: false
    }
  }
  return {
    targetURL: ROUTES.PROJECT.OVERVIEW,
    targetEditURL: ROUTES.PROJECT.EDIT.MAIN_RISK,
    conditionalRedirect: false
  }
}

/**
 * Get the back link for property affected coastal erosion page
 * @param {Array} risks - Selected risks
 * @param {string} mainRisk - Selected main risk
 * @returns {object} Back link options
 */
export function getPropertyAffectedCoastalErosionBackLink(risks, mainRisk) {
  if (shouldSkipPropertyAffectedFlooding(mainRisk, risks)) {
    if (shouldSkipMainRisk(risks)) {
      return {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.EDIT.RISK,
        conditionalRedirect: false
      }
    }
    return {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.MAIN_RISK,
      conditionalRedirect: false
    }
  }
  return {
    targetURL: ROUTES.PROJECT.OVERVIEW,
    targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
    conditionalRedirect: false
  }
}

/**
 * Get the back link for twenty percent deprived page
 * @param {Array} risks - Selected risks
 * @returns {object} Back link options
 */
export function getTwentyPercentDeprivedBackLink(risks) {
  if (shouldShowPropertyAffectedCoastalErosion(risks)) {
    return {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
      conditionalRedirect: false
    }
  }
  return {
    targetURL: ROUTES.PROJECT.OVERVIEW,
    targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
    conditionalRedirect: false
  }
}

/**
 * Get the back link for current flood surface water risk page
 * @param {Array} risks - Selected risks
 * @returns {object} Back link options
 */
export function getCurrentFloodSurfaceWaterRiskBackLink(risks) {
  if (shouldShowCurrentFloodRisk(risks)) {
    return {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CURRENT_FLOOD_RISK,
      conditionalRedirect: false
    }
  }
  return {
    targetURL: ROUTES.PROJECT.OVERVIEW,
    targetEditURL: ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED,
    conditionalRedirect: false
  }
}

/**
 * Get the back link for current coastal erosion risk page
 * @param {Array} risks - Selected risks
 * @returns {object} Back link options
 */
export function getCurrentCoastalErosionRiskBackLink(risks) {
  if (shouldShowCurrentFloodSurfaceWaterRisk(risks)) {
    return {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK,
      conditionalRedirect: false
    }
  }
  if (shouldShowCurrentFloodRisk(risks)) {
    return {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CURRENT_FLOOD_RISK,
      conditionalRedirect: false
    }
  }
  return {
    targetURL: ROUTES.PROJECT.OVERVIEW,
    targetEditURL: ROUTES.PROJECT.EDIT.FORTY_PERCENT_DEPRIVED,
    conditionalRedirect: false
  }
}

/**
 * Get the next step after FORTY_PERCENT_DEPRIVED based on selected risks
 * @param {Array} risks - Selected risks
 * @param {string} referenceNumber - Project reference number
 * @returns {string} The next route URL
 */
export function getNextStepAfterFortyPercent(risks, referenceNumber) {
  if (shouldShowCurrentFloodRisk(risks)) {
    return replaceReferenceNumber(
      ROUTES.PROJECT.EDIT.CURRENT_FLOOD_RISK,
      referenceNumber
    )
  }

  if (shouldShowCurrentFloodSurfaceWaterRisk(risks)) {
    return replaceReferenceNumber(
      ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK,
      referenceNumber
    )
  }

  if (shouldShowCurrentCoastalErosionRisk(risks)) {
    return replaceReferenceNumber(
      ROUTES.PROJECT.EDIT.CURRENT_COASTAL_EROSION_RISK,
      referenceNumber
    )
  }

  return replaceReferenceNumber(ROUTES.PROJECT.OVERVIEW, referenceNumber)
}

/**
 * Get the next step after CURRENT_FLOOD_RISK based on selected risks
 * @param {Array} risks - Selected risks
 * @param {string} referenceNumber - Project reference number
 * @returns {string} The next route URL
 */
export function getNextStepAfterCurrentFloodRisk(risks, referenceNumber) {
  if (shouldShowCurrentFloodSurfaceWaterRisk(risks)) {
    return replaceReferenceNumber(
      ROUTES.PROJECT.EDIT.CURRENT_FLOOD_SURFACE_WATER_RISK,
      referenceNumber
    )
  }

  if (shouldShowCurrentCoastalErosionRisk(risks)) {
    return replaceReferenceNumber(
      ROUTES.PROJECT.EDIT.CURRENT_COASTAL_EROSION_RISK,
      referenceNumber
    )
  }

  return replaceReferenceNumber(ROUTES.PROJECT.OVERVIEW, referenceNumber)
}

/**
 * Get the next step after CURRENT_FLOOD_SURFACE_WATER_RISK based on selected risks
 * @param {Array} risks - Selected risks
 * @param {string} referenceNumber - Project reference number
 * @returns {string} The next route URL
 */
export function getNextStepAfterCurrentSurfaceWaterRisk(
  risks,
  referenceNumber
) {
  if (shouldShowCurrentCoastalErosionRisk(risks)) {
    return replaceReferenceNumber(
      ROUTES.PROJECT.EDIT.CURRENT_COASTAL_EROSION_RISK,
      referenceNumber
    )
  }

  return replaceReferenceNumber(ROUTES.PROJECT.OVERVIEW, referenceNumber)
}

/**
 * Get dynamic back link options for a step based on session data
 * @param {string} step - Current step
 * @param {object} sessionData - Session data
 * @returns {object|null} Back link options or null if not overridden
 */
export function getDynamicBackLink(step, sessionData) {
  const risks = sessionData.risks || []
  const mainRisk = sessionData.mainRisk

  switch (step) {
    case PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING:
      return getPropertyAffectedFloodingBackLink(risks)

    case PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION:
      return getPropertyAffectedCoastalErosionBackLink(risks, mainRisk)

    case PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED:
      return getTwentyPercentDeprivedBackLink(risks)

    case PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK:
      return getCurrentFloodSurfaceWaterRiskBackLink(risks)

    case PROJECT_STEPS.CURRENT_COASTAL_EROSION_RISK:
      return getCurrentCoastalErosionRiskBackLink(risks)

    default:
      return null
  }
}
