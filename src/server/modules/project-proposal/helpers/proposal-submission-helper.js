import { statusCodes } from '../../../common/constants/status-codes.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getRfccCodeFromArea, getAreaNameById } from './rfcc-helper.js'
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
 * Get area details (RFCC code and RMA name) from cache
 * @param {Object} request - Hapi request
 * @param {Object} sessionData - Session data containing rmaSelection
 * @returns {Promise<Object>} Area details with rfccCode, rmaName, rmaSelection
 */
export async function getAreaDetailsForProposal(request, sessionData) {
  const areasData = await request.getAreas()
  const rmaSelection = sessionData.rmaSelection?.rmaSelection

  return {
    rfccCode: getRfccCodeFromArea(rmaSelection, areasData),
    rmaName: getAreaNameById(rmaSelection, areasData),
    rmaSelection
  }
}

/**
 * Build proposal data for backend API submission
 * @param {Object} sessionData - Session data
 * @param {Object} values - Form values with lastFinancialYear
 * @param {string} rmaName - RMA name
 * @param {string} rfccCode - RFCC code
 * @returns {Object} Proposal data ready for API
 */
export function buildProposalDataForSubmission(
  sessionData,
  values,
  rmaName,
  rfccCode
) {
  return {
    name: sessionData.projectName?.projectName,
    projectType: sessionData.projectType?.projectType,
    projectIntervesionTypes:
      sessionData.interventionTypes?.interventionTypes || [],
    mainIntervensionType:
      sessionData.primaryInterventionType?.primaryInterventionType || null,
    projectStartFinancialYear:
      sessionData.firstFinancialYear?.firstFinancialYear,
    projectEndFinancialYear: values.lastFinancialYear,
    rmaName,
    rfccCode
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
      referenceNumber: apiResponse.data?.data?.reference_number,
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
