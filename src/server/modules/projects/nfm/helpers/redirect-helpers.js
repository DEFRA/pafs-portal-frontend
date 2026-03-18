import {
  PROJECT_STEPS,
  NFM_MEASURES
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { navigateToProjectOverview } from '../../helpers/project-utils.js'
import {
  LAND_TYPE_ROUTE_MAP,
  STEP_TO_LAND_TYPE,
  LAND_USE_DETAIL_STEPS,
  getSelectedLandTypes,
  isMeasureSelected,
  getNextSelectedLandType
} from './shared-navigation-helpers.js'

const REFERENCE_NUMBER_PLACEHOLDER = '{referenceNumber}'

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

    return h
      .redirect(
        ROUTES.PROJECT.EDIT.NFM.LANDOWNER_CONSENT.replace(
          REFERENCE_NUMBER_PLACEHOLDER,
          referenceNumber
        )
      )
      .takeover()
  }

  return null
}
