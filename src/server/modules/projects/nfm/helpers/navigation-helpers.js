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

const MEASURE_TO_ROUTE = {
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

const STEP_PREVIOUS_MEASURES = {
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]: [],
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: [
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ],
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: [
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ],
  [PROJECT_STEPS.NFM_WOODLAND]: [
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ],
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: [
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ],
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: [
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ],
  [PROJECT_STEPS.NFM_SALTMARSH]: [
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ],
  [PROJECT_STEPS.NFM_SAND_DUNE]: [
    NFM_MEASURES.SALTMARSH_MANAGEMENT,
    NFM_MEASURES.RUNOFF_MANAGEMENT,
    NFM_MEASURES.HEADWATER_DRAINAGE,
    NFM_MEASURES.WOODLAND,
    NFM_MEASURES.OFFLINE_STORAGE,
    NFM_MEASURES.LEAKY_BARRIERS,
    NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
  ]
}

function selectedMeasuresBackLink() {
  return {
    targetEditURL: ROUTES.PROJECT.EDIT.NFM.SELECTED_MEASURES,
    conditionalRedirect: false
  }
}

function getMeasureBackLink(sessionData, previousMeasures) {
  for (const measure of previousMeasures) {
    if (isMeasureSelected(sessionData, measure)) {
      return {
        targetEditURL: MEASURE_TO_ROUTE[measure],
        conditionalRedirect: false
      }
    }
  }

  return selectedMeasuresBackLink()
}

/**
 * Step sequence for NFM section
 * Maps each step to the next step's route
 * Use null for steps that require conditional navigation (handled by redirect-helpers)
 */
export const NFM_STEP_SEQUENCE = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]:
    ROUTES.PROJECT.EDIT.NFM.RIVER_RESTORATION, // Default next route (conditional redirect takes priority)
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_WOODLAND]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: null // Conditional - next measure or overview
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

  if (!(step in STEP_PREVIOUS_MEASURES)) {
    return null
  }

  return getMeasureBackLink(sessionData, STEP_PREVIOUS_MEASURES[step])
}
