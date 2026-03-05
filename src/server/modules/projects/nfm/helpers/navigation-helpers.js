import {
  PROJECT_STEPS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

/**
 * Get selected NFM measures from session
 * @param {Object} sessionData - Project session data
 * @returns {Array} Array of selected measure values
 */
function getSelectedMeasures(sessionData) {
  if (!sessionData) {
    return []
  }
  const measuresString =
    sessionData[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]
  if (!measuresString) {
    return []
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

/**
 * Step sequence for NFM section
 * Maps each step to the next step's route
 * Use null for steps that require conditional navigation (handled by redirect-helpers)
 */
export const NFM_STEP_SEQUENCE = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]:
    ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION, // Always goes to river restoration first
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_WOODLAND]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: null // Conditional - next measure or overview
  // Add more steps here as they are implemented
}

/**
 * Get dynamic back link for NFM steps
 * Returns the previous selected measure's page, or selected measures page if first
 * @param {string} step - Current project step
 * @param {Object} sessionData - Project session data
 * @returns {Object|null} Back link options or null
 */
export function getDynamicBackLink(step, sessionData) {
  // NFM_SELECTED_MEASURES always goes back to overview
  if (step === PROJECT_STEPS.NFM_SELECTED_MEASURES) {
    return null
  }

  // For measure pages, find the previous selected measure
  switch (step) {
    case PROJECT_STEPS.NFM_RIVER_RESTORATION:
      // Always go back to selected measures page
      return {
        targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
        conditionalRedirect: false
      }

    case PROJECT_STEPS.NFM_LEAKY_BARRIERS:
      // Go back to river restoration if selected, otherwise selected measures
      if (
        isMeasureSelected(
          sessionData,
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
        )
      ) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
          conditionalRedirect: false
        }
      }
      return {
        targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
        conditionalRedirect: false
      }

    case PROJECT_STEPS.NFM_OFFLINE_STORAGE:
      // Go back to leaky barriers if selected, else river restoration if selected, else selected measures
      if (isMeasureSelected(sessionData, NFM_MEASURES.LEAKY_BARRIERS)) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
          conditionalRedirect: false
        }
      }
      if (
        isMeasureSelected(
          sessionData,
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
        )
      ) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
          conditionalRedirect: false
        }
      }
      return {
        targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
        conditionalRedirect: false
      }

    case PROJECT_STEPS.NFM_WOODLAND:
      // Go back to offline storage if selected, else leaky barriers if selected, else river restoration if selected, else selected measures
      if (isMeasureSelected(sessionData, NFM_MEASURES.OFFLINE_STORAGE)) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
          conditionalRedirect: false
        }
      }
      if (isMeasureSelected(sessionData, NFM_MEASURES.LEAKY_BARRIERS)) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
          conditionalRedirect: false
        }
      }
      if (
        isMeasureSelected(
          sessionData,
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
        )
      ) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
          conditionalRedirect: false
        }
      }
      return {
        targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
        conditionalRedirect: false
      }

    case PROJECT_STEPS.NFM_HEADWATER_DRAINAGE:
      // Go back to woodland if selected, else offline storage if selected, else leaky barriers if selected, else river restoration if selected, else selected measures
      if (isMeasureSelected(sessionData, NFM_MEASURES.WOODLAND)) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.WOODLAND,
          conditionalRedirect: false
        }
      }
      if (isMeasureSelected(sessionData, NFM_MEASURES.OFFLINE_STORAGE)) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.OFFLINE_STORAGE,
          conditionalRedirect: false
        }
      }
      if (isMeasureSelected(sessionData, NFM_MEASURES.LEAKY_BARRIERS)) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.LEAKY_BARRIERS,
          conditionalRedirect: false
        }
      }
      if (
        isMeasureSelected(
          sessionData,
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
        )
      ) {
        return {
          targetEditURL: ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION,
          conditionalRedirect: false
        }
      }
      return {
        targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
        conditionalRedirect: false
      }

    default:
      return null
  }
}
