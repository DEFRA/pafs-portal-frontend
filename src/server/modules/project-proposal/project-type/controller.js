import { statusCodes } from '../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'

const PROJECT_TYPE_ERROR_HREF = '#project-type'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  return {
    title: request.t('project-proposal.project_type.heading'),
    values,
    errors,
    errorSummary
  }
}

function validateProjectType(request) {
  const projectType = request.payload?.projectType || ''
  const errors = {}
  const errorSummary = []

  if (!projectType) {
    errors.projectType = request.t(
      'project-proposal.project_type.errors.required'
    )
    errorSummary.push({
      text: request.t('project-proposal.project_type.errors.required'),
      href: PROJECT_TYPE_ERROR_HREF
    })
    return {
      values: { projectType },
      errors,
      errorSummary,
      isValid: false
    }
  }

  return {
    values: { projectType },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.projectType = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { projectType: values.projectType },
    'Project type selected and stored in session'
  )

  // Redirect to intervention-type page if DEF, REP or REF is selected
  if (
    values.projectType === 'DEF' ||
    values.projectType === 'REP' ||
    values.projectType === 'REF'
  ) {
    return h.redirect(ROUTES.PROJECT_PROPOSAL.INTERVENTION_TYPE)
  }

  // For other project types, redirect to home (update when next step is defined)
  return h.redirect(ROUTES.GENERAL.HOME)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary, isValid } = validateProjectType(request)

  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.PROJECT_TYPE,
        buildViewModel(request, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  return handlePostSuccess(request, h, values)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.projectType ?? {}

  return h.view(
    PROPOSAL_VIEWS.PROJECT_TYPE,
    buildViewModel(request, values, undefined, undefined)
  )
}

export const projectTypeController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
