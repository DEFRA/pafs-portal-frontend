import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../common/financial-year.js'

const FIRST_FINANCIAL_YEAR_MANUAL_ERROR_HREF = '#first-financial-year'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  const currentFinancialYearStart = getCurrentFinancialYearStartYear()
  const afterMarchYear = getAfterMarchYear(currentFinancialYearStart, 6)

  return {
    title: request.t('project-proposal.first_financial_year_manual.heading'),
    label: request.t('project-proposal.first_financial_year_manual.label'),
    values,
    errors,
    errorSummary,
    backLink: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR,
    hint: request.t('project-proposal.first_financial_year_manual.hint'),
    afterMarchYear
  }
}

function validateEnteredYear(request) {
  const yearRaw = request.payload?.firstFinancialYear

  if (!yearRaw || String(yearRaw).trim() === '') {
    const msg = request.t(
      'project-proposal.first_financial_year_manual.errors.required'
    )
    return {
      values: { firstFinancialYear: yearRaw },
      errors: { firstFinancialYear: msg },
      errorSummary: [
        { text: msg, href: FIRST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
      ],
      isValid: false
    }
  }

  const yearString = String(yearRaw).trim()

  if (!/^\d{4}$/.test(yearString)) {
    const msg = request.t(
      'project-proposal.first_financial_year_manual.errors.invalid_format'
    )
    return {
      values: { firstFinancialYear: yearString },
      errors: { firstFinancialYear: msg },
      errorSummary: [
        { text: msg, href: FIRST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
      ],
      isValid: false
    }
  }
  return {
    values: { firstFinancialYear: yearString },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.firstFinancialYear = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { firstFinancialYear: values.firstFinancialYear },
    'First financial year stored in session (manual entry)'
  )

  return h.redirect(ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.firstFinancialYear ?? {}

  return h.view(
    PROPOSAL_VIEWS.FIRST_FINANCIAL_YEAR_MANUAL,
    buildViewModel(request, values)
  )
}

async function handlePost(request, h) {
  const { values, errors, errorSummary, isValid } = validateEnteredYear(request)

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.FIRST_FINANCIAL_YEAR_MANUAL,
        buildViewModel(request, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values)
}

export const firstFinancialYearManualController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
