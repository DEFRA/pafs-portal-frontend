import { statusCodes } from '../../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'

const PRIMARY_INTERVENTION_ERROR_HREF = '#primary-intervention-type'

function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  selectedInterventions = []
) {
  return {
    title: request.t('project-proposal.primary_intervention_type.heading'),
    values,
    errors,
    errorSummary,
    selectedInterventions
  }
}

function getSelectedInterventions(request) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const interventions = sessionData.interventionTypes?.interventionTypes || []
  return Array.isArray(interventions) ? interventions : [interventions]
}

function validatePrimaryIntervention(request, selectedInterventions) {
  const chosen = request.payload?.primaryInterventionType
  const errors = {}
  const errorSummary = []

  if (!chosen) {
    const msg = request.t(
      'project-proposal.primary_intervention_type.errors.required'
    )
    errors.primaryInterventionType = msg
    errorSummary.push({ text: msg, href: PRIMARY_INTERVENTION_ERROR_HREF })
    return {
      values: { primaryInterventionType: chosen },
      errors,
      errorSummary,
      isValid: false
    }
  }

  if (!selectedInterventions.includes(chosen)) {
    const msg = request.t(
      'project-proposal.primary_intervention_type.errors.invalid'
    )
    errors.primaryInterventionType = msg
    errorSummary.push({ text: msg, href: PRIMARY_INTERVENTION_ERROR_HREF })
    return {
      values: { primaryInterventionType: chosen },
      errors,
      errorSummary,
      isValid: false
    }
  }

  return {
    values: { primaryInterventionType: chosen },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.primaryInterventionType = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { primaryInterventionType: values.primaryInterventionType },
    'Primary intervention type selected and stored in session'
  )

  return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR)
}

async function handleGet(request, h) {
  const selectedInterventions = getSelectedInterventions(request)

  // If only one or none selected, skip this page
  if (!selectedInterventions || selectedInterventions.length <= 1) {
    return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR)
  }

  const values =
    request.yar.get('projectProposal')?.primaryInterventionType ?? {}

  return h.view(
    PROPOSAL_VIEWS.PRIMARY_INTERVENTION_TYPE,
    buildViewModel(request, values, undefined, undefined, selectedInterventions)
  )
}

async function handlePost(request, h) {
  const selectedInterventions = getSelectedInterventions(request)

  // If only one or none selected, skip this page
  if (!selectedInterventions || selectedInterventions.length <= 1) {
    return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR)
  }

  const { values, errors, errorSummary, isValid } = validatePrimaryIntervention(
    request,
    selectedInterventions
  )

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.PRIMARY_INTERVENTION_TYPE,
        buildViewModel(
          request,
          values,
          errors,
          errorSummary,
          selectedInterventions
        )
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values)
}

export const primaryInterventionTypeController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
