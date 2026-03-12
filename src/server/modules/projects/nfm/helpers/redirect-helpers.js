import {
  NFM_LAND_TYPES,
  PROJECT_STEPS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { navigateToProjectOverview } from '../../helpers/project-utils.js'

const REFERENCE_NUMBER_PLACEHOLDER = '{referenceNumber}'

/**
 * Ordered list of all NFM land-use types (determines navigation sequence)
 */
const NFM_LAND_TYPE_ORDER = [
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
const LAND_TYPE_ROUTE_MAP = {
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
const STEP_TO_LAND_TYPE = {
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
const LAND_USE_DETAIL_STEPS = new Set(Object.keys(STEP_TO_LAND_TYPE))

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
 * Get selected NFM land-use types from session
 * @param {Object} sessionData - Project session data
 * @returns {Array} Array of selected land-use type values
 */
function getSelectedLandTypes(sessionData) {
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

const STEPS_REDIRECTING_TO_LAND_USE = new Set([
  PROJECT_STEPS.NFM_SELECTED_MEASURES,
  PROJECT_STEPS.NFM_RIVER_RESTORATION,
  PROJECT_STEPS.NFM_LEAKY_BARRIERS,
  PROJECT_STEPS.NFM_OFFLINE_STORAGE,
  PROJECT_STEPS.NFM_WOODLAND,
  PROJECT_STEPS.NFM_HEADWATER_DRAINAGE,
  PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT,
  PROJECT_STEPS.NFM_SALTMARSH,
  PROJECT_STEPS.NFM_SAND_DUNE
])

function redirectToMeasure(h, referenceNumber, measure) {
  const route = MEASURE_ROUTES[measure]
  if (!route) {
    return null
  }

  return h
    .redirect(route.replace(REFERENCE_NUMBER_PLACEHOLDER, referenceNumber))
    .takeover()
}

/**
 * Find the next selected land-use type after the current one (or the first if null).
 * @param {string|null} currentLandType - current type value, or null for start
 * @param {Array} selectedLandTypes - all selected land-use type values
 * @returns {string|null} next land-use type value, or null if none remain
 */
function getNextSelectedLandType(currentLandType, selectedLandTypes) {
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

function redirectToLandType(h, referenceNumber, landType) {
  const route = LAND_TYPE_ROUTE_MAP[landType]
  return h
    .redirect(route.replace(REFERENCE_NUMBER_PLACEHOLDER, referenceNumber))
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
  // Handle NFM measure steps (standard measure navigation)
  if (step in STEP_NEXT_MEASURES) {
    const nextMeasures = STEP_NEXT_MEASURES[step]
    for (const measure of nextMeasures) {
      if (isMeasureSelected(sessionData, measure)) {
        return redirectToMeasure(h, referenceNumber, measure)
      }
    }

    if (STEPS_REDIRECTING_TO_LAND_USE.has(step)) {
      return h
        .redirect(
          ROUTES.PROJECT.EDIT.NFM.LAND_USE_CHANGE.replace(
            REFERENCE_NUMBER_PLACEHOLDER,
            referenceNumber
          )
        )
        .takeover()
    }

    return null
  }

  // After land-use-change selection: navigate to first selected land type
  if (step === PROJECT_STEPS.NFM_LAND_USE_CHANGE) {
    const selectedLandTypes = getSelectedLandTypes(sessionData)
    const firstLandType = getNextSelectedLandType(null, selectedLandTypes)

    if (firstLandType) {
      return redirectToLandType(h, referenceNumber, firstLandType)
    }

    return navigateToProjectOverview(referenceNumber, h)
  }

  // After a land-use detail step: navigate to the next selected land type
  if (LAND_USE_DETAIL_STEPS.has(step)) {
    const currentLandType = STEP_TO_LAND_TYPE[step]
    const selectedLandTypes = getSelectedLandTypes(sessionData)
    const nextLandType = getNextSelectedLandType(
      currentLandType,
      selectedLandTypes
    )

    if (nextLandType) {
      return redirectToLandType(h, referenceNumber, nextLandType)
    }

    return navigateToProjectOverview(referenceNumber, h)
  }

  return null
}
