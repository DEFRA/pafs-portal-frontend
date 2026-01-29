import { statusCodes } from '../../../common/constants/status-codes.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { createProjectProposal } from '../../../common/services/project-proposal/project-proposal-service.js'

/**
 * Render error view for proposal submission
 * @param {Object} _request - Hapi request object (unused)
 * @param {Object} h - Hapi response toolkit
 * @param {string} viewType - View type constant (PROPOSAL_VIEWS.*)
 * @param {Object} values - Form values
 * @param {string} errorHref - Error anchor href
 * @param {string} message - Error message
 * @returns {Object} Error response
 */
export function renderProposalError(
  _request,
  h,
  viewType,
  values,
  errorHref,
  message
) {
  return h
    .view(viewType, {
      ...buildViewModel(values, { lastFinancialYear: message }, [
        { text: message, href: errorHref }
      ]),
      values,
      errors: { lastFinancialYear: message },
      errorSummary: [{ text: message, href: errorHref }]
    })
    .code(statusCodes.badRequest)
}

/**
 * Build minimal view model with error info
 * @param {Object} values - Form values
 * @param {Object} errors - Form errors
 * @param {Array} errorSummary - Error summary
 * @returns {Object} View model
 */
function buildViewModel(values, errors, errorSummary) {
  return { values, errors, errorSummary }
}

/**
 * Get area id from session
 * @param {Object} sessionData - Session data containing rmaSelection
 * @returns {Object} Area details with numeric rmaId and raw selection
 */
export function getAreaDetailsForProposal(sessionData) {
  const rmaSelection = sessionData.rmaSelection
  const rmaId = rmaSelection ? Number(rmaSelection) : undefined

  return {
    rmaId,
    rmaSelection
  }
}

/**
 * Build proposal data for backend API submission
 * @param {Object} sessionData - Session data
 * @param {Object} values - Form values with lastFinancialYear
 * @param {number} rmaId - Area id of selected RMA
 * @returns {Object} Proposal data ready for API upsert
 */
export function buildProposalDataForSubmission(sessionData, values, rmaId) {
  // Convert financial years to numbers
  const financialStartYear = Number.parseInt(sessionData.firstFinancialYear, 10)
  const financialEndYear = Number.parseInt(values.lastFinancialYear, 10)

  const projectType = sessionData.projectType

  // Base payload without intervention types
  const payload = {
    name: sessionData.projectName,
    rmaId: String(rmaId),
    projectType,
    financialStartYear,
    financialEndYear
  }

  // Only include intervention types for DEF, REP, and REF project types
  if (projectType === 'DEF' || projectType === 'REP' || projectType === 'REF') {
    // Normalize intervention types to uppercase
    const interventionTypes = (sessionData.interventionTypes || []).map(
      (type) => String(type).toUpperCase()
    )

    payload.projectInterventionTypes = interventionTypes
    payload.mainInterventionType =
      String(sessionData.primaryInterventionType || '').toUpperCase() || null
  }

  return {
    level: 'INITIAL_SAVE',
    payload
  }
}

/**
 * Build project overview URL from reference number
 * @param {string} referenceNumber - Project reference number (e.g., 'abcd/efgh/ijklm')
 * @returns {string} Project overview URL with hyphens instead of slashes (e.g., 'abcd-efgh-ijklm')
 */
export function buildProjectOverviewUrlForProposal(referenceNumber) {
  const formattedReferenceNumber = referenceNumber.replaceAll('/', '-')
  return ROUTES.PROJECT_PROPOSAL.PROJECT_OVERVIEW.replace(
    '{referenceNumber}',
    formattedReferenceNumber
  )
}

/**
 * Submit proposal to backend API
 * @param {Object} request - Hapi request
 * @param {Object} proposalData - Proposal data to submit
 * @returns {Promise<Object>} API response
 */
export async function submitProposalToBackend(request, proposalData) {
  const authSession = request.yar.get('auth')
  const accessToken = authSession?.accessToken
  return createProjectProposal(proposalData, accessToken)
}

/**
 * Log proposal submission success
 * @param {Object} request - Hapi request
 * @param {Object} apiResponse - API response
 */
export function logProposalSuccess(request, apiResponse) {
  request.server.logger.info(
    {
      referenceNumber: apiResponse.data?.data?.referenceNumber,
      projectId: apiResponse.data?.data?.id
    },
    'Project proposal created successfully'
  )
}

/**
 * Log area details retrieval error
 * @param {Object} request - Hapi request
 * @param {string} rmaSelection - RMA selection ID
 */
export function logAreaDetailsError(request, rmaSelection) {
  request.server.logger.error(
    { areaId: rmaSelection },
    'Failed to determine RFCC code from selected area'
  )
}

/**
 * Log proposal submission error
 * @param {Object} request - Hapi request
 * @param {Object} apiResponse - API response
 */
export function logProposalError(request, apiResponse) {
  request.server.logger.error(
    { errors: apiResponse.errors, status: apiResponse.status },
    'Failed to create project proposal'
  )
}

/**
 * Clear proposal session data after successful submission
 * @param {Object} request - Hapi request
 */
export function clearProposalSession(request) {
  request.yar.set('projectProposal', {})
  request.server.logger.info(
    'Proposal session data cleared after successful submission'
  )
}
