import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  buildFinancialYearOptions,
  getAfterMarchYear,
  getCurrentFinancialYearStartYear
} from '../common/financial-year.js'
import { getRfccCodeFromArea, getAreaNameById } from '../common/rfcc-helper.js'
import { createProjectProposal } from '../../../common/services/project-proposal/project-proposal-service.js'

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

  const { rfccCode, rmaName, rmaSelection } = await getAreaDetails(
    request,
    sessionData
  )

  if (!rfccCode) {
    request.server.logger.error(
      { areaId: rmaSelection },
      'Failed to determine RFCC code from selected area'
    )

    const msg = request.t(
      'project-proposal.last_financial_year.errors.api_error'
    )
    return renderError(request, h, values, msg)
  }

  const proposalData = buildProposalData(sessionData, values, rmaName, rfccCode)
  const apiResponse = await submitProposal(request, proposalData)

  if (!apiResponse.success) {
    request.server.logger.error(
      { errors: apiResponse.errors, status: apiResponse.status },
      'Failed to create project proposal'
    )

    const msg = request.t(
      'project-proposal.last_financial_year.errors.api_error'
    )
    return renderError(request, h, values, msg)
  }

  request.server.logger.info(
    {
      referenceNumber: apiResponse.data?.data?.reference_number,
      projectId: apiResponse.data?.data?.id
    },
    'Project proposal created successfully'
  )

  // Clear session data after successful submission
  request.yar.set('projectProposal', {})

  const projectOverviewUrl = buildProjectOverviewUrl(
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

async function getAreaDetails(request, sessionData) {
  const areasData = await request.getAreas()
  const rmaSelection = sessionData.rmaSelection?.rmaSelection

  return {
    rfccCode: getRfccCodeFromArea(rmaSelection, areasData),
    rmaName: getAreaNameById(rmaSelection, areasData),
    rmaSelection
  }
}

function buildProposalData(sessionData, values, rmaName, rfccCode) {
  return {
    name: sessionData.projectName?.projectName,
    projectType: sessionData.projectType?.projectType,
    projectIntervesionTypes:
      sessionData.interventionTypes?.interventionTypes || [],
    mainIntervensionType:
      sessionData.primaryInterventionType?.primaryInterventionType || null,
    projectStartFinancialYear:
      sessionData.firstFinancialYear?.firstFinancialYear,
    projectEndFinancialYear: values.lastFinancialYear,
    rmaName,
    rfccCode
  }
}

function buildProjectOverviewUrl(referenceNumber) {
  return ROUTES.PROJECT_PROPOSAL.PROJECT_OVERVIEW.replace(
    '{reference_number}',
    referenceNumber
  )
}

async function submitProposal(request, proposalData) {
  const authSession = request.yar.get('auth')
  const accessToken = authSession?.accessToken
  return createProjectProposal(proposalData, accessToken)
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
