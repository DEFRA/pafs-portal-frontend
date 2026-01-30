import { statusCodes } from '../../../../common/constants/status-codes.js'
import { PROPOSAL_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { getBacklink } from '../../helpers/backlink-helper.js'

const PROJECT_TYPE_ERROR_HREF = '#project-type'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  const session = getAuthSession(request)
  const userSession = session?.user
  let backlinkURL = ROUTES.PROJECT_PROPOSAL.PROJECT_NAME

  if (userSession?.admin || (userSession?.areas?.length ?? 0) > 1) {
    backlinkURL = ROUTES.PROJECT_PROPOSAL.RMA_SELECTION
  }

  const backlink = getBacklink(request, {
    defaultUrl: backlinkURL
  })

  return {
    title: request.t('project-proposal.project_type.heading'),
    values,
    errors,
    errorSummary,
    backlink
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
  sessionData.projectType = values.projectType
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

  return h.redirect(ROUTES.PROJECT_PROPOSAL.FIRST_FINANCIAL_YEAR)
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
  const values = { projectType: sessionData.projectType ?? '' }

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
