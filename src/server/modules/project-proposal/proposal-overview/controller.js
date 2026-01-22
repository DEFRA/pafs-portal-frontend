// import { statusCodes } from '../../../common/constants/status-codes.js'
// import { last } from 'lodash'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectProposalOverview } from '../../../common/services/project-proposal/project-proposal-service.js'
import { convertYearToFinancialYearLabel } from '../common/financial-year-helper.js'

// const PROPOSAL_DETAILS_ERROR_HREF = '#proposal-details'
// const LOCATION_ERROR_HREF = '#location'
// const IMPORTANT_DATES_ERROR_HREF = '#important-dates'
// const FUNDING_ERROR_HREF = '#funding'
// const RISKS_AND_PROPERTIES_ERROR_HREF = '#risks-and-properties'
// const APPROACH_ERROR_HREF = '#approach'
// const ENVIRONMENTAL_BENEFITS_ERROR_HREF = '#environmental-benefits'
// const URGENCY_ERROR_HREF = '#urgency'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  return {
    title: request.t('project-proposal.proposal_overview.heading'),
    values,
    errors,
    errorSummary
  }
}

/**
 * Show Proposal Overview page
 */
async function handleGet(request, h) {
  // Get session to retrieve access token
  const session = getAuthSession(request)
  const accessToken = session?.accessToken

  const proposalData = await getProjectProposalOverview(
    request.params.referenceNumber,
    accessToken
  )
  const data = proposalData.data

  const values = {
    id: data.id,
    referenceNumber: data.referenceNumber,
    projectName: data.projectName,
    rmaSelection: data.rmaArea,
    projectType: data.projectType,
    interventionTypes: data.interventionTypes,
    primaryInterventionType: data.mainInterventionType,
    firstFinancialYear: data.startYear,
    financialStartYearLabel: convertYearToFinancialYearLabel(data.startYear),
    lastFinancialYear: data.endYear,
    financialEndYearLabel: convertYearToFinancialYearLabel(data.endYear),
    lastUpdated: data.lastUpdated
  }

  request.yar.set('projectProposal', values)

  // // REMOVE AFTER TESTING
  // console.log('***Proposal Data***')
  // console.log(request.yar.get('projectProposal'))
  // console.log('***Proposal Data***')

  return h.view(
    PROPOSAL_VIEWS.PROPOSAL_OVERVIEW,
    buildViewModel(request, values, undefined, undefined)
  )
}

/**
 * Submit Project Proposal redirect to next step
 */
function handlePostSuccess(request, h, values) {
  // const sessionData = request.yar.get('projectProposal') ?? {}
  // sessionData.rmaSelection = values
  // request.yar.set('projectProposal', sessionData)

  // request.server.logger.info(
  //   { rmaSelection: values.rmaSelection },
  //   'RMA selection validated and stored in session'
  // )

  // Redirect to next step (project-type)
  return h.redirect(ROUTES.PROJECT_PROPOSAL.START_PROPOSAL)
}

async function handlePost(request, h) {
  // const rmaAreas = await rmaDropDownOptions(request)
  // const { values, errors, errorSummary, isValid } =
  //   validateRmaSelection(request)

  // // If basic validation fails, show errors immediately
  // if (!isValid) {
  //   return h
  //     .view(
  //       PROPOSAL_VIEWS.RMA_SELECTION,
  //       buildViewModel(request, values, errors, errorSummary, rmaAreas)
  //     )
  //     .code(statusCodes.badRequest)
  // }

  // No errors found, save to session and redirect
  return handlePostSuccess(request, h, {})
}

export const proposalOverviewController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
