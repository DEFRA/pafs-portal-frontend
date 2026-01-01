import {
  ACCOUNT_SESSION_KEYS,
  AREAS_RESPONSIBILITIES_MAP,
  RESPONSIBILITY_MAP
} from '../../common/constants/common.js'
import { ROUTES } from '../../common/constants/routes.js'
import { getAuthSession } from '../../common/helpers/auth/session-manager.js'
import { getAreasByType } from '../../common/helpers/areas/areas-helper.js'

/**
 * Get the session key for admin user creation
 * @returns {string} The admin session key
 */
export function getAdminSessionKey() {
  return ACCOUNT_SESSION_KEYS.ADMIN_USER_CREATION
}

/**
 * Get the session key for self-registration
 * @returns {string} The self-registration session key
 */
export function getSelfRegistrationSessionKey() {
  return ACCOUNT_SESSION_KEYS.SELF_REGISTRATION
}

export function getSessionKey(isAdmin) {
  return isAdmin ? getAdminSessionKey() : getSelfRegistrationSessionKey()
}

export function requireJourneyStarted(isAdmin) {
  return function (request, h) {
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey)

    // If no session data exists or journey not started, redirect to start page
    if (!sessionData?.journeyStarted) {
      const startRoute = isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.START
        : ROUTES.GENERAL.ACCOUNTS.START
      return h.redirect(startRoute).takeover()
    }

    return h.continue
  }
}

export function requireNotAuthenticated(request, h) {
  const session = getAuthSession(request)

  // If user is logged in, redirect to home
  if (session?.user) {
    if (session.user?.admin) {
      return h.redirect(ROUTES.ADMIN.JOURNEY_SELECTION).takeover()
    }
    return h.redirect(ROUTES.GENERAL.HOME).takeover()
  }

  return h.continue
}

export function buildGroupedAreas(
  masterAreas,
  sessionData,
  responsibility,
  excludeAreaId = null
) {
  // EA users don't need grouping (top-level areas)
  if (responsibility === RESPONSIBILITY_MAP.EA) {
    return null
  }

  // PSO: group by EA parent areas
  if (responsibility === RESPONSIBILITY_MAP.PSO) {
    const selectedEaAreas = sessionData.eaAreas || []
    if (selectedEaAreas.length === 0) {
      return null
    }

    const eaAreas = getAreasByType(masterAreas, AREAS_RESPONSIBILITIES_MAP.EA)
    const psoAreas = getAreasByType(masterAreas, AREAS_RESPONSIBILITIES_MAP.PSO)

    return eaAreas
      .filter((ea) => selectedEaAreas.includes(ea.id))
      .map((ea) => ({
        parent: ea,
        children: psoAreas.filter(
          (pso) =>
            pso.parent_id === ea.id &&
            (!excludeAreaId || pso.id !== excludeAreaId)
        )
      }))
      .filter((group) => group.children.length > 0)
  }

  // RMA: group by EA > PSO parent hierarchy
  if (responsibility === RESPONSIBILITY_MAP.RMA) {
    const selectedPsoAreas = sessionData.psoAreas || []
    if (selectedPsoAreas.length === 0) {
      return null
    }

    const eaAreas = getAreasByType(masterAreas, AREAS_RESPONSIBILITIES_MAP.EA)
    const psoAreas = getAreasByType(masterAreas, AREAS_RESPONSIBILITIES_MAP.PSO)
    const rmaAreas = getAreasByType(masterAreas, AREAS_RESPONSIBILITIES_MAP.RMA)

    const groups = []

    psoAreas
      .filter((pso) => selectedPsoAreas.includes(pso.id))
      .forEach((pso) => {
        const eaParent = eaAreas.find((ea) => ea.id === pso.parent_id)
        const children = rmaAreas.filter(
          (rma) =>
            rma.parent_id === pso.id &&
            (!excludeAreaId || rma.id !== excludeAreaId)
        )

        if (eaParent && children.length > 0) {
          groups.push({
            parent: pso,
            eaParent,
            children
          })
        }
      })

    return groups
  }

  return null
}
