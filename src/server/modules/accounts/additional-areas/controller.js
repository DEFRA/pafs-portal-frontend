import { getAreasByType } from '../../../common/helpers/areas/areas-helper.js'
import {
  ACCOUNT_VIEWS,
  AREAS_RESPONSIBILITIES_MAP,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey, buildGroupedAreas } from '../helpers/session-helpers.js'
import { addEditModeContext } from '../helpers/view-data-helper.js'
import {
  hasAreasChanged,
  detectChanges
} from '../helpers/edit-session-helper.js'

/**
 * Generic Additional Areas Controller
 * Handles additional area selection for EA, PSO, and RMA responsibility types
 * Works for both self-registration and admin user creation flows
 */
class AdditionalAreasController {
  async get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility, areas = [] } = sessionData
    const mainArea = areas.find((a) => a.primary)?.areaId
    const additionalAreaIds = areas
      .filter((a) => !a.primary)
      .map((a) => a.areaId)

    if (!responsibility || !mainArea) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
          : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
      )
    }

    // Get areas from request decorator
    const areasData = await request.getAreas()
    const allAreas = getAreasByType(
      areasData,
      AREAS_RESPONSIBILITIES_MAP[responsibility]
    )

    // Filter out main area from available options
    const availableAreas = allAreas.filter((area) => area.id !== mainArea)

    // Build grouped areas for PSO and RMA (hierarchical display)
    const groupedAreas = buildGroupedAreas(
      areasData,
      sessionData,
      responsibility,
      mainArea
    )

    return h.view(
      ACCOUNT_VIEWS.ADDITIONAL_AREAS,
      this.buildViewData(
        request,
        isAdmin,
        responsibility,
        availableAreas,
        additionalAreaIds,
        groupedAreas
      )
    )
  }

  /**
   * Validate session and redirect if invalid
   * @private
   */
  _validateSession(request, h, isAdmin, sessionData) {
    const { responsibility, areas = [] } = sessionData
    const mainArea = areas.find((a) => a.primary)?.areaId

    if (!responsibility || !mainArea) {
      const redirectRoute = isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
        : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
      return { valid: false, redirect: h.redirect(redirectRoute) }
    }

    return { valid: true, mainArea }
  }

  /**
   * Handle edit mode navigation
   * @private
   */
  _handleEditModeNavigation(h, sessionData, updatedSessionData) {
    const areasChanged = hasAreasChanged(updatedSessionData)
    const { hasChanges } = detectChanges(updatedSessionData)

    if (areasChanged || hasChanges) {
      return h.redirect(
        ROUTES.ADMIN.ACCOUNTS.EDIT.CHECK_ANSWERS.replace(
          '{encodedId}',
          sessionData.encodedId
        )
      )
    }

    return h.redirect(
      ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', sessionData.encodedId)
    )
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}

    // Validate session
    const validation = this._validateSession(request, h, isAdmin, sessionData)
    if (!validation.valid) return validation.redirect

    // Normalize additional areas input
    const additionalAreas = [].concat(request.payload?.additionalAreas || [])

    // Build areas array with primary flag
    const updatedAreas = [
      { areaId: validation.mainArea, primary: true },
      ...additionalAreas.map((areaId) => ({ areaId, primary: false }))
    ]

    // Store updated areas in session
    const updatedSessionData = { ...sessionData, areas: updatedAreas }
    request.yar.set(sessionKey, updatedSessionData)

    // Handle navigation based on edit mode
    if (isAdmin && sessionData.editMode) {
      return this._handleEditModeNavigation(h, sessionData, updatedSessionData)
    }

    // Regular flow - redirect to check answers
    const redirectRoute = isAdmin
      ? ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS
      : ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS
    return h.redirect(redirectRoute)
  }

  buildViewData(
    request,
    isAdmin,
    responsibility,
    availableAreas,
    additionalAreas,
    groupedAreas = null
  ) {
    const localeKey = isAdmin ? 'add_user' : 'request_account'
    const responsibilityLower = responsibility.toLowerCase()

    const viewData = {
      pageTitle: request.t(
        `accounts.areas.${responsibilityLower}.additional.title`
      ),
      isAdmin,
      responsibility: responsibilityLower,
      availableAreas,
      additionalAreas,
      groupedAreas,
      backLink: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
        : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
      submitRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS
        : ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS,
      localeKey,
      ERROR_CODES: VIEW_ERROR_CODES
    }

    return addEditModeContext(request, viewData, {
      editRoute: ROUTES.ADMIN.ACCOUNTS.EDIT.ADDITIONAL_AREAS
    })
  }
}

export { AdditionalAreasController }

const controller = new AdditionalAreasController()

export const additionalAreasController = {
  handler: (request, h) => controller.get(request, h)
}

export const additionalAreasPostController = {
  handler: (request, h) => controller.post(request, h)
}
