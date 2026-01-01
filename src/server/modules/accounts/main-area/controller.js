import {
  getAreasByType,
  findAreaById
} from '../../../common/helpers/areas/areas-helper.js'
import {
  ACCOUNT_VIEWS,
  AREAS_RESPONSIBILITIES_MAP,
  RESPONSIBILITY_MAP,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { mainAreaSchema } from '../schema.js'

/**
 * Generic Main Area Controller
 * Handles main area selection for EA, PSO, and RMA responsibility types
 * Works for both self-registration and admin user creation flows
 */
class MainAreaController {
  async get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility, areas = [] } = sessionData
    const mainArea = areas.find((a) => a.primary)?.areaId

    if (!responsibility) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.DETAILS
          : ROUTES.GENERAL.ACCOUNTS.DETAILS
      )
    }

    // Get areas from request decorator
    const masterAreas = await request.getAreas()
    const availableAreas = getAreasByType(
      masterAreas,
      AREAS_RESPONSIBILITIES_MAP[responsibility]
    )

    // Build grouped areas for PSO and RMA (hierarchical display)
    const groupedAreas = this.buildGroupedAreas(
      masterAreas,
      sessionData,
      responsibility
    )

    return h.view(
      ACCOUNT_VIEWS.MAIN_AREA,
      this.buildViewData(
        request,
        isAdmin,
        responsibility,
        availableAreas,
        mainArea,
        groupedAreas
      )
    )
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility } = sessionData
    const { mainArea } = request.payload || {}

    if (!responsibility) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.DETAILS
          : ROUTES.GENERAL.ACCOUNTS.DETAILS
      )
    }

    // Validate main area selection
    const { error } = mainAreaSchema.validate(
      { mainArea },
      { abortEarly: false }
    )

    if (error) {
      const areas = await request.getAreas()
      const availableAreas = getAreasByType(
        areas,
        AREAS_RESPONSIBILITIES_MAP[responsibility]
      )
      const groupedAreas = this.buildGroupedAreas(
        areas,
        sessionData,
        responsibility
      )

      return h.view(
        ACCOUNT_VIEWS.MAIN_AREA,
        this.buildViewData(
          request,
          isAdmin,
          responsibility,
          availableAreas,
          mainArea,
          groupedAreas,
          {
            fieldErrors: extractJoiErrors(error)
          }
        )
      )
    }

    // Store main area as areas array with primary flag
    // Preserve any existing additional areas (non-primary) that are still valid
    const areasData = await request.getAreas()
    const validAreaType = AREAS_RESPONSIBILITIES_MAP[responsibility]

    const existingAdditionalAreas = (sessionData.areas || [])
      .filter((a) => !a.primary)
      .filter((a) => {
        // Exclude if it's the same as the new main area
        if (a.areaId === mainArea) {
          return false
        }
        // Validate that the area still exists and is of the correct type
        const areaDetails = findAreaById(areasData, a.areaId)
        return areaDetails && areaDetails.area_type === validAreaType
      })

    const areas = [
      {
        areaId: mainArea,
        primary: true
      },
      ...existingAdditionalAreas
    ]
    request.yar.set(sessionKey, { ...sessionData, areas })

    // Redirect to additional areas
    return h.redirect(
      isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS
        : ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS
    )
  }

  /**
   * Build grouped areas for hierarchical display
   * PSO: grouped by EA parent
   * RMA: grouped by EA > PSO parent hierarchy
   */
  buildGroupedAreas(masterAreas, sessionData, responsibility) {
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
      const psoAreas = getAreasByType(
        masterAreas,
        AREAS_RESPONSIBILITIES_MAP.PSO
      )

      return eaAreas
        .filter((ea) => selectedEaAreas.includes(ea.id))
        .map((ea) => ({
          parent: ea,
          children: psoAreas.filter((pso) => pso.parent_id === ea.id)
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
      const psoAreas = getAreasByType(
        masterAreas,
        AREAS_RESPONSIBILITIES_MAP.PSO
      )
      const rmaAreas = getAreasByType(
        masterAreas,
        AREAS_RESPONSIBILITIES_MAP.RMA
      )

      const groups = []

      psoAreas
        .filter((pso) => selectedPsoAreas.includes(pso.id))
        .forEach((pso) => {
          const eaParent = eaAreas.find((ea) => ea.id === pso.parent_id)
          const children = rmaAreas.filter((rma) => rma.parent_id === pso.id)

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

  getBackLink(isAdmin, responsibility) {
    // EA users go back to details
    if (responsibility === RESPONSIBILITY_MAP.EA) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.DETAILS
        : ROUTES.GENERAL.ACCOUNTS.DETAILS
    }

    // PSO users go back to EA parent areas selection
    if (responsibility === RESPONSIBILITY_MAP.PSO) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA
        : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_EA
    }

    // RMA users go back to PSO parent areas selection
    if (responsibility === RESPONSIBILITY_MAP.RMA) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_PSO
        : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_PSO
    }

    // Default fallback
    return isAdmin
      ? ROUTES.ADMIN.ACCOUNTS.DETAILS
      : ROUTES.GENERAL.ACCOUNTS.DETAILS
  }

  buildViewData(
    request,
    isAdmin,
    responsibility,
    availableAreas,
    mainArea,
    groupedAreas = null,
    options = {}
  ) {
    const { fieldErrors = {} } = options
    const localeKey = isAdmin ? 'add_user' : 'request_account'
    const responsibilityLower = responsibility.toLowerCase()

    return {
      pageTitle: request.t(`accounts.areas.${responsibilityLower}.main.title`),
      isAdmin,
      responsibility: responsibilityLower,
      availableAreas,
      groupedAreas,
      mainArea,
      fieldErrors,
      backLink: this.getBackLink(isAdmin, responsibility),
      submitRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
        : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
      localeKey,
      ERROR_CODES: VIEW_ERROR_CODES
    }
  }
}

const controller = new MainAreaController()

export const mainAreaController = {
  handler: (request, h) => controller.get(request, h)
}

export const mainAreaPostController = {
  handler: (request, h) => controller.post(request, h)
}
