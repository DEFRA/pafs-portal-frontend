import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectProposalOverview } from '../../../common/services/project-proposal/project-proposal-service.js'
import { convertYearToFinancialYearLabel } from '../helpers/financial-year-helper.js'

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
    referenceNumber: data.referenceNumber,
    editModeReferenceNumber: data.referenceNumber.replaceAll('/', '-'),
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
function handlePostSuccess(_request, h, _values) {
  return h.redirect(ROUTES.PROJECT_PROPOSAL.START_PROPOSAL)
}

async function handlePost(request, h) {
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
