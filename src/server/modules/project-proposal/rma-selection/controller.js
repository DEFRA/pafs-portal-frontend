import { getAreasByType } from '../../../common/helpers/areas/areas-helper.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import {
  PROPOSAL_VIEWS,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getBacklink } from '../common/backlink-helper.js'

const RMA_SELECTION_ERROR_HREF = '#rma-selection'

function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  viewData = {}
) {
  const backlink = getBacklink(request, {
    defaultUrl: ROUTES.PROJECT_PROPOSAL.PROJECT_NAME
  })

  return {
    title: request.t('project-proposal.rma_selection.heading'),
    values,
    errors,
    errorSummary,
    viewData,
    backlink
  }
}

async function rmaDropDownOptions(request) {
  const session = getAuthSession(request)
  const userSession = session?.user
  let rmaAreas = {}

  if (userSession?.admin) {
    const areasData = await request.getAreas()
    const allRmaAreas = getAreasByType(
      areasData,
      AREAS_RESPONSIBILITIES_MAP.RMA
    )
    rmaAreas = allRmaAreas.map((area) => ({
      id: area.id,
      name: area.name
    }))
  } else {
    const userAreas = userSession?.areas ?? []
    rmaAreas = userAreas.map((area) => ({
      id: area.areaId,
      name: area.name
    }))
  }

  return rmaAreas
}

function validateRmaSelection(request) {
  const rmaSelection = request.payload?.rmaSelection || ''
  const errors = {}
  const errorSummary = []

  // Validation: Check if empty (required)
  if (!rmaSelection || rmaSelection.trim() === '') {
    errors.rmaSelection = request.t(
      'project-proposal.rma_selection.errors.required'
    )
    errorSummary.push({
      text: request.t('project-proposal.rma_selection.errors.required'),
      href: RMA_SELECTION_ERROR_HREF
    })
    return {
      values: { rmaSelection },
      errors,
      errorSummary,
      isValid: false
    }
  }

  return {
    values: { rmaSelection },
    errors: {},
    errorSummary: [],
    isValid: true
  }
}

/**
 * Show RMA selection page
 */
async function handleGet(request, h) {
  const rmaAreas = await rmaDropDownOptions(request)
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData?.rmaSelection ?? {}

  if (!sessionData.projectName) {
    return h.redirect(ROUTES.PROJECT_PROPOSAL.START_PROPOSAL)
  }

  return h.view(
    PROPOSAL_VIEWS.RMA_SELECTION,
    buildViewModel(request, values, undefined, undefined, rmaAreas)
  )
}

/**
 * Save RMA selection to session and redirect to next step
 */
function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.rmaSelection = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { rmaSelection: values.rmaSelection },
    'RMA selection validated and stored in session'
  )

  // Redirect to next step (project-type)
  return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE)
}

async function handlePost(request, h) {
  const rmaAreas = await rmaDropDownOptions(request)
  const { values, errors, errorSummary, isValid } =
    validateRmaSelection(request)

  // If basic validation fails, show errors immediately
  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.RMA_SELECTION,
        buildViewModel(request, values, errors, errorSummary, rmaAreas)
      )
      .code(statusCodes.badRequest)
  }

  // No errors found, save to session and redirect
  return handlePostSuccess(request, h, values)
}

export const rmaSelectionController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
