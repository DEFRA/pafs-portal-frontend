/**
 * Project Edit Session Helper Functions
 * Handles change detection and session initialization for project editing
 */

import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectProposalOverview } from '../../../common/services/project/project-service.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  PROJECT_SESSION_KEY,
  PROJECT_PAYLOAD_FIELDS
} from '../../../common/constants/projects.js'
import { getSessionData } from './project-utils.js'

const NFM_MEASURE_FIELD_MAPPINGS = {
  river_floodplain_restoration: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA,
    storageVolumeM3: PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME
  },
  leaky_barriers_in_channel_storage: {
    storageVolumeM3: PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME,
    lengthKm: PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH,
    widthM: PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH
  },
  offline_storage: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA,
    storageVolumeM3: PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME
  },
  woodland: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA
  },
  headwater_drainage_management: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA
  },
  runoff_attenuation_management: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA,
    storageVolumeM3: PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME
  },
  saltmarsh_management: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA,
    lengthKm: PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH
  },
  sand_dune_management: {
    areaHectares: PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA,
    lengthKm: PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH
  }
}

const hasValue = (value) => value !== null && value !== undefined

/**
 * Map a single NFM measure to frontend fields
 * @param {Object} measure - NFM measure object from backend
 * @returns {Object} - Mapped fields for this measure
 */
function mapSingleNfmMeasure(measure) {
  const mappedFields = {}
  const fieldMapping = NFM_MEASURE_FIELD_MAPPINGS[measure?.measureType]

  if (!fieldMapping) {
    return mappedFields
  }

  Object.entries(fieldMapping).forEach(([sourceField, targetField]) => {
    const value = measure[sourceField]
    if (hasValue(value)) {
      mappedFields[targetField] = value
    }
  })

  return mappedFields
}

/**
 * Map NFM measures array from backend to individual fields for frontend
 * @param {Array} nfmMeasures - Array of NFM measure objects from backend
 * @returns {Object} - Mapped NFM fields
 */
function mapNfmMeasuresToFields(nfmMeasures) {
  const mappedFields = {}

  if (!nfmMeasures || !Array.isArray(nfmMeasures)) {
    return mappedFields
  }

  nfmMeasures.forEach((measure) => {
    const singleMeasureFields = mapSingleNfmMeasure(measure)
    Object.assign(mappedFields, singleMeasureFields)
  })

  return mappedFields
}

/**
 * Compare two values for equality, handling arrays, strings, and numbers
 * @param {*} value1 - First value
 * @param {*} value2 - Second value
 * @returns {boolean} True if values are equal
 */
function areValuesEqual(value1, value2) {
  // Handle null/undefined
  if (value1 === value2) {
    return true
  }
  if (value1 == null || value2 == null) {
    return false
  }

  // Handle arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) {
      return false
    }
    return value1.every((item, index) => item === value2[index])
  }

  // Handle strings and numbers
  return value1 === value2
}

/**
 * Initialize edit session for project
 * Sets up session data and stores original for change detection
 *
 * @param {Object} request - Hapi request object
 * @param {Object} projectData - Project data from API
 * @returns {Object} Session data
 */
export function initializeEditSession(request, projectData) {
  // Map NFM measures from backend format to frontend fields
  const nfmFields = mapNfmMeasuresToFields(projectData.pafs_core_nfm_measures)

  const sessionData = {
    ...projectData,
    ...nfmFields, // Merge the mapped NFM fields
    journeyStarted: true,
    isEdit: true,
    referenceNumber: projectData.referenceNumber,
    originalData: {
      ...projectData,
      ...nfmFields // Store mapped NFM fields in originalData too
    }
  }

  // Set in session
  request.yar.set(PROJECT_SESSION_KEY, sessionData)

  return sessionData
}

/**
 * Check if project data has changed
 * Compares current session data with original data for specified fields
 *
 * @param {Object} sessionData - Current session data
 * @param {string[]} fields - Fields to check for changes
 * @returns {Object} Object with hasChanges flag and list of changed fields
 */
export function detectChanges(sessionData, fields = []) {
  if (!sessionData?.isEdit || !sessionData?.originalData) {
    return { hasChanges: false, changedFields: [] }
  }

  const original = sessionData.originalData
  const changedFields = []

  // If no fields specified, check all fields in originalData
  const fieldsToCheck = fields.length > 0 ? fields : Object.keys(original)

  fieldsToCheck.forEach((field) => {
    if (!areValuesEqual(sessionData[field], original[field])) {
      changedFields.push(field)
    }
  })

  return {
    hasChanges: changedFields.length > 0,
    changedFields
  }
}

/**
 * Pre-handler to initialize edit session if in edit mode
 * Should be used after fetchProjectForEdit in the pre array
 * Expects request.pre.projectData to be set by a previous pre-handler
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} Continues to handler
 */
export async function initializeEditSessionPreHandler(request, h) {
  const { referenceNumber } = request.params
  const projectData = request.pre?.projectData

  // Only initialize if we have referenceNumber (edit mode) and projectData
  if (!referenceNumber) {
    return h.continue
  }

  if (!projectData) {
    request.logger?.warn(
      { referenceNumber },
      'Project data not found in request.pre for edit session initialization'
    )
    return h.continue
  }

  const existingSession = request.yar.get(PROJECT_SESSION_KEY)

  // Only initialize if not already in edit mode for this project
  if (
    !existingSession?.isEdit ||
    existingSession.referenceNumber !== referenceNumber
  ) {
    initializeEditSession(request, projectData)
    request.logger?.info(
      { referenceNumber },
      'Edit session initialized for project'
    )
  }

  return h.continue
}

/**
 * Pre-handler to fetch and validate project data for edit operations
 * Attaches project data to request.pre for use in route handlers
 * If an edit session already exists, uses session data to preserve unsaved changes
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @param {Object} options - Options object
 * @param {boolean} options.forceFresh - If true, always fetch from database ignoring session
 * @returns {Promise<Object>} Continues to handler or redirects on error
 */
export async function fetchProjectForEdit(
  request,
  h,
  { forceFresh = false } = {}
) {
  const { referenceNumber } = request.params
  const { logger } = request

  if (!referenceNumber) {
    return h.redirect(ROUTES.PROJECT.START).takeover()
  }

  // Check if we already have an active edit session for this project
  // Skip session check if forceFresh is requested (e.g., for overview page)
  if (!forceFresh) {
    const existingSession = getSessionData(request)
    if (existingSession?.isEdit && existingSession.slug === referenceNumber) {
      // Use existing session data to preserve unsaved changes
      logger?.info({ referenceNumber }, 'Using existing edit session data')
      request.pre = request.pre || {}
      request.pre.projectData = existingSession
      return h.continue
    }
  }

  // Get access token
  const authSession = getAuthSession(request)
  const accessToken = authSession?.accessToken

  if (!accessToken) {
    logger.warn('No access token found')
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  // Fetch project from API for first time
  try {
    const response = await getProjectProposalOverview(
      referenceNumber,
      accessToken
    )

    if (!response.success || !response.data) {
      logger.warn({ referenceNumber }, 'Project not found')
      return h.redirect(ROUTES.GENERAL.HOME).takeover()
    }

    // Store in request.pre for use in handlers
    request.pre = request.pre || {}
    request.pre.projectData = response.data

    return h.continue
  } catch (error) {
    logger.error(
      {
        error: {
          message: error.message,
          stack: error.stack
        },
        referenceNumber
      },
      'Error fetching project for edit'
    )
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }
}

/**
 * Pre-handler to fetch fresh project data from database for overview/view pages
 * Always fetches from API, ignoring any cached session data
 * This ensures overview shows the saved state, not unsaved changes
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Promise<Object>} Continues to handler or redirects on error
 */
export async function fetchProjectForOverview(request, h) {
  return fetchProjectForEdit(request, h, { forceFresh: true })
}
