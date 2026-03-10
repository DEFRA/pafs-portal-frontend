import {
  PROJECT_STEPS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { navigateToProjectOverview } from '../../helpers/project-utils.js'

/**
 * Get selected NFM measures from session
 * @param {Object} sessionData - Project session data
 * @returns {Array} Array of selected measure values
 */
function getSelectedMeasures(sessionData) {
  const measuresString =
    sessionData[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]
  if (!measuresString) {
    return []
  }
  // Handle both string and array formats
  if (Array.isArray(measuresString)) {
    return measuresString
  }
  return measuresString
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
}

/**
 * Check if a specific measure is selected
 * @param {Object} sessionData - Project session data
 * @param {string} measureValue - Measure value to check
 * @returns {boolean}
 */
function isMeasureSelected(sessionData, measureValue) {
  const selectedMeasures = getSelectedMeasures(sessionData)
  return selectedMeasures.includes(measureValue)
}

const MEASURE_ROUTES = {
  [NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION]:
    ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
  [NFM_MEASURES.LEAKY_BARRIERS]: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
  [NFM_MEASURES.OFFLINE_STORAGE]: ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
  [NFM_MEASURES.WOODLAND]: ROUTES.PROJECT.EDIT.NFM.WOODLAND,
  [NFM_MEASURES.HEADWATER_DRAINAGE]: ROUTES.PROJECT.EDIT.NFM.HEADWATER_DRAINAGE,
  [NFM_MEASURES.RUNOFF_MANAGEMENT]: ROUTES.PROJECT.EDIT.NFM.RUNOFF_MANAGEMENT,
  [NFM_MEASURES.SALTMARSH_MANAGEMENT]: ROUTES.PROJECT.EDIT.NFM.SALTMARSH,
  [NFM_MEASURES.SAND_DUNE_MANAGEMENT]: ROUTES.PROJECT.EDIT.NFM.SAND_DUNE
}

const STEP_NEXT_MEASURES = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]: [
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION,
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.SALTMARSH_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]: [
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.SALTMARSH_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: [
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.SALTMARSH_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: [
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.SALTMARSH_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_WOODLAND]: [
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.SALTMARSH_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: [
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.SALTMARSH_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: [
    NFM_MEASURES.SALTMARSH_MANAGEMENT,
    NFM_MEASURES.SAND_DUNE_MANAGEMENT
  ],
  [PROJECT_STEPS.NFM_SALTMARSH]: [NFM_MEASURES.SAND_DUNE_MANAGEMENT],
  [PROJECT_STEPS.NFM_SAND_DUNE]: []
}

function redirectToMeasure(h, referenceNumber, measure) {
  const route = MEASURE_ROUTES[measure]
  if (!route) {
    return null
  }

  return h
    .redirect(route.replace('{referenceNumber}', referenceNumber))
    .takeover()
}

/**
 * Handle conditional redirects for NFM steps
 * Routes to the next selected measure's page, or to overview if all done
 * @param {string} step - Current project step
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @param {Object} sessionData - Project session data
 * @param {string} referenceNumber - Project reference number
 * @returns {Promise<Object|null>} Redirect response or null
 */
export async function handleConditionalRedirect(
  step,
  _request,
  h,
  sessionData,
  referenceNumber
) {
  if (!(step in STEP_NEXT_MEASURES)) {
    return null
  }

  const nextMeasures = STEP_NEXT_MEASURES[step]
  for (const measure of nextMeasures) {
    if (isMeasureSelected(sessionData, measure)) {
      return redirectToMeasure(h, referenceNumber, measure)
    }
  }

  return navigateToProjectOverview(referenceNumber, h)
}
