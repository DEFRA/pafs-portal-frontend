import {
  PROJECT_STEPS,
  NFM_MEASURES
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  LAND_TYPE_ROUTE_MAP,
  STEP_TO_LAND_TYPE,
  LAND_USE_DETAIL_STEPS,
  getSelectedLandTypes,
  isMeasureSelected,
  NFM_LAND_TYPE_ORDER
} from './shared-navigation-helpers.js'

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
  ],
  [PROJECT_STEPS.NFM_LAND_USE_CHANGE]: [
    NFM_MEASURES.SAND_DUNE_MANAGEMENT,
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
 * Get the back-link for a land-use detail step.
 * Returns the previous selected land-use type page, or land-use-change if first.
 * @param {string} step - current land-use detail step
 * @param {Object} sessionData - project session data
 * @returns {Object} back-link options
 */
function getLandUseDetailBackLink(step, sessionData) {
  const currentLandType = STEP_TO_LAND_TYPE[step]
  const selectedLandTypes = getSelectedLandTypes(sessionData)

  // Walk backwards through the ordered list to find the previous selected type
  const currentIndex = NFM_LAND_TYPE_ORDER.indexOf(currentLandType)
  for (let i = currentIndex - 1; i >= 0; i--) {
    const landType = NFM_LAND_TYPE_ORDER[i]
    if (selectedLandTypes.includes(landType)) {
      return {
        targetEditURL: LAND_TYPE_ROUTE_MAP[landType],
        conditionalRedirect: false
      }
    }
  }

  // No previous selected land type - go back to land-use-change
  return {
    targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
    conditionalRedirect: false
  }
}

function getLandownerConsentBackLink(sessionData) {
  const selectedLandTypes = getSelectedLandTypes(sessionData)

  for (let i = NFM_LAND_TYPE_ORDER.length - 1; i >= 0; i--) {
    const landType = NFM_LAND_TYPE_ORDER[i]
    if (selectedLandTypes.includes(landType)) {
      return {
        targetEditURL: LAND_TYPE_ROUTE_MAP[landType],
        conditionalRedirect: false
      }
    }
  }

  return {
    targetEditURL: ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE,
    conditionalRedirect: false
  }
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
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]: null, // Conditional - next measure or overview
  [PROJECT_STEPS.NFM_LAND_USE_CHANGE]: null,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND]: null,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND]: null,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND]: null,
  [PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND]: null,
  [PROJECT_STEPS.NFM_LAND_USE_WOODLAND]: null,
  [PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH]: null,
  [PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION]: null,
  [PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER]: null,
  [PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS]: null,
  [PROJECT_STEPS.NFM_LANDOWNER_CONSENT]: ROUTES.PROJECT.EDIT.NFM.EXPERIENCE,
  [PROJECT_STEPS.NFM_EXPERIENCE]: ROUTES.PROJECT.EDIT.NFM.PROJECT_READINESS,
  [PROJECT_STEPS.NFM_PROJECT_READINESS]: null
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

  // Land-use detail steps need dynamic back-link based on previous selected type
  if (LAND_USE_DETAIL_STEPS.has(step)) {
    return getLandUseDetailBackLink(step, sessionData)
  }

  if (step === PROJECT_STEPS.NFM_LANDOWNER_CONSENT) {
    return getLandownerConsentBackLink(sessionData)
  }

  if (step === PROJECT_STEPS.NFM_EXPERIENCE) {
    return {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.LANDOWNER_CONSENT,
      conditionalRedirect: false
    }
  }

  if (step === PROJECT_STEPS.NFM_PROJECT_READINESS) {
    return {
      targetEditURL: ROUTES.PROJECT.EDIT.NFM.EXPERIENCE,
      conditionalRedirect: false
    }
  }

  if (!(step in STEP_PREVIOUS_MEASURES)) {
    return null
  }

  return getMeasureBackLink(sessionData, STEP_PREVIOUS_MEASURES[step])
}
