import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  extractApiError,
  extractApiValidationErrors
} from '../../../common/helpers/error-renderer/index.js'
import { upsertProjectProposal } from '../../../common/services/project/project-service.js'
import {
  getSessionData,
  requiredInterventionTypesForProjectType,
  updateSessionData
} from './project-utils.js'
import { PROJECT_PAYLOAD_LEVEL_FIELDS } from './project-config.js'
import {
  PROJECT_ERROR_CODES,
  PROJECT_PAYLOAD_FIELDS
} from '../../../common/constants/projects.js'

export function _cleanProjectTypeSpecificData(sessionData) {
  const { projectType } = sessionData
  const requiredInterventionTypes =
    requiredInterventionTypesForProjectType(projectType)
  if (!requiredInterventionTypes) {
    delete sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]
    delete sessionData[PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]
  }
}

/**
 * Build API payload for project upsert dynamically based on level
 * @param {Object} sessionData - Project session data
 * @param {string} level - Validation level
 * @returns {Object} API payload with only the fields required for the level
 */
export function buildProjectPayload(sessionData, level) {
  const payload = {}

  // Get the required fields for this level
  const requiredFields = PROJECT_PAYLOAD_LEVEL_FIELDS[level]

  if (!requiredFields) {
    throw new Error(`Invalid validation level: ${level}`)
  }

  _cleanProjectTypeSpecificData(sessionData)

  // Dynamically build payload with only the required fields
  requiredFields.forEach((field) => {
    if (sessionData[field] !== undefined) {
      payload[field] = sessionData[field]
    }
  })

  return payload
}

/**
 * Submit project data to the backend API
 * @param {Object} request - Hapi request object
 * @param {string} level - Project payload level
 * @returns {Promise<Object>} Submission result with success flag and data/error
 */
export async function submitProject(request, level) {
  try {
    const sessionData = getSessionData(request)
    const payload = buildProjectPayload(sessionData, level)

    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken || ''

    // Call the upsertProjectProposal with level and payload
    const response = await upsertProjectProposal(
      { level, payload },
      accessToken
    )

    if (!response.success) {
      const error = new Error('Project submission failed')
      error.response = {
        data: response.data || response
      }
      throw error
    }

    return response
  } catch (error) {
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data,
      validationErrors: error.response?.data?.validationErrors,
      errors: error.response?.data?.errors
    }

    request.logger.error(
      {
        error: errorDetails,
        level
      },
      'Failed to submit project'
    )

    return {
      success: false,
      error
    }
  }
}

/**
 * Handle service consumption errors and return appropriate view data
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @param {Error} error - Error from submission
 * @param {Object} viewData - Current view data
 * @param {string} template - View template to render
 * @returns {Object} View response with error information
 */
export function handleServiceConsumptionError(
  request,
  h,
  error,
  viewData,
  template
) {
  // Check if this is an API response with validation errors
  if (error.response?.data?.validationErrors) {
    const fieldErrors = extractApiValidationErrors(error.response.data)
    return h.view(template, {
      ...viewData,
      fieldErrors
    })
  }

  // Check if this is an API response with error code
  if (error.response?.data?.errors) {
    const apiError = extractApiError(error.response.data)
    const errorCode = apiError?.errorCode || PROJECT_ERROR_CODES.NETWORK_ERROR

    return h.view(template, {
      ...viewData,
      errorCode,
      error: apiError
    })
  }

  // Generic error
  return h.view(template, {
    ...viewData,
    errorCode: PROJECT_ERROR_CODES.NETWORK_ERROR,
    error: extractApiError(request, error)
  })
}

/**
 * Save project with validation and error handling
 * Combines submission and error handling in one helper
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @param {string} level - Project payload level
 * @param {Object} viewData - View data for error rendering
 * @param {string} template - View template to render on error
 * @returns {Promise<Object|null>} Null on success, view response on error
 */
export async function saveProjectWithErrorHandling(
  request,
  h,
  level,
  viewData,
  template
) {
  const result = await submitProject(request, level)

  if (!result.success) {
    return handleServiceConsumptionError(
      request,
      h,
      result.error,
      viewData,
      template
    )
  }

  const { data: responseData } = result.data
  if (
    responseData[PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER] &&
    responseData[PROJECT_PAYLOAD_FIELDS.SLUG]
  ) {
    const sessionData = getSessionData(request)
    if (!sessionData[PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]) {
      updateSessionData(request, {
        [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]:
          responseData[PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER],
        [PROJECT_PAYLOAD_FIELDS.SLUG]: responseData[PROJECT_PAYLOAD_FIELDS.SLUG]
      })
    }
  }

  return null // No error
}
