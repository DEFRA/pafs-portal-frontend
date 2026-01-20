import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  buildFinancialYearOptions,
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../helpers/financial-year.js'
import {
  getAreaDetailsForProposal,
  buildProposalDataForSubmission,
  buildProjectOverviewUrlForProposal,
  submitProposalToBackend,
  logProposalSuccess,
  logAreaDetailsError,
  logProposalError
} from '../helpers/proposal-submission-helper.js'

const LAST_FINANCIAL_YEAR_ERROR_HREF = '#last-financial-year'
const FINANCIAL_YEAR_RANGE = 6

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  const currentFinancialYearStart = getCurrentFinancialYearStartYear()
  const financialYearOptions = buildFinancialYearOptions(
    currentFinancialYearStart,
    FINANCIAL_YEAR_RANGE
  )

  const afterMarchYear = getAfterMarchYear(
    currentFinancialYearStart,
    FINANCIAL_YEAR_RANGE
  )

  return {
    title: request.t('project-proposal.last_financial_year.heading'),
    hint: request.t('project-proposal.last_financial_year.hint'),
    values,
    errors,
    errorSummary,
    backLink: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR,
    financialYearOptions,
    afterMarchLinkText: request.t(
      'project-proposal.last_financial_year.after_march_link',
      {
        afterMarchYear
      }
    ),
    afterMarchLinkHref: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR_MANUAL
  }
}

function validateLastFinancialYear(request, sessionData) {
  const lastFinancialYear = request.payload?.lastFinancialYear

  if (!lastFinancialYear) {
    const msg = request.t(
      'project-proposal.last_financial_year.errors.required'
    )
    return {
      values: { lastFinancialYear },
      errors: { lastFinancialYear: msg },
      errorSummary: [{ text: msg, href: LAST_FINANCIAL_YEAR_ERROR_HREF }],
      isValid: false
    }
  }

  // Validate that last financial year is not before first financial year
  const firstFinancialYear = sessionData?.firstFinancialYear?.firstFinancialYear
  if (
    firstFinancialYear &&
    Number.parseInt(lastFinancialYear) < Number.parseInt(firstFinancialYear)
  ) {
    const msg = request.t(
      'project-proposal.last_financial_year.errors.before_first_year'
    )
    return {
      values: { lastFinancialYear },
      errors: { lastFinancialYear: msg },
      errorSummary: [{ text: msg, href: LAST_FINANCIAL_YEAR_ERROR_HREF }],
      isValid: false
    }
  }

  return {
    values: { lastFinancialYear },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

async function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.lastFinancialYear = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { lastFinancialYear: values.lastFinancialYear },
    'Last financial year selected and stored in session'
  )

  const { rfccCode, rmaName, rmaSelection } = await getAreaDetailsForProposal(
    request,
    sessionData
  )

  if (!rfccCode) {
    logAreaDetailsError(request, rmaSelection)
    const msg = request.t(
      'project-proposal.last_financial_year.errors.api_error'
    )
    return renderError(request, h, values, msg)
  }

  const proposalData = buildProposalDataForSubmission(
    sessionData,
    values,
    rmaName,
    rfccCode
  )
  const apiResponse = await submitProposalToBackend(request, proposalData)

  if (!apiResponse.success) {
    logProposalError(request, apiResponse)
    const msg = request.t(
      'project-proposal.last_financial_year.errors.api_error'
    )
    return renderError(request, h, values, msg)
  }

  logProposalSuccess(request, apiResponse)
  request.yar.set('projectProposal', {})

  const projectOverviewUrl = buildProjectOverviewUrlForProposal(
    apiResponse.data?.data?.reference_number
  )
  return h.redirect(projectOverviewUrl)
}

function renderError(request, h, values, message) {
  return h
    .view(
      PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR,
      buildViewModel(request, values, { lastFinancialYear: message }, [
        { text: message, href: LAST_FINANCIAL_YEAR_ERROR_HREF }
      ])
    )
    .code(statusCodes.badRequest)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.lastFinancialYear ?? {}

  return h.view(
    PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR,
    buildViewModel(request, values)
  )
}

async function handlePost(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const { values, errors, errorSummary, isValid } = validateLastFinancialYear(
    request,
    sessionData
  )

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR,
        buildViewModel(request, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values)
}

export const lastFinancialYearController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
