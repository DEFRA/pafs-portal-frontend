import { statusCodes } from '../../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  buildFinancialYearOptions,
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../../helpers/financial-year.js'

const FIRST_FINANCIAL_YEAR_ERROR_HREF = '#first-financial-year'
const FINANCIAL_YEARS_TO_DISPLAY = 6

// View types for first financial year capture
const VIEW_TYPES = {
  RADIO: 'radio',
  MANUAL: 'manual'
}

function getBackLink(sessionData) {
  const projectType = sessionData?.projectType
  const selected = sessionData?.interventionTypes

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

/**
 * Build view model for first financial year form
 * @param {Object} request - Hapi request object
 * @param {string} viewType - VIEW_TYPES.DROPDOWN or VIEW_TYPES.MANUAL
 * @param {Object} sessionData - Current session data
 * @param {Object} values - Form values
 * @param {Object} errors - Form errors
 * @param {Array} errorSummary - Error summary for display
 * @returns {Object} View model
 */
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
    FINANCIAL_YEARS_TO_DISPLAY
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
      FINANCIAL_YEARS_TO_DISPLAY
    )

    return {
      ...baseModel,
      title: request.t('project-proposal.first_financial_year.heading'),
      backLink: getBackLink(sessionData),
      financialYearOptions,
      afterMarchLinkText: request.t(
        'project-proposal.first_financial_year.after_march_link',
        { afterMarchYear }
      ),
      afterMarchLinkHref: ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR_MANUAL
    }
  }

  // Manual entry view
  // Determine back link:
  // - If no session value or value is within radio range -> go back to radio page
  // - If value exists and is outside radio range -> go to previous step in flow
  let manualBackLink = ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR
  const storedYear = sessionData?.firstFinancialYear

  if (storedYear) {
    const financialYearOptions = buildFinancialYearOptions(
      currentFinancialYearStart,
      FINANCIAL_YEARS_TO_DISPLAY
    )
    const availableYears = financialYearOptions.map((opt) => opt.value)

    if (!availableYears.includes(storedYear)) {
      manualBackLink = getBackLink(sessionData)
    }
  }

  return {
    ...baseModel,
    title: request.t('project-proposal.first_financial_year_manual.heading'),
    label: request.t('project-proposal.first_financial_year_manual.label'),
    backLink: manualBackLink,
    hint: request.t('project-proposal.first_financial_year_manual.hint')
  }
}

/**
 * Validate first financial year from dropdown selection
 * @param {Object} request - Hapi request object
 * @param {Object} sessionData - Current session data
 * @returns {Object} Validation result
 */
function validateRadioSelection(request, sessionData) {
  const firstFinancialYear =
    request.payload?.firstFinancialYear || sessionData?.firstFinancialYear

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

/**
 * Validate manually entered year (4-digit validation)
 * @param {Object} request - Hapi request object
 * @returns {Object} Validation result
 */
function validateManualEntry(request) {
  const yearRaw = request.payload?.firstFinancialYear

  if (!yearRaw || String(yearRaw).trim() === '') {
    const msg = request.t(
      'project-proposal.first_financial_year_manual.errors.required'
    )
    return {
      values: { firstFinancialYear: yearRaw },
      errors: { firstFinancialYear: msg },
      errorSummary: [{ text: msg, href: FIRST_FINANCIAL_YEAR_ERROR_HREF }],
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
      errorSummary: [{ text: msg, href: FIRST_FINANCIAL_YEAR_ERROR_HREF }],
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
  sessionData.firstFinancialYear = values.firstFinancialYear
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { firstFinancialYear: values.firstFinancialYear },
    'First financial year selected and stored in session'
  )

  return h.redirect(ROUTES.PROJECT_PROPOSAL.LAST_FINANCIAL_YEAR)
}

/**
 * Create a unified controller for both radio and manual entry views
 * @param {string} viewType - VIEW_TYPES.RADIO or VIEW_TYPES.MANUAL
 * @returns {Object} Controller handler
 */
function createFirstFinancialYearController(viewType) {
  const validateFn =
    viewType === VIEW_TYPES.RADIO ? validateRadioSelection : validateManualEntry
  const viewFile =
    viewType === VIEW_TYPES.RADIO
      ? PROPOSAL_VIEWS.FIRST_FINANCIAL_YEAR
      : PROPOSAL_VIEWS.FIRST_FINANCIAL_YEAR_MANUAL

  return {
    async handler(request, h) {
      const sessionData = request.yar.get('projectProposal') ?? {}

      if (request.method === 'post') {
        const { values, errors, errorSummary, isValid } =
          viewType === VIEW_TYPES.RADIO
            ? validateFn(request, sessionData)
            : validateFn(request)

        if (!isValid) {
          return h
            .view(
              viewFile,
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

        return handlePostSuccess(request, h, values)
      }

      // GET request
      const storedValues = {
        firstFinancialYear: sessionData.firstFinancialYear ?? ''
      }

      // If radio view and session has value outside radio range, redirect to manual
      if (viewType === VIEW_TYPES.RADIO && storedValues.firstFinancialYear) {
        const currentFinancialYearStart = getCurrentFinancialYearStartYear()
        const financialYearOptions = buildFinancialYearOptions(
          currentFinancialYearStart,
          FINANCIAL_YEARS_TO_DISPLAY
        )
        const availableYears = financialYearOptions.map((opt) => opt.value)

        if (!availableYears.includes(storedValues.firstFinancialYear)) {
          return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR_MANUAL)
        }
      }

      return h.view(
        viewFile,
        buildViewModel(request, viewType, sessionData, storedValues)
      )
    }
  }
}

export { createFirstFinancialYearController, VIEW_TYPES }
