import { statusCodes } from '../../common/constants/status-codes.js'
import { VALIDATION_PATTERNS } from '../../common/constants/validation.js'
import { ROUTES } from '../../common/constants/routes.js'
import { checkProjectNameExists } from '../../common/services/project-proposal/project-proposal-service.js'
import { getAuthSession } from '../../common/helpers/auth/session-manager.js'

const PROJECT_NAME_VIEW = 'project-proposal/project-name/index.njk'

function buildViewModel(request, values = {}, errors = {}, errorSummary = []) {
  return {
    title: request.t('project-proposal.project_name.heading'),
    values,
    errors,
    errorSummary
  }
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
      href: '#project-name'
    })
  } else {
    // Validation 2: Check for valid characters (alphanumeric, underscores, hyphens)
    if (!VALIDATION_PATTERNS.PROJECT_NAME.test(projectName)) {
      errors.projectName = request.t(
        'project-proposal.project_name.errors.invalid_format'
      )
      errorSummary.push({
        text: request.t('project-proposal.project_name.errors.invalid_format'),
        href: '#project-name'
      })
    }
  }

  return {
    values: { projectName },
    errors,
    errorSummary,
    isValid: errorSummary.length === 0
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

    if (response.data?.exists) {
      const errorMessage = request.t(
        'project-proposal.project_name.errors.already_exists'
      )

      return h
        .view(
          PROJECT_NAME_VIEW,
          buildViewModel(request, values, { projectName: errorMessage }, [
            { text: errorMessage, href: '#project-name' }
          ])
        )
        .code(statusCodes.badRequest)
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

    return h
      .view(
        PROJECT_NAME_VIEW,
        buildViewModel(
          request,
          values,
          {
            projectName: request.t(
              'project-proposal.project_name.errors.validation_error'
            )
          },
          [
            {
              text: request.t(
                'project-proposal.project_name.errors.validation_error'
              ),
              href: '#project-name'
            }
          ]
        )
      )
      .code(statusCodes.internalServerError)
  }
}

/**
 * Save project name to session and redirect to next step
 */
function handlePostSuccess(request, h, values) {
  const sessionData = request.yar.get('projectProposal') ?? {}
  sessionData.projectName = values
  request.yar.set('projectProposal', sessionData)

  request.server.logger.info(
    { projectName: values.projectName },
    'Project name validated and stored in session'
  )

  // Redirect to next step (project-type)
  return h.redirect(ROUTES.PROJECT_PROPOSAL.PROJECT_TYPE)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary, isValid } = validateProjectName(request)

  // If basic validation fails (required or alphanumeric), show errors immediately
  if (!isValid) {
    return h
      .view(
        PROJECT_NAME_VIEW,
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
    PROJECT_NAME_VIEW,
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
