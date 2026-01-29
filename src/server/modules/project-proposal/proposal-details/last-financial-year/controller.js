import { statusCodes } from '../../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  buildFinancialYearOptions,
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../../helpers/financial-year.js'
import {
  getAreaDetailsForProposal,
  buildProposalDataForSubmission,
  buildProjectOverviewUrlForProposal,
  submitProposalToBackend,
  logProposalSuccess,
  logAreaDetailsError,
  logProposalError,
  clearProposalSession
} from '../../helpers/proposal-submission-helper.js'

const LAST_FINANCIAL_YEAR_ERROR_HREF = '#last-financial-year'
const FINANCIAL_YEAR_RANGE = 6

// View types for last financial year capture
const VIEW_TYPES = {
  RADIO: 'radio',
  MANUAL: 'manual'
}

function buildViewModel(
  request,
  viewType,
  sessionData,
  values = {},
  errors = {},
  errorSummary = []
) {
  const currentFinancialYearStart = getCurrentFinancialYearStartYear()
  const afterMarchYear = getAfterMarchYear(
    currentFinancialYearStart,
    FINANCIAL_YEAR_RANGE
  )

  const baseModel = {
    values,
    errors,
    errorSummary,
    afterMarchYear
  }

  if (viewType === VIEW_TYPES.RADIO) {
    const financialYearOptions = buildFinancialYearOptions(
      currentFinancialYearStart,
      FINANCIAL_YEAR_RANGE
    )

    return {
      ...baseModel,
      title: request.t('project-proposal.last_financial_year.heading'),
      hint: request.t('project-proposal.last_financial_year.hint'),
      backLink: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR,
      financialYearOptions,
      afterMarchLinkText: request.t(
        'project-proposal.last_financial_year.after_march_link',
        { afterMarchYear }
      ),
      afterMarchLinkHref: ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR_MANUAL
    }
  }

  // Manual entry view - determine back link based on last financial year value
  // Default to last year radio page (user came from there)
  // If last year is outside range, check first year to determine correct back link
  let backLink = ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR
  const storedLastYear = sessionData?.lastFinancialYear
  const firstFinancialYear = sessionData?.firstFinancialYear

  if (storedLastYear) {
    const financialYearOptions = buildFinancialYearOptions(
      currentFinancialYearStart,
      FINANCIAL_YEAR_RANGE
    )
    const availableYears = new Set(financialYearOptions.map((opt) => opt.value))

    // If last year is outside range, determine back link based on first year
    if (!availableYears.has(storedLastYear)) {
      if (firstFinancialYear && !availableYears.has(firstFinancialYear)) {
        backLink = ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR_MANUAL
      } else {
        backLink = ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR
      }
    }
  }

  return {
    ...baseModel,
    title: request.t('project-proposal.last_financial_year_manual.heading'),
    label: request.t('project-proposal.last_financial_year_manual.label'),
    backLink,
    hint: request.t('project-proposal.last_financial_year_manual.hint')
  }
}

function validateRadioSelection(request, sessionData) {
  const lastFinancialYear =
    request.payload?.lastFinancialYear || sessionData?.lastFinancialYear

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

  const firstFinancialYear = sessionData?.firstFinancialYear
  if (
    firstFinancialYear &&
    Number.parseInt(lastFinancialYear, 10) <
      Number.parseInt(firstFinancialYear, 10)
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

function validateManualEntry(request, sessionData) {
  const yearRaw = request.payload?.lastFinancialYear

  if (!yearRaw || String(yearRaw).trim() === '') {
    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.required'
    )
    return {
      values: { lastFinancialYear: yearRaw },
      errors: { lastFinancialYear: msg },
      errorSummary: [{ text: msg, href: LAST_FINANCIAL_YEAR_ERROR_HREF }],
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
      errorSummary: [{ text: msg, href: LAST_FINANCIAL_YEAR_ERROR_HREF }],
      isValid: false
    }
  }

  const firstFinancialYear = sessionData?.firstFinancialYear
  if (
    firstFinancialYear &&
    Number.parseInt(yearString, 10) < Number.parseInt(firstFinancialYear, 10)
  ) {
    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.before_first_year'
    )
    return {
      values: { lastFinancialYear: yearString },
      errors: { lastFinancialYear: msg },
      errorSummary: [{ text: msg, href: LAST_FINANCIAL_YEAR_ERROR_HREF }],
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

async function handlePostSuccess(request, h, values, viewType) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.lastFinancialYear = values.lastFinancialYear
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { lastFinancialYear: values.lastFinancialYear },
    'Last financial year selected and stored in session'
  )

  const { rmaId, rmaSelection } = getAreaDetailsForProposal(sessionData)

  if (!rmaId) {
    logAreaDetailsError(request, rmaSelection)
    const msg = request.t(
      viewType === VIEW_TYPES.RADIO
        ? 'project-proposal.last_financial_year.errors.api_error'
        : 'project-proposal.last_financial_year_manual.errors.api_error'
    )
    return renderError(request, h, viewType, sessionData, values, msg)
  }

  const proposalData = buildProposalDataForSubmission(
    sessionData,
    values,
    rmaId
  )
  const apiResponse = await submitProposalToBackend(request, proposalData)

  if (!apiResponse.success) {
    logProposalError(request, apiResponse)
    const msg = request.t(
      viewType === VIEW_TYPES.RADIO
        ? 'project-proposal.last_financial_year.errors.api_error'
        : 'project-proposal.last_financial_year_manual.errors.api_error'
    )
    return renderError(request, h, viewType, sessionData, values, msg)
  }

  logProposalSuccess(request, apiResponse)
  clearProposalSession(request)

  const projectOverviewUrl = buildProjectOverviewUrlForProposal(
    apiResponse.data?.data?.referenceNumber
  )
  return h.redirect(projectOverviewUrl)
}

function renderError(request, h, viewType, sessionData, values, message) {
  const view =
    viewType === VIEW_TYPES.RADIO
      ? PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR
      : PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR_MANUAL

  return h
    .view(
      view,
      buildViewModel(
        request,
        viewType,
        sessionData,
        values,
        { lastFinancialYear: message },
        [{ text: message, href: LAST_FINANCIAL_YEAR_ERROR_HREF }]
      )
    )
    .code(statusCodes.badRequest)
}

function createLastFinancialYearController(viewType) {
  const validateFn =
    viewType === VIEW_TYPES.RADIO ? validateRadioSelection : validateManualEntry

  const view =
    viewType === VIEW_TYPES.RADIO
      ? PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR
      : PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR_MANUAL

  return {
    async handler(request, h) {
      const sessionData = request.yar.get('projectProposal') ?? {}

      if (request.method === 'post') {
        const { values, errors, errorSummary, isValid } = validateFn(
          request,
          sessionData
        )

        if (!isValid) {
          return h
            .view(
              view,
              buildViewModel(
                request,
                viewType,
                sessionData,
                values,
                errors,
                errorSummary
              )
            )
            .code(statusCodes.badRequest)
        }

        return handlePostSuccess(request, h, values, viewType)
      }

      const storedValues = {
        lastFinancialYear: sessionData.lastFinancialYear ?? ''
      }

      // If radio view and session has value outside radio range, redirect to manual
      if (viewType === VIEW_TYPES.RADIO && storedValues.lastFinancialYear) {
        const currentFinancialYearStart = getCurrentFinancialYearStartYear()
        const financialYearOptions = buildFinancialYearOptions(
          currentFinancialYearStart,
          FINANCIAL_YEAR_RANGE
        )
        const availableYears = new Set(
          financialYearOptions.map((opt) => opt.value)
        )

        if (!availableYears.has(storedValues.lastFinancialYear)) {
          return h.redirect(ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR_MANUAL)
        }
      }

      return h.view(
        view,
        buildViewModel(request, viewType, sessionData, storedValues)
      )
    }
  }
}

export { createLastFinancialYearController, VIEW_TYPES }
