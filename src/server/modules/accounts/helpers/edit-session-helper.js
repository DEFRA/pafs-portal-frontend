import { getAdminSessionKey } from './session-helpers.js'
import {
  RESPONSIBILITY_MAP,
  AREAS_RESPONSIBILITIES_MAP
} from '../../../common/constants/common.js'
import {
  determineResponsibilityFromAreas,
  getParentAreas
} from '../../../common/helpers/areas/areas-helper.js'

/**
 * Extract parent area IDs from account areas
 * @param {Array} accountAreas - User's assigned areas
 * @param {Array} areasData - Master areas data
 * @param {string} parentAreaType - Type of parent area to extract (EA, PSO, RMA)
 * @returns {number[]} Array of parent area IDs
 */
function extractParentAreaIds(accountAreas, areasData, parentAreaType) {
  const parentIds = new Set()
  accountAreas.forEach((area) => {
    const parents = getParentAreas(areasData, area.id, parentAreaType)
    parents.forEach((parent) => parentIds.add(parent.id))
  })
  return Array.from(parentIds).map((id) => String(id))
}

/**
 * Compare two area arrays to detect changes
 * @param {Array} currentAreas - Current areas in session
 * @param {Array} originalAreas - Original areas from account
 * @returns {boolean} True if areas have changed
 */
function detectAreasChange(currentAreas, originalAreas) {
  if (!currentAreas || !originalAreas) return false
  if (currentAreas.length !== originalAreas.length) return true

  // Create sorted string representations for comparison
  const current = currentAreas
    .map((a) => `${a.areaId || a.id}:${a.primary}`)
    .sort()
    .join('|')
  const original = originalAreas
    .map((a) => `${a.areaId || a.id}:${a.primary}`)
    .sort()
    .join('|')

  return current !== original
}

/**
 * Map account fields to session data format
 * @private
 */
function mapAccountToSessionData(account, responsibility) {
  return {
    journeyStarted: true,
    editMode: true,
    editingUserId: account.id,
    admin: account.admin || false,
    firstName: account.firstName || '',
    lastName: account.lastName || '',
    email: account.email || '',
    jobTitle: account.jobTitle || '',
    organisation: account.organisation || '',
    telephoneNumber: account.telephoneNumber || '',
    responsibility
  }
}

/**
 * Store original account data for change detection
 * @private
 */
function storeOriginalAccountData(account, responsibility) {
  return {
    admin: account.admin,
    firstName: account.firstName,
    lastName: account.lastName,
    email: account.email,
    jobTitle: account.jobTitle,
    organisation: account.organisation,
    telephoneNumber: account.telephoneNumber,
    responsibility,
    areas: account.areas || []
  }
}

/**
 * Extract and map area data for session
 * @private
 */
function mapAreaDataForSession(account, areasData, responsibility) {
  if (account.admin || !account.areas || account.areas.length === 0) {
    return {}
  }

  const areaData = { areas: account.areas }

  if (
    responsibility === RESPONSIBILITY_MAP.PSO ||
    responsibility === RESPONSIBILITY_MAP.RMA
  ) {
    areaData.eaAreas = extractParentAreaIds(
      account.areas,
      areasData,
      AREAS_RESPONSIBILITIES_MAP.EA
    )
  }

  if (responsibility === RESPONSIBILITY_MAP.RMA) {
    areaData.psoAreas = extractParentAreaIds(
      account.areas,
      areasData,
      AREAS_RESPONSIBILITIES_MAP.PSO
    )
  }

  return areaData
}

/**
 * Initialize edit session from fetched account data
 * Populates session with existing account data for editing
 *
 * @param {Object} request - Hapi request object
 * @param {Object} accountData - Account data from fetchAccountForAdmin
 */
export function initializeEditSession(request, accountData) {
  const sessionKey = getAdminSessionKey()
  const { account, areasData } = accountData

  const responsibility = determineResponsibilityFromAreas(
    account,
    areasData,
    RESPONSIBILITY_MAP,
    AREAS_RESPONSIBILITIES_MAP
  )

  const sessionData = {
    ...mapAccountToSessionData(account, responsibility),
    encodedId: request.params.encodedId,
    originalData: storeOriginalAccountData(account, responsibility),
    ...mapAreaDataForSession(account, areasData, responsibility)
  }

  request.yar.set(sessionKey, sessionData)
  return sessionData
}

/**
 * Check if there are any changes in the session data compared to original
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

  // Check basic fields
  if (sessionData.admin !== original.admin) {
    changedFields.push('admin')
  }
  if (sessionData.firstName !== original.firstName) {
    changedFields.push('firstName')
  }
  if (sessionData.lastName !== original.lastName) {
    changedFields.push('lastName')
  }
  if (sessionData.email !== original.email) {
    changedFields.push('email')
  }

  // Only check these fields if not admin
  if (!sessionData.admin) {
    if (sessionData.jobTitle !== original.jobTitle) {
      changedFields.push('jobTitle')
    }
    if (sessionData.organisation !== original.organisation) {
      changedFields.push('organisation')
    }
    if (sessionData.telephoneNumber !== original.telephoneNumber) {
      changedFields.push('telephoneNumber')
    }
    if (sessionData.responsibility !== original.responsibility) {
      changedFields.push('responsibility')
    }

    // Check areas changes
    if (detectAreasChange(sessionData.areas, original.areas)) {
      changedFields.push('areas')
    }
  }

  return {
    hasChanges: changedFields.length > 0,
    changedFields,
    roleChanged: changedFields.includes('admin'),
    responsibilityChanged: changedFields.includes('responsibility'),
    personalDetailsChanged: [
      'firstName',
      'lastName',
      'email',
      'jobTitle',
      'organisation',
      'telephoneNumber'
    ].some((field) => changedFields.includes(field)),
    areasChanged: changedFields.includes('areas')
  }
}

/**
 * Check if areas have changed in edit mode
 * @param {Object} sessionData - Current session data
 * @returns {boolean} True if areas have changed
 */
export function hasAreasChanged(sessionData) {
  if (!sessionData?.editMode || !sessionData?.originalData) {
    return false
  }
  return detectAreasChange(sessionData.areas, sessionData.originalData.areas)
}

/**
 * Pre-handler to initialize edit session if in edit mode
 * Should be used after fetchAccountForAdmin
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} Continues to handler
 */
export function initializeEditSessionPreHandler(request, h) {
  const { encodedId } = request.params

  // Only initialize if we have encodedId (edit mode)
  if (encodedId && request.pre?.accountData) {
    const sessionKey = getAdminSessionKey()
    const existingSession = request.yar.get(sessionKey)

    // Only initialize if not already in edit mode for this user
    if (!existingSession?.editMode || existingSession.encodedId !== encodedId) {
      initializeEditSession(request, request.pre.accountData)
    }
  }

  return h.continue
}
