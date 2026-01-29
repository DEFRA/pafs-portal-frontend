import { statusCodes } from '../../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'

const INTERVENTION_TYPE_ERROR_HREF = '#intervention-type'

function buildViewModel(
  request,
  projectType,
  values = {},
  errors = {},
  errorSummary = []
) {
  return {
    title: request.t('project-proposal.intervention_type.heading'),
    values,
    errors,
    errorSummary,
    projectType
  }
}

function validateInterventionTypes(request) {
  const interventionTypes = request.payload?.interventionTypes || []
  const errors = {}
  const errorSummary = []

  // Convert single value to array if needed
  const selectedTypes = Array.isArray(interventionTypes)
    ? interventionTypes
    : [interventionTypes]

  if (selectedTypes.length === 0) {
    errors.interventionTypes = request.t(
      'project-proposal.intervention_type.errors.required'
    )
    errorSummary.push({
      text: request.t('project-proposal.intervention_type.errors.required'),
      href: INTERVENTION_TYPE_ERROR_HREF
    })
    return {
      values: { interventionTypes: selectedTypes },
      errors,
      errorSummary,
      isValid: false
    }
  }

  return {
    values: { interventionTypes: selectedTypes },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

function handlePostSuccess(request, h, values, selectedInterventions) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.interventionTypes = values.interventionTypes
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { interventionTypes: values.interventionTypes },
    'Intervention types selected and stored in session'
  )

  if (selectedInterventions.length > 1) {
    return h.redirect(ROUTES.PROJECT_PROPOSAL.PRIMARY_INTERVENTION_TYPE)
  }

  return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary, isValid } =
    validateInterventionTypes(request)
  const projectType = request.yar.get('projectProposal')?.projectType
  const selectedInterventions = values.interventionTypes || []

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.INTERVENTION_TYPE,
        buildViewModel(request, projectType, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values, selectedInterventions)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = { interventionTypes: sessionData.interventionTypes ?? [] }
  const projectType = sessionData.projectType

  return h.view(
    PROPOSAL_VIEWS.INTERVENTION_TYPE,
    buildViewModel(request, projectType, values)
  )
}

export const interventionTypeController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
