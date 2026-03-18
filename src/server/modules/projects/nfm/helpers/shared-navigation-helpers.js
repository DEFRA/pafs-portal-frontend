import {
  NFM_LAND_TYPES,
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'

/**
 * Ordered list of all NFM land-use types (determines navigation sequence)
 */
export const NFM_LAND_TYPE_ORDER = [
  NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND,
  NFM_LAND_TYPES.ENCLOSED_LIVESTOCK_FARMLAND,
  NFM_LAND_TYPES.ENCLOSED_DAIRYING_FARMLAND,
  NFM_LAND_TYPES.SEMI_NATURAL_GRASSLAND,
  NFM_LAND_TYPES.WOODLAND,
  NFM_LAND_TYPES.MOUNTAIN_MOORS_AND_HEATH,
  NFM_LAND_TYPES.PEATLAND_RESTORATION,
  NFM_LAND_TYPES.RIVERS_WETLANDS_FRESHWATER_HABITATS,
  NFM_LAND_TYPES.COASTAL_MARGINS
]

/**
 * Maps each land-use type value to its detail page route
 */
export const LAND_TYPE_ROUTE_MAP = {
  [NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_ARABLE_FARMLAND,
  [NFM_LAND_TYPES.ENCLOSED_LIVESTOCK_FARMLAND]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND,
  [NFM_LAND_TYPES.ENCLOSED_DAIRYING_FARMLAND]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_DAIRYING_FARMLAND,
  [NFM_LAND_TYPES.SEMI_NATURAL_GRASSLAND]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_SEMI_NATURAL_GRASSLAND,
  [NFM_LAND_TYPES.WOODLAND]: ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND,
  [NFM_LAND_TYPES.MOUNTAIN_MOORS_AND_HEATH]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_MOUNTAIN_MOORS_AND_HEATH,
  [NFM_LAND_TYPES.PEATLAND_RESTORATION]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_PEATLAND_RESTORATION,
  [NFM_LAND_TYPES.RIVERS_WETLANDS_FRESHWATER_HABITATS]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_RIVERS_WETLANDS_FRESHWATER,
  [NFM_LAND_TYPES.COASTAL_MARGINS]:
    ROUTES.PROJECT.EDIT.NFM.LAND_USE_COASTAL_MARGINS
}

/**
 * Maps each land-use detail step to its corresponding land-use type value
 */
export const STEP_TO_LAND_TYPE = {
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND]:
    NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND]:
    NFM_LAND_TYPES.ENCLOSED_LIVESTOCK_FARMLAND,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND]:
    NFM_LAND_TYPES.ENCLOSED_DAIRYING_FARMLAND,
  [PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND]:
    NFM_LAND_TYPES.SEMI_NATURAL_GRASSLAND,
  [PROJECT_STEPS.NFM_LAND_USE_WOODLAND]: NFM_LAND_TYPES.WOODLAND,
  [PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH]:
    NFM_LAND_TYPES.MOUNTAIN_MOORS_AND_HEATH,
  [PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION]:
    NFM_LAND_TYPES.PEATLAND_RESTORATION,
  [PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER]:
    NFM_LAND_TYPES.RIVERS_WETLANDS_FRESHWATER_HABITATS,
  [PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS]: NFM_LAND_TYPES.COASTAL_MARGINS
}

/** Set of all land-use detail step keys */
export const LAND_USE_DETAIL_STEPS = new Set(Object.keys(STEP_TO_LAND_TYPE))

/**
 * Get selected NFM measures from session
 * @param {Object} sessionData - Project session data
 * @returns {Array} Array of selected measure values
 */
export function getSelectedMeasures(sessionData) {
  if (!sessionData) {
    return []
  }

  const measuresString =
    sessionData[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]

  if (!measuresString) {
    return []
  }

  if (Array.isArray(measuresString)) {
    return measuresString
  }

  return measuresString
    .split(',')
    .map((m) => m.trim())
    .filter(Boolean)
}

/**
 * Get selected NFM land-use types from session
 * @param {Object} sessionData - Project session data
 * @returns {Array} Array of selected land-use type values
 */
export function getSelectedLandTypes(sessionData) {
  if (!sessionData) {
    return []
  }

  const landTypesString =
    sessionData[PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]

  if (!landTypesString) {
    return []
  }

  if (Array.isArray(landTypesString)) {
    return landTypesString
  }

  return landTypesString
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

/**
 * Check if a specific measure is selected
 * @param {Object} sessionData - Project session data
 * @param {string} measureValue - Measure value to check
 * @returns {boolean}
 */
export function isMeasureSelected(sessionData, measureValue) {
  const selectedMeasures = getSelectedMeasures(sessionData)
  return selectedMeasures.includes(measureValue)
}

/**
 * Find the next selected land-use type after the current one (or the first if null).
 * @param {string|null} currentLandType - current type value, or null for start
 * @param {Array} selectedLandTypes - all selected land-use type values
 * @returns {string|null} next land-use type value, or null if none remain
 */
export function getNextSelectedLandType(currentLandType, selectedLandTypes) {
  if (!selectedLandTypes || selectedLandTypes.length === 0) {
    return null
  }

  const startIndex =
    currentLandType === null
      ? 0
      : NFM_LAND_TYPE_ORDER.indexOf(currentLandType) + 1

  for (let i = startIndex; i < NFM_LAND_TYPE_ORDER.length; i++) {
    const landType = NFM_LAND_TYPE_ORDER[i]
    if (selectedLandTypes.includes(landType)) {
      return landType
    }
  }

  return null
}
