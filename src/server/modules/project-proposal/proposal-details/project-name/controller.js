import { statusCodes } from '../../../../common/constants/status-codes.js'
import {
  PROPOSAL_VIEWS,
  VALIDATION_PATTERNS
} from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { checkProjectNameExists } from '../../../../common/services/project-proposal/project-proposal-service.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'

const PROJECT_NAME_ERROR_HREF = '#project-name'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  return {
    title: request.t('project-proposal.project_name.heading'),
    values,
    errors,
    errorSummary
  }
}

function buildErrorResponse(h, request, values, errorKey, statusCode) {
  const errorMessage = request.t(errorKey)
  return h
    .view(
      PROPOSAL_VIEWS.PROJECT_NAME,
      buildViewModel(request, values, { projectName: errorMessage }, [
        { text: errorMessage, href: PROJECT_NAME_ERROR_HREF }
      ])
    )
    .code(statusCode)
}

function validateProjectName(request) {
  const projectName = request.payload?.projectName || ''
  const errors = {}
  const errorSummary = []

  // Validation 1: Check if empty (required)
  if (!projectName || projectName.trim() === '') {
    errors.projectName = request.t(
      'project-proposal.project_name.errors.required'
    )
    errorSummary.push({
      text: request.t('project-proposal.project_name.errors.required'),
      href: PROJECT_NAME_ERROR_HREF
    })
    return {
      values: { projectName },
      errors,
      errorSummary,
      isValid: false
    }
  }

  // Validation 2: Check for valid characters (alphanumeric, underscores, hyphens)
  if (VALIDATION_PATTERNS.PROJECT_NAME.test(projectName)) {
    return {
      values: { projectName },
      errors: {},
      errorSummary: [],
      isValid: true
    }
  }

  errors.projectName = request.t(
    'project-proposal.project_name.errors.invalid_format'
  )
  errorSummary.push({
    text: request.t('project-proposal.project_name.errors.invalid_format'),
    href: PROJECT_NAME_ERROR_HREF
  })

  return {
    values: { projectName },
    errors,
    errorSummary,
    isValid: false
  }
}

/**
 * Check if project name already exists in database
 * Returns error response if duplicate exists, null if no duplicate
 */
async function checkProjectNameDuplicate(request, h, values) {
  try {
    // Get session to retrieve access token
    const session = getAuthSession(request)
    const accessToken = session?.accessToken

    // Validation 3: Check if project name already exists in database
    const response = await checkProjectNameExists(
      values.projectName,
      accessToken
    )
    const duplicateDetected =
      response?.data?.exists ||
      response?.validationErrors?.errorCode === 'PROJECT_NAME_DUPLICATE' ||
      (!response?.success && response?.status === statusCodes.badRequest)

    if (duplicateDetected) {
      return buildErrorResponse(
        h,
        request,
        values,
        'project-proposal.project_name.errors.already_exists',
        statusCodes.badRequest
      )
    }

    // No duplicate found, return null to indicate success
    return null
  } catch (error) {
    request.server.logger.error(
      {
        error: error.message,
        projectName: values.projectName
      },
      'Error checking project name existence'
    )

    return buildErrorResponse(
      h,
      request,
      values,
      'project-proposal.project_name.errors.validation_error',
      statusCodes.internalServerError
    )
  }
}

/**
 * Save project name to session and redirect to next step
 */
function handlePostSuccess(request, h, values) {
  const session = getAuthSession(request)
  const userSession = session?.user

  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.projectName = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { projectName: values.projectName },
    'Project name validated and stored in session'
  )

  if (userSession?.admin || (userSession?.areas?.length ?? 0) > 1) {
    return h.redirect(ROUTES.PROJECT_PROPOSAL.RMA_SELECTION)
  }

  if (userSession?.areas?.length === 1) {
    sessionData.rmaSelection = {
      rmaSelection: userSession?.areas[0]?.areaId
    }
    request.yar.set('projectProposal', sessionData)

    request.server.logger.info(
      { rmaSelection: userSession?.areas[0]?.areaId },
      'RMA selection validated and stored in session'
    )
  }

  return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary, isValid } = validateProjectName(request)

  // If basic validation fails (required or alphanumeric), show errors immediately
  if (!isValid) {
    return h
      .view(
        PROPOSAL_VIEWS.PROJECT_NAME,
        buildViewModel(request, values, errors, errorSummary)
      )
      .code(statusCodes.badRequest)
  }

  // Basic validation passed, now check for duplicate in database
  const duplicateCheckResult = await checkProjectNameDuplicate(
    request,
    h,
    values
  )

  // If duplicate check returned an error response, return it
  if (duplicateCheckResult) {
    return duplicateCheckResult
  }

  // No duplicate found, save to session and redirect
  return handlePostSuccess(request, h, values)
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  const values = sessionData.projectName ?? {}

  return h.view(
    PROPOSAL_VIEWS.PROJECT_NAME,
    buildViewModel(request, values, undefined, undefined)
  )
}

export const projectNameController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
