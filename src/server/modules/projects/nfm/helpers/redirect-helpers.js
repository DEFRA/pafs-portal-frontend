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
  return measuresString.split(',')
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
  request,
  h,
  sessionData,
  referenceNumber
) {
  switch (step) {
    case PROJECT_STEPS.NFM_RIVER_RESTORATION:
      // After river restoration, check if leaky barriers is selected
      if (isMeasureSelected(sessionData, NFM_MEASURES.LEAKY_BARRIERS)) {
        return h
          .redirect(
            ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS.replace(
              '{referenceNumber}',
              referenceNumber
            )
          )
          .takeover()
      }
      // No more measure pages, go to overview
      return navigateToProjectOverview(referenceNumber, h)

    case PROJECT_STEPS.NFM_LEAKY_BARRIERS:
      // After leaky barriers, check for next measure
      // TODO: Add routing to offline storage or other measures when implemented
      // For now, go to overview
      return navigateToProjectOverview(referenceNumber, h)

    case PROJECT_STEPS.NFM_SELECTED_MEASURES:
      // No conditional redirects for this step - always goes to first measure
      return null

    default:
      return null
  }
}
