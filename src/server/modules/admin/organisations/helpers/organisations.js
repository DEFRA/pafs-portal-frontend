/**
 * Organisation Management Helper Functions
 * Handles data transformation, validation, and comparison
 */

import { decodeUserId } from '../../../../common/helpers/security/encoder.js'
import { createAreasService } from '../../../../common/services/areas/areas-service.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { ORGANISATION_SESSION_KEYS } from '../../../../common/constants/organisations.js'

/**
 * Convert day/month/year object to ISO date string (YYYY-MM-DD)
 * @param {Object} dateObj - Date object with day, month, year
 * @returns {string|null} ISO date string or null if invalid/empty
 */
export function dateToISOString(dateObj) {
  if (!dateObj || (!dateObj.day && !dateObj.month && !dateObj.year)) {
    return null
  }

  const { day, month, year } = dateObj
  if (!day || !month || !year) {
    return null
  }

  const paddedDay = String(day).padStart(2, '0')
  const paddedMonth = String(month).padStart(2, '0')
  return `${year}-${paddedMonth}-${paddedDay}`
}

/**
 * Convert ISO date string to day/month/year object
 * @param {string} isoDate - ISO date string (YYYY-MM-DD)
 * @returns {Object} Date object with day, month, year properties
 */
export function isoStringToDate(isoDate) {
  if (!isoDate) {
    return { day: '', month: '', year: '' }
  }

  const date = new Date(isoDate)
  return {
    day: String(date.getDate()),
    month: String(date.getMonth() + 1),
    year: String(date.getFullYear())
  }
}

/**
 * Store original organisation data for change detection
 * @private
 */
function storeOriginalOrganisationData(organisation) {
  return {
    areaType: organisation.area_type,
    name: organisation.name,
    identifier: organisation.identifier,
    parentId: organisation.parent_id,
    subType: organisation.sub_type,
    endDate: organisation.end_date
  }
}

/**
 * Initialize edit session for organisation
 * Sets up session data and stores original for change detection
 * Uses buildFormDataFromOrganisation to ensure consistent data structure
 *
 * @param {Object} request - Hapi request object
 * @param {Object} organisationData - Data from fetchOrganisationForAdmin
 * @returns {Object} Session data
 */
export function initializeEditSession(request, organisationData) {
  const { organisation } = organisationData

  // Build session data using the standard helper
  const formData = buildFormDataFromOrganisation(organisation)

  const sessionData = {
    ...formData,
    editMode: true,
    encodedId: request.params.encodedId,
    organisationId: organisation.id,
    originalData: storeOriginalOrganisationData(organisation)
  }

  // Set in session
  request.yar.set(ORGANISATION_SESSION_KEYS.ORGANISATION_DATA, sessionData)

  return sessionData
}

/**
 * Check if organisation data has changed
 * Compares current session data with original data
 *
 * @param {Object} sessionData - Current session data
 * @returns {Object} Object with hasChanges flag and list of changed fields
 */
export function detectChanges(sessionData) {
  if (!sessionData?.editMode || !sessionData?.originalData) {
    return { hasChanges: false, changedFields: [] }
  }

  const original = sessionData.originalData
  const changedFields = []

  // Compare basic fields
  if (sessionData.name !== original.name) {
    changedFields.push('name')
  }
  if (sessionData.identifier !== original.identifier) {
    changedFields.push('identifier')
  }
  if (sessionData.areaType !== original.areaType) {
    changedFields.push('areaType')
  }
  if (sessionData.parentId !== original.parentId) {
    changedFields.push('parentId')
  }
  if (sessionData.subType !== original.subType) {
    changedFields.push('subType')
  }

  // Compare end date
  const currentEndDate = dateToISOString(sessionData.endDate)
  if (currentEndDate !== original.endDate) {
    changedFields.push('endDate')
  }

  return {
    hasChanges: changedFields.length > 0,
    changedFields
  }
}

/**
 * Pre-handler to initialize edit session if in edit mode
 * Should be used after fetchOrganisationForAdmin
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} Continues to handler
 */
export function initializeEditSessionPreHandler(request, h) {
  const { encodedId } = request.params

  // Only initialize if we have encodedId (edit mode)
  if (encodedId && request.pre?.organisationData) {
    const existingSession = request.yar.get(
      ORGANISATION_SESSION_KEYS.ORGANISATION_DATA
    )

    // Only initialize if not already in edit mode for this organisation
    if (!existingSession?.editMode || existingSession.encodedId !== encodedId) {
      initializeEditSession(request, request.pre.organisationData)
    }
  }

  return h.continue
}

/**
 * Pre-handler to fetch and validate organisation data for admin operations (view/edit)
 * Follows the same pattern as fetchAccountForAdmin
 * Attaches organisation data to request.pre for use in route handlers
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Promise<Object>} Continues to handler or redirects on error
 */
export async function fetchOrganisationForAdmin(request, h) {
  const { encodedId } = request.params
  const { logger } = request

  if (!encodedId) {
    return h.continue // Add mode, no fetch needed
  }

  // Decode the ID
  const organisationId = decodeUserId(encodedId)
  if (!organisationId) {
    logger.warn({ encodedId }, 'Invalid encoded organisation ID')
    return h.redirect(ROUTES.ADMIN.ORGANISATIONS).takeover()
  }

  // Get access token
  const authSession = getAuthSession(request)
  const accessToken = authSession?.accessToken

  if (!accessToken) {
    logger.warn('No access token found')
    return h.redirect(ROUTES.LOGIN).takeover()
  }

  // Fetch organisation
  try {
    const areasService = createAreasService(request.server)
    const organisation = await areasService.getAreaById(
      String(organisationId),
      accessToken
    )

    if (!organisation) {
      logger.error(`Organisation not found: ${organisationId}`)
      return h.redirect(ROUTES.ADMIN.ORGANISATIONS).takeover()
    }

    // Fetch areas data for dropdowns
    const areasData = await request.getAreas()

    // Attach to request.pre for use in handler
    return {
      organisation,
      areasData,
      organisationId
    }
  } catch (error) {
    logger.error(`Error fetching organisation ${organisationId}:`, error)
    return h.redirect(ROUTES.ADMIN.ORGANISATIONS).takeover()
  }
}

/**
 * Verify organisation type matches expected type
 * @param {Object} organisation - Organisation object
 * @param {string} expectedType - Expected organisation type
 * @returns {boolean} True if types match
 */
export function verifyOrganisationType(organisation, expectedType) {
  return organisation?.areaType === expectedType
}

/**
 * Get organisation type selection path
 * @returns {string} Organisation type selection URL path
 */
export function getOrganisationTypeSelectionPath() {
  return `${ROUTES.ADMIN.ORGANISATIONS}/add`
}

/**
 * Build form data from organisation object
 * Maps organisation database format to form/session format
 * @param {Object} organisation - Organisation object from database
 * @returns {Object} Form data object ready for session/form use
 */
export function buildFormDataFromOrganisation(organisation) {
  return {
    areaType: organisation.area_type,
    name: organisation.name || '',
    identifier: organisation.identifier || '',
    parentId: organisation.parent_id || '',
    subType: organisation.sub_type || '',
    endDate: organisation.end_date
      ? isoStringToDate(organisation.end_date)
      : { day: '', month: '', year: '' }
  }
}
