import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  buildFinancialYearOptions,
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../common/financial-year.js'

const FIRST_FINANCIAL_YEAR_ERROR_HREF = '#first-financial-year'
const FINANCIAL_YEARS_TO_DISPLAY = 6

function getBackLink(sessionData) {
  const projectType = sessionData?.projectType?.projectType
  const selected = sessionData?.interventionTypes?.interventionTypes

  let interventions = []
  if (Array.isArray(selected)) {
    interventions = selected
  } else if (selected) {
    interventions = [selected]
  } else {
    interventions = []
  }

  if (interventions.length > 1) {
    return ROUTES.PROJECT_PROPOSAL.PRIMARY_INTERVENTION_TYPE
  }

  if (['DEF', 'REP', 'REF'].includes(projectType)) {
    return ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE
  }

  return ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE
}

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
    FINANCIAL_YEARS_TO_DISPLAY
  )

  const afterMarchYear = getAfterMarchYear(
    currentFinancialYearStart,
    FINANCIAL_YEARS_TO_DISPLAY
  )

  return {
    title: request.t('project-proposal.first_financial_year.heading'),
    values,
    errors,
    errorSummary,
    backLink: getBackLink(sessionData),
    financialYearOptions,
    afterMarchLinkText: request.t(
      'project-proposal.first_financial_year.after_march_link',
      {
        afterMarchYear
      }
    ),
    afterMarchLinkHref: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR_MANUAL
  }
}

function validateFirstFinancialYear(request) {
  const firstFinancialYear = request.payload?.firstFinancialYear

  if (!firstFinancialYear) {
    const msg = request.t(
      'project-proposal.first_financial_year.errors.required'
    )
    return {
      values: { firstFinancialYear },
      errors: { firstFinancialYear: msg },
      errorSummary: [{ text: msg, href: FIRST_FINANCIAL_YEAR_ERROR_HREF }],
      isValid: false
    }
  }

  return {
    values: { firstFinancialYear },
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
    'First financial year selected and stored in session'
  )

  return h.redirect(ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.firstFinancialYear ?? {}

  return h.view(
    PROPOSAL_VIEWS.FIRST_FINANCIAL_YEAR,
    buildViewModel(request, sessionData, values)
  )
}

async function handlePost(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const { values, errors, errorSummary, isValid } =
    validateFirstFinancialYear(request)

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.FIRST_FINANCIAL_YEAR,
        buildViewModel(request, sessionData, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values)
}

export const firstFinancialYearController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
