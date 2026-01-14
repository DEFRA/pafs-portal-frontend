import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../common/financial-year.js'
import { createProjectProposal } from '../../../common/services/project-proposal/project-proposal-service.js'

const LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF = '#last-financial-year'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  const currentFinancialYearStart = getCurrentFinancialYearStartYear()
  const afterMarchYear = getAfterMarchYear(currentFinancialYearStart, 6)

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

async function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.lastFinancialYear = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { lastFinancialYear: values.lastFinancialYear },
    'Last financial year stored in session (manual entry)'
  )

  // Prepare data for backend API
  const proposalData = {
    name: sessionData.projectName?.projectName,
    project_type: sessionData.projectType?.projectType,
    project_intervesion_types:
      sessionData.interventionTypes?.interventionTypes || [],
    main_intervension_type:
      sessionData.primaryInterventionType?.primaryInterventionType || null,
    pending_financial_year: sessionData.firstFinancialYear?.firstFinancialYear,
    project_end_financial_year: values.lastFinancialYear
  }

  const authSession = request.yar.get('auth')
  const accessToken = authSession?.accessToken

  // Call backend API to create project proposal
  const apiResponse = await createProjectProposal(proposalData, accessToken)

  if (!apiResponse.success) {
    request.server.logger.error(
      { errors: apiResponse.errors, status: apiResponse.status },
      'Failed to create project proposal'
    )

    const msg = request.t(
      'project-proposal.last_financial_year_manual.errors.api_error'
    )
    return h
      .view(
        PROPOSAL_VIEWS.LAST_FINANCIAL_YEAR_MANUAL,
        buildViewModel(request, values, { lastFinancialYear: msg }, [
          { text: msg, href: LAST_FINANCIAL_YEAR_MANUAL_ERROR_HREF }
        ])
      )
      .code(statusCodes.badRequest)
  }

  request.server.logger.info(
    {
      referenceNumber: apiResponse.data?.reference_number,
      projectId: apiResponse.data?.id
    },
    'Project proposal created successfully'
  )

  // Clear session data after successful submission
  request.yar.set('projectProposal', {})

  return h.redirect(ROUTES.GENERAL.HOME)
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
