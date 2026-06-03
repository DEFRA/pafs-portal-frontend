import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_INTERVENTION_TYPES
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  getSessionData,
  navigateToProjectOverview
} from '../../helpers/project-utils.js'

/**
 * Determines if the project has SUDS-only intervention types (no NFM)
 * @param {Array} interventionTypes - Project intervention types
 * @returns {boolean} True if SUDS-only
 */
function isSudsOnly(interventionTypes) {
  if (!interventionTypes || interventionTypes.length === 0) {
    return false
  }
  return (
    (interventionTypes.includes(PROJECT_INTERVENTION_TYPES.SUDS) ||
      interventionTypes.includes('SUDS')) &&
    !interventionTypes.includes(PROJECT_INTERVENTION_TYPES.NFM) &&
    !interventionTypes.includes('NFM')
  )
}

/**
 * Pre-handler to ensure NFM inclusion has been confirmed before accessing
 * NFM pages beyond the inclusion page.
 *
 * For SUDS-only projects, the user must answer "yes" on the NFM inclusion page
 * before proceeding to selected measures and subsequent NFM pages.
 * If the project already has an NFM intervention type, this guard allows access.
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} Response or continue
 */
export function requireNfmInclusion(request, h) {
  const sessionData = getSessionData(request)
  const referenceNumber = request.params?.referenceNumber

  const interventionTypes =
    sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES] || []

  // If the project has a direct NFM intervention type, no inclusion gate needed
  if (!isSudsOnly(interventionTypes)) {
    return h.continue
  }

  // SUDS-only: require naturalFloodRiskMeasuresIncluded === true
  const included =
    sessionData[PROJECT_PAYLOAD_FIELDS.NATURAL_FLOOD_RISK_MEASURES_INCLUDED]

  if (included === true) {
    return h.continue
  }

  // Not yet confirmed — redirect to the inclusion page
  if (referenceNumber) {
    const inclusionUrl = ROUTES.PROJECT.EDIT.NFM.INCLUSION.replace(
      '{referenceNumber}',
      referenceNumber
    )
    return h.redirect(inclusionUrl).takeover()
  }

  return navigateToProjectOverview(referenceNumber, h)
}
