import {
  PROJECT_STEPS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'
import {
  getSessionData,
  navigateToProjectOverview
} from '../../helpers/project-utils.js'

/**
 * Map of NFM steps to their required measure values
 */
const STEP_TO_MEASURE_MAP = {
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]:
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION,
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: NFM_MEASURES.LEAKY_BARRIERS,
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: NFM_MEASURES.OFFLINE_STORAGE,
  [PROJECT_STEPS.NFM_WOODLAND]: NFM_MEASURES.WOODLAND,
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: NFM_MEASURES.HEADWATER_DRAINAGE,
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: NFM_MEASURES.RUNOFF_MANAGEMENT,
  [PROJECT_STEPS.NFM_SALTMARSH]: NFM_MEASURES.SALTMARSH_MANAGEMENT,
  [PROJECT_STEPS.NFM_SAND_DUNE]: NFM_MEASURES.SAND_DUNE_MANAGEMENT
}

/**
 * Get the current NFM step from the request path
 * @param {Object} request - Hapi request object
 * @returns {string|null} Current step or null
 */
function getCurrentStep(request) {
  const pathname = request.route.path
  const lastPart = pathname.split('/').pop()
  return lastPart
}

/**
 * Check if the current measure is selected in session
 * @param {Object} sessionData - Session data
 * @param {string} measureValue - Measure value to check
 * @returns {boolean} True if measure is selected
 */
function isMeasureSelected(sessionData, measureValue) {
  const measuresString =
    sessionData[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]
  if (!measuresString) {
    return false
  }
  const selectedMeasures = measuresString.split(',').map((m) => m.trim())
  return selectedMeasures.includes(measureValue)
}

/**
 * Pre-handler to ensure the current NFM measure is selected
 * Redirects to overview if measure is not selected
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} Response or continue
 */
export function requireSelectedMeasure(request, h) {
  const step = getCurrentStep(request)
  const requiredMeasure = STEP_TO_MEASURE_MAP[step]

  // If this step doesn't require a specific measure (e.g., NFM_SELECTED_MEASURES), allow access
  if (!requiredMeasure) {
    return h.continue
  }

  const sessionData = getSessionData(request)
  const referenceNumber = request.params?.referenceNumber

  // Check if the required measure is selected
  if (!isMeasureSelected(sessionData, requiredMeasure)) {
    // Measure not selected, redirect to overview
    return navigateToProjectOverview(referenceNumber, h)
  }

  // Measure is selected, allow access
  return h.continue
}
