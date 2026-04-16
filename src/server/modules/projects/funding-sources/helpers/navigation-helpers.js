import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../../common/constants/projects.js'

import { ROUTES } from '../../../../common/constants/routes.js'
import { FUNDING_SOURCES_CONFIG } from '../../helpers/config/funding-sources.js'

// Map contributor step → its own edit route path.
// Defined here (not in the shared constants barrel) to avoid a circular
// dependency: routes.js → projects.js barrel → funding-sources.js → routes.js.
export const CONTRIBUTOR_STEP_ROUTE = {
  [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]:
    ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS,
  [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]:
    ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS,
  [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]:
    ROUTES.PROJECT.EDIT.FUNDING_SOURCES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
}

/**
 * Resolve the back link URL for steps that use a dynamic backLinkFn.
 * Falls back to the static backLinkOptions from config when no function is set.
 *
 * @param {string} step - The current project step identifier
 * @param {object} sessionData - Current session data
 * @returns {object} Back link options suitable for buildViewData
 */
export function resolveBackLinkOptions(step, sessionData) {
  const config = FUNDING_SOURCES_CONFIG[step]
  if (!config) return {}

  const { backLinkOptions } = config
  if (!backLinkOptions) return {}

  if (typeof backLinkOptions.backLinkFn === 'function') {
    const resolved = backLinkOptions.backLinkFn(sessionData)
    return {
      targetEditURL: resolved,
      conditionalRedirect: false
    }
  }

  return backLinkOptions
}

/**
 * Determine the next route after the main funding sources selection step.
 * Respects the order: additional GIA → public contributors → private contributors
 * → other EA contributors → estimated spend.
 *
 * @param {object} sessionData - Current session data
 * @param {string} referenceNumber - Project reference number
 * @returns {string} Resolved redirect URL
 */
export function nextRouteAfterSelection(sessionData, referenceNumber) {
  const replace = (route) =>
    route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
  const r = ROUTES.PROJECT.EDIT.FUNDING_SOURCES

  if (sessionData.additionalFcermGia) {
    return replace(r.ADDITIONAL_FUNDING_SOURCES_SELECTION)
  }
  if (sessionData[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]) {
    return replace(r.PUBLIC_SECTOR_CONTRIBUTORS)
  }
  if (sessionData[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]) {
    return replace(r.PRIVATE_SECTOR_CONTRIBUTORS)
  }
  if (sessionData[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]) {
    return replace(r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS)
  }
  return replace(r.ESTIMATED_SPEND)
}

/**
 * Determine the next route after the additional GIA sources step.
 * Respects the order: public contributors → private contributors
 * → other EA contributors → estimated spend.
 *
 * @param {object} sessionData - Current session data
 * @param {string} referenceNumber - Project reference number
 * @returns {string} Resolved redirect URL
 */
export function nextRouteAfterAdditional(sessionData, referenceNumber) {
  const replace = (route) =>
    route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
  const r = ROUTES.PROJECT.EDIT.FUNDING_SOURCES

  if (sessionData[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]) {
    return replace(r.PUBLIC_SECTOR_CONTRIBUTORS)
  }
  if (sessionData[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]) {
    return replace(r.PRIVATE_SECTOR_CONTRIBUTORS)
  }
  if (sessionData[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]) {
    return replace(r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS)
  }
  return replace(r.ESTIMATED_SPEND)
}

/**
 * Determine the next route after a contributor names step.
 * Public → (private → other EA →) estimated spend.
 * Private → (other EA →) estimated spend.
 * Other EA → estimated spend.
 *
 * @param {string} step - The current contributor step
 * @param {object} sessionData - Current session data
 * @param {string} referenceNumber - Project reference number
 * @returns {string} Resolved redirect URL
 */
export function nextRouteAfterContributors(step, sessionData, referenceNumber) {
  const replace = (route) =>
    route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
  const r = ROUTES.PROJECT.EDIT.FUNDING_SOURCES

  if (step === PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS) {
    if (sessionData[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]) {
      return replace(r.PRIVATE_SECTOR_CONTRIBUTORS)
    }
    if (sessionData[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]) {
      return replace(r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS)
    }
    return replace(r.ESTIMATED_SPEND)
  }

  if (step === PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS) {
    if (sessionData[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]) {
      return replace(r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS)
    }
    return replace(r.ESTIMATED_SPEND)
  }

  // OTHER_EA_CONTRIBUTORS always goes to ESTIMATED_SPEND
  return replace(r.ESTIMATED_SPEND)
}
