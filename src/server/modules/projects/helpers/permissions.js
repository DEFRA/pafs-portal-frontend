import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STATUS
} from '../../../common/constants/projects.js'
import { AREAS_RESPONSIBILITIES_MAP } from '../../../common/constants/common.js'
import {
  getSessionData,
  loggedInUserAreas,
  requiredInterventionTypesForProjectType
} from './project-utils.js'
import { getParentAreas } from '../../../common/helpers/areas/areas-helper.js'

/**
 * Pre-handler that requires user to be an RMA user
 * Only RMA users are allowed to create proposals
 * PSO users and Area users cannot create proposals
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if user is RMA, otherwise redirect to home
 */
export async function requireRmaUser(request, h) {
  // First validate and refresh token if needed
  const authResult = await requireAuth(request, h)
  if (authResult !== h.continue) {
    return authResult
  }

  // Now check if user is RMA - only RMA users can create proposals
  const session = getAuthSession(request)

  // Admins, PSO users, and Area users cannot create proposals
  if (!session?.user?.isRma) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'Non-RMA user attempted to access RMA-only route'
    )
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}

export function noEditSessionRequired(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)

  if (projectSession?.isEdit) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access non-edit route with active edit session'
    )
    return h.redirect(ROUTES.PROJECT.START).takeover()
  }

  return h.continue
}

/**
 * Validates if the user has started the project journey
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if journey started, otherwise redirect to start
 */
export async function requireJourneyStarted(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)

  if (!projectSession?.journeyStarted) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without starting a project journey'
    )
    return h.redirect(ROUTES.PROJECT.START).takeover()
  }
  return h.continue
}

/**
 * Validates if the project name has been set
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if name set, otherwise redirect to name step
 */
export async function requireProjectNameSet(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)

  if (!projectSession?.name) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without setting project name'
    )
    return h.redirect(ROUTES.PROJECT.NAME).takeover()
  }
  return h.continue
}

/**
 * Validates if the project area has been set
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if area set, otherwise redirect to area or name step
 */
export async function requireProjectAreaSet(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)

  if (!projectSession?.areaId) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without setting project area'
    )
    const loggedInUserAreasArray = loggedInUserAreas(request)
    if (loggedInUserAreasArray.length > 1) {
      return h.redirect(ROUTES.PROJECT.AREA).takeover()
    } else {
      return h.redirect(ROUTES.PROJECT.NAME).takeover()
    }
  }
  return h.continue
}

/**
 * Validates if the project type has been set
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if type set, otherwise redirect to type step
 */
export async function requireProjectTypeSet(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)
  const { projectType } = projectSession

  if (!projectType) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without setting project type'
    )
    return h.redirect(ROUTES.PROJECT.TYPE).takeover()
  }

  return h.continue
}

/**
 * Validates if intervention types have been set (when required for project type)
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if intervention types set or not required, otherwise redirect to intervention type step
 */
export async function requireInterventionTypesSet(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)
  const { projectType, interventionTypes } = projectSession
  const requiredInterventionTypes =
    requiredInterventionTypesForProjectType(projectType)

  if (
    projectType &&
    requiredInterventionTypes &&
    interventionTypes?.length === 0
  ) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without setting intervention types'
    )
    return h.redirect(ROUTES.PROJECT.INTERVENTION_TYPE).takeover()
  }

  return h.continue
}

/**
 * Validates if primary intervention type has been set (when required for project type)
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if primary intervention type set or not required, otherwise redirect to primary intervention type step
 */
export async function requirePrimaryInterventionTypeSet(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)
  const { projectType, projectInterventionTypes } = projectSession
  const requiredInterventionTypes =
    requiredInterventionTypesForProjectType(projectType)

  if (projectType && requiredInterventionTypes && !projectInterventionTypes) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without setting primary intervention type'
    )
    return h.redirect(ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE).takeover()
  }

  return h.continue
}

/**
 * Validates if financial start year has been set
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if financial start year set, otherwise redirect to financial start year step
 */
export async function requireFinancialStartYearSet(request, h) {
  const projectSession = getSessionData(request)
  const session = getAuthSession(request)
  const { financialStartYear } = projectSession

  if (!financialStartYear) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'User attempted to access project step without setting financial start year'
    )
    return h.redirect(ROUTES.PROJECT.FINANCIAL_START_YEAR).takeover()
  }

  return h.continue
}

// ============================================================================
// PROJECT VIEW AND EDIT PERMISSIONS
// ============================================================================

/**
 * Check if user has access to a specific area
 * @param {Array} userAreas - User's areas array
 * @param {string|number} targetAreaId - Area ID to check
 * @returns {boolean} True if user has access
 */
function hasAccessToArea(userAreas, targetAreaId) {
  if (!userAreas || userAreas.length === 0) {
    return false
  }

  const targetId = String(targetAreaId)
  return userAreas.some((area) => String(area.areaId) === targetId)
}

/**
 * Check if user has access to any parent areas of a specific type
 * Uses areas-helper getParentAreas to traverse hierarchy
 * @param {Object} request - Hapi request object
 * @param {Array} userAreas - User's areas array
 * @param {string|number} projectAreaId - The project's area ID
 * @param {string} parentType - Parent type to check (from AREAS_RESPONSIBILITIES_MAP)
 * @returns {boolean} True if user has access to any parent of specified type
 */
function hasAccessToParentOfType(
  request,
  userAreas,
  projectAreaId,
  parentType
) {
  const areasByType = request.server.app.areasByType
  if (!areasByType) {
    return false
  }

  // Get all parent areas of the specified type
  const parentAreas = getParentAreas(areasByType, projectAreaId, parentType)

  // Check if user has access to any of these parent areas
  return parentAreas.some((parent) => hasAccessToArea(userAreas, parent.id))
}

/**
 * Determine if logged-in user can view a project proposal
 * View permissions:
 * - Admin: always allowed
 * - RMA: project area must be in user's assigned areas
 * - PSO: user must have access to PSO area (parent of project area)
 * - EA: user must have access to EA area (grandparent of project area)
 *
 * @param {Object} request - Hapi request object
 * @param {Object} proposal - The project proposal object with areaId and status
 * @returns {boolean} True if user can view the proposal
 */
export function canViewProposal(request, proposal) {
  const session = getAuthSession(request)
  const user = session?.user

  if (!user || !proposal) {
    return false
  }

  // Admin can view any proposal
  if (user.isAdmin) {
    return true
  }

  const userAreas = user.areas || []
  const projectAreaId = proposal.areaId

  // RMA: Check if project area is in user's areas
  if (user.isRma) {
    return hasAccessToArea(userAreas, projectAreaId)
  }

  // PSO: Check if user has access to parent PSO area
  if (user.isPso) {
    return hasAccessToParentOfType(
      request,
      userAreas,
      projectAreaId,
      AREAS_RESPONSIBILITIES_MAP.PSO
    )
  }

  // EA: Check if user has access to grandparent EA area
  if (user.isEa) {
    return hasAccessToParentOfType(
      request,
      userAreas,
      projectAreaId,
      AREAS_RESPONSIBILITIES_MAP.EA
    )
  }

  return false
}

/**
 * Determine if logged-in user can edit a project proposal
 * Edit permissions (more restrictive - only DRAFT status):
 * - Only when proposal status is DRAFT
 * - Admin: always allowed
 * - RMA: project area must be in user's assigned areas
 * - PSO: user must have access to PSO area (parent of project area)
 * - EA: NOT allowed to edit
 *
 * @param {Object} request - Hapi request object
 * @param {Object} proposal - The project proposal object with areaId and status
 * @returns {boolean} True if user can edit the proposal
 */
export function canEditProposal(request, proposal) {
  const session = getAuthSession(request)
  const user = session?.user

  if (!user || !proposal) {
    return false
  }

  // Only DRAFT proposals can be edited
  if (proposal[PROJECT_PAYLOAD_FIELDS.PROJECT_STATE] !== PROJECT_STATUS.DRAFT) {
    return false
  }

  // Admin can edit any DRAFT proposal
  if (user.isAdmin) {
    return true
  }

  const userAreas = user.areas || []
  const projectAreaId = proposal[PROJECT_PAYLOAD_FIELDS.AREA_ID]

  // RMA: Check if project area is in user's areas
  if (user.isRma) {
    return hasAccessToArea(userAreas, projectAreaId)
  }

  // PSO: Check if user has access to parent PSO area
  if (user.isPso) {
    return hasAccessToParentOfType(
      request,
      userAreas,
      projectAreaId,
      AREAS_RESPONSIBILITIES_MAP.PSO
    )
  }

  // EA users cannot edit proposals
  return false
}

/**
 * Pre-handler that requires user to have view permissions for a proposal
 * Expects request.pre.projectData (set by fetchProjectForEdit or similar pre-handler)
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if allowed, otherwise redirect or error
 */
export async function requireViewPermission(request, h) {
  const session = getAuthSession(request)
  const projectData = request.pre?.projectData

  if (!projectData) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'Project data not found for view permission check'
    )
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  if (!canViewProposal(request, projectData)) {
    request.server?.logger?.warn(
      { userId: session?.user?.id, projectId: projectData.id },
      'User does not have permission to view this project'
    )
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}

/**
 * Pre-handler that requires user to have edit permissions for a proposal
 * Expects request.pre.projectData (set by fetchProjectForEdit or similar pre-handler)
 *
 * @param {Object} request - Hapi request object
 * @param {Object} h - Hapi response toolkit
 * @returns {Object} h.continue if allowed, otherwise redirect or error
 */
export async function requireEditPermission(request, h) {
  const session = getAuthSession(request)
  const projectData = request.pre?.projectData

  if (!projectData) {
    request.server?.logger?.warn(
      { userId: session?.user?.id },
      'Project data not found for edit permission check'
    )
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  if (!canEditProposal(request, projectData)) {
    request.server?.logger?.warn(
      {
        userId: session?.user?.id,
        projectId: projectData.id,
        projectStatus: projectData[PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]
      },
      'User does not have permission to edit this project'
    )
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}
