import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../common/financial-year.js'
import {
  getAreaDetailsForProposal,
  buildProposalDataForSubmission,
  buildProjectOverviewUrlForProposal,
  submitProposalToBackend,
  logProposalSuccess,
  logAreaDetailsError,
  logProposalError
} from '../common/proposal-submission-helper.js'

const LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF = '#last-financial-year'
const FINANCIAL_YEAR_RANGE = 6

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  const currentFinancialYearStart = getCurrentFinancialYearStartYear()
  const afterMarchYear = getAfterMarchYear(
    currentFinancialYearStart,
    FINANCIAL_YEAR_RANGE
  )

  return {
    title: request.t('project-proposal.last_financial_year_manual.heading'),
    label: request.t('project-proposal.last_financial_year_manual.label'),
    values,
    errors,
    errorSummary,
    backLink: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR,
    hint: request.t('project-proposal.last_financial_year_manual.hint'),
    afterMarchYear
  }
}

function validateEnteredYear(request, sessionData) {
  const yearRaw = request.payload?.lastFinancialYear

  if (!yearRaw || String(yearRaw).trim() === '') {
    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.required'
    )
    return {
      values: { lastFinancialYear: yearRaw },
      errors: { lastFinancialYear: msg },
      errorSummary: [
        { text: msg, href: LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
      ],
      isValid: false
    }
  }

  const yearString = String(yearRaw).trim()

  if (!/^\d{4}$/.test(yearString)) {
    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.invalid_format'
    )
    return {
      values: { lastFinancialYear: yearString },
      errors: { lastFinancialYear: msg },
      errorSummary: [
        { text: msg, href: LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
      ],
      isValid: false
    }
  }

  // Validate that last financial year is not before first financial year
  const firstFinancialYear = sessionData?.firstFinancialYear?.firstFinancialYear
  if (yearRaw < Number.parseInt(firstFinancialYear)) {
    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.before_first_year'
    )
    return {
      values: { lastFinancialYear: yearString },
      errors: { lastFinancialYear: msg },
      errorSummary: [
        { text: msg, href: LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
      ],
      isValid: false
    }
  }

  return {
    values: { lastFinancialYear: yearString },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

function renderManualError(request, h, values, message) {
  return h
    .view(
      PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR_MANUAL,
      buildViewModel(request, values, { lastFinancialYear: message }, [
        { text: message, href: LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
      ])
    )
    .code(statusCodes.badRequest)
}

async function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.lastFinancialYear = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { lastFinancialYear: values.lastFinancialYear },
    'Last financial year stored in session (manual entry)'
  )

  const { rfccCode, rmaName, rmaSelection } = await getAreaDetailsForProposal(
    request,
    sessionData
  )

  if (!rfccCode) {
    logAreaDetailsError(request, rmaSelection)
    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.api_error'
    )
    return renderManualError(request, h, values, msg)
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
      'project-proposal.last_financial_year_manual.errors.api_error'
    )
    return renderManualError(request, h, values, msg)
  }

  logProposalSuccess(request, apiResponse)
  request.yar.set('projectProposal', {})

  const projectOverviewUrl = buildProjectOverviewUrlForProposal(
    apiResponse.data?.data?.reference_number
  )
  return h.redirect(projectOverviewUrl)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.lastFinancialYear ?? {}

  return h.view(
    PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR_MANUAL,
    buildViewModel(request, values)
  )
}

async function handlePost(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const { values, errors, errorSummary, isValid } = validateEnteredYear(
    request,
    sessionData
  )

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR_MANUAL,
        buildViewModel(request, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values)
}

export const lastFinancialYearManualController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
