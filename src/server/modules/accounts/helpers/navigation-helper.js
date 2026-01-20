import { RESPONSIBILITY_MAP } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { detectChanges } from './edit-session-helper.js'
import { getAdminSessionKey } from './session-helpers.js'

/**
 * Navigation helper for account journey
 * Handles routing logic for both create and edit modes
 */

/**
 * Get the next route after is-admin page
 * @param {Object} request - Hapi request object
 * @param {Object} sessionData - Current session data
 * @returns {string} Next route path
 */
export function getNextRouteAfterIsAdmin(request, sessionData) {
  const { isEditMode, encodedId, baseRoutes } = getEditModeContext(request)
  if (isEditMode) {
    const changes = detectChanges(sessionData)

    // If admin flag changed from no to yes, skip to check answers
    if (changes.roleChanged && sessionData.admin === true) {
      return baseRoutes.CHECK_ANSWERS.replace('{encodedId}', encodedId)
    }

    // If admin flag changed from yes to no, go to details
    if (changes.roleChanged && sessionData.admin === false) {
      return baseRoutes.DETAILS.replace('{encodedId}', encodedId)
    }

    // If no change in admin flag, go directly to view page
    if (!changes.roleChanged) {
      return ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
    }
  }

  // Create mode: always go to details
  return baseRoutes.DETAILS
}

export function isAdminContext(request) {
  return request.path.startsWith('/admin')
}

/**
 * Determine route for admin users after details page
 * @private
 */
function getAdminDetailsRoute(changes, isEditMode, encodedId, baseRoutes) {
  if (isEditMode && !changes.hasChanges) {
    return ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
  }
  const checkAnswersRoute = isEditMode
    ? baseRoutes.CHECK_ANSWERS.replace('{encodedId}', encodedId)
    : baseRoutes.CHECK_ANSWERS
  return checkAnswersRoute
}

/**
 * Determine route for general users after details page
 * @private
 */
function getGeneralUserDetailsRoute(
  request,
  sessionData,
  changes,
  isEditMode,
  encodedId,
  baseRoutes
) {
  if (isEditMode) {
    if (changes.personalDetailsChanged && !changes.responsibilityChanged) {
      return baseRoutes.CHECK_ANSWERS.replace('{encodedId}', encodedId)
    }
    if (!changes.hasChanges) {
      return ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
    }
  }
  return _getParentAreaRoute(request, sessionData, baseRoutes, encodedId)
}

/**
 * Get the next route after details page
 * @param {Object} request - Hapi request object
 * @param {Object} sessionData - Current session data
 * @returns {string} Next route path or empty string to use existing method
 */
export function getNextRouteAfterDetails(request, sessionData) {
  const { isEditMode, encodedId, baseRoutes } = getEditModeContext(request)
  const changes = isEditMode ? detectChanges(sessionData) : null

  if (sessionData.admin === true) {
    return getAdminDetailsRoute(changes, isEditMode, encodedId, baseRoutes)
  }

  return getGeneralUserDetailsRoute(
    request,
    sessionData,
    changes,
    isEditMode,
    encodedId,
    baseRoutes
  )
}

function _getParentAreaRoute(request, sessionData, baseRoutes, encodedId) {
  const isAdmin = isAdminContext(request)
  const isEditMode = !!encodedId

  // PSO and RMA users select EA areas first
  if (
    sessionData.responsibility === RESPONSIBILITY_MAP.PSO ||
    sessionData.responsibility === RESPONSIBILITY_MAP.RMA
  ) {
    if (!isAdmin) {
      return ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_EA
    }
    // Admin context
    if (isEditMode) {
      return ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA
    }
    return baseRoutes.PARENT_AREAS_EA
  }

  // EA users go directly to main area selection
  if (!isAdmin) {
    return ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
  }
  // Admin context
  if (isEditMode) {
    return ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
  }
  return baseRoutes.MAIN_AREA
}

/**
 * Clear edit session data
 * Should be called when navigating to view page or after successful update
 * @param {Object} request - Hapi request object
 */
export function clearEditSession(request) {
  const sessionKey = getAdminSessionKey()
  const sessionData = request.yar.get(sessionKey)

  if (sessionData?.editMode) {
    request.yar.set(sessionKey, undefined)
    request.server.logger.info(
      { userId: sessionData.editingUserId },
      'Cleared edit session data'
    )
  }
}

/**
 * Get edit mode context from request
 * @param {Object} request - Hapi request object
 * @returns {Object} Edit mode context
 */
export function getEditModeContext(request) {
  const encodedId = request.params?.encodedId
  const isEditMode = !!encodedId
  const isAdmin = isAdminContext(request)

  let baseRoutes
  if (isEditMode) {
    baseRoutes = ROUTES.ADMIN.ACCOUNTS.EDIT
  } else if (isAdmin) {
    baseRoutes = ROUTES.ADMIN.ACCOUNTS
  } else {
    baseRoutes = ROUTES.GENERAL.ACCOUNTS
  }

  return {
    isEditMode,
    encodedId,
    baseRoutes
  }
}
