import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  buildFinancialYearOptions,
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../common/financial-year.js'

const LAST_FINANCIAL_YEAR_ERROR_HREF = '#last-financial-year'

function buildViewModel(
  request,
  sessionData,
  values = {},
  errors = {},
  errorSummary = []
) {
  const currentFinancialYearStart = getCurrentFinancialYearStartYear()
  const financialYearOptions = buildFinancialYearOptions(
    currentFinancialYearStart,
    6
  )

  const afterMarchYear = getAfterMarchYear(currentFinancialYearStart, 6)

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

function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.lastFinancialYear = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { lastFinancialYear: values.lastFinancialYear },
    'Last financial year selected and stored in session'
  )

  return h.redirect(ROUTES.GENERAL.HOME)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.lastFinancialYear ?? {}

  return h.view(
    PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR,
    buildViewModel(request, sessionData, values)
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
        buildViewModel(request, sessionData, values, errors, errorSummary)
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
