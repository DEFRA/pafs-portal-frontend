import { getAreasByType } from '../../../common/helpers/areas/areas-helper.js'
import {
  ACCOUNT_VIEWS,
  AREAS_RESPONSIBILITIES_MAP,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey, buildGroupedAreas } from '../helpers.js'

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

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility, areas = [] } = sessionData
    const mainArea = areas.find((a) => a.primary)?.areaId

    if (!responsibility || !mainArea) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
          : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
      )
    }

    // Get additional areas from payload (can be empty array)
    let { additionalAreas } = request.payload || {}

    // Normalize to array
    if (!additionalAreas) {
      additionalAreas = []
    }

    if (!Array.isArray(additionalAreas)) {
      additionalAreas = [additionalAreas]
    }

    // Build areas array with primary flag
    const updatedAreas = [
      { areaId: mainArea, primary: true },
      ...additionalAreas.map((areaId) => ({ areaId, primary: false }))
    ]

    // Store updated areas in session
    request.yar.set(sessionKey, { ...sessionData, areas: updatedAreas })

    // Redirect to check answers
    return h.redirect(
      isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS
        : ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS
    )
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

    return {
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
