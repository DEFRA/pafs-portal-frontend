import {
  ACCOUNT_VIEWS,
  AREAS_RESPONSIBILITIES_MAP,
  RESPONSIBILITY_MAP,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'
import {
  getAreasByType,
  findAreaById,
  getParentAreas
} from '../../../common/helpers/areas/areas-helper.js'
import Joi from 'joi'

/**
 * Parent Areas Selection Controller
 * Generic controller for selecting parent areas (EA for PSO/RMA, PSO for RMA)
 * Reverse engineers selections from main/additional areas when coming back from check-answers
 */
class ParentAreasController {
  async get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility, areas = [] } = sessionData
    const parentType = this.getParentType(request.params.type)

    // Validate responsibility and parent type combination
    if (!this.isValidCombination(responsibility, parentType)) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.DETAILS
          : ROUTES.GENERAL.ACCOUNTS.DETAILS
      )
    }

    // Get all areas of the parent type
    const areasData = await request.getAreas()
    const parentAreas = getAreasByType(
      areasData,
      AREAS_RESPONSIBILITIES_MAP[parentType.toUpperCase()]
    )

    // Get selected parent areas from session or reverse engineer from main/additional areas
    const tempKey = `${parentType.toLowerCase()}Areas`
    let selectedParentIds = sessionData[tempKey] || []

    // If no parent areas in session, reverse engineer from main/additional areas
    if (selectedParentIds.length === 0) {
      selectedParentIds = this.reverseEngineerParentAreas(
        areasData,
        areas,
        parentType,
        responsibility
      )
    }

    // Build grouped parent areas for RMA selecting PSO
    const groupedParentAreas = this.buildGroupedParentAreas(
      areasData,
      sessionData,
      responsibility,
      parentType
    )

    return h.view(
      ACCOUNT_VIEWS.PARENT_AREAS,
      this.buildViewData(
        request,
        isAdmin,
        responsibility,
        parentType,
        parentAreas,
        selectedParentIds,
        groupedParentAreas
      )
    )
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility } = sessionData
    const parentType = this.getParentType(request.params.type)
    const { parentAreas: selectedAreas = [] } = request.payload

    // Validate at least one parent area selected
    const schema = Joi.object({
      parentAreas: Joi.array().min(1).required()
    })

    const normalizedAreas = Array.isArray(selectedAreas)
      ? selectedAreas
      : [selectedAreas]
    const { error } = schema.validate({ parentAreas: normalizedAreas })

    if (error) {
      const areasData = await request.getAreas()
      const parentAreas = getAreasByType(
        areasData,
        AREAS_RESPONSIBILITIES_MAP[parentType.toUpperCase()]
      )
      const groupedParentAreas = this.buildGroupedParentAreas(
        areasData,
        sessionData,
        responsibility,
        parentType
      )

      return h.view(
        ACCOUNT_VIEWS.PARENT_AREAS,
        this.buildViewData(
          request,
          isAdmin,
          responsibility,
          parentType,
          parentAreas,
          [],
          groupedParentAreas,
          { hasError: true }
        )
      )
    }

    // Store temporary parent selection (will be discarded, only used for filtering)
    const tempKey = `${parentType.toLowerCase()}Areas`
    request.yar.set(sessionKey, {
      ...sessionData,
      [tempKey]: normalizedAreas
    })

    // Redirect to next step based on responsibility
    return h.redirect(this.getNextRoute(isAdmin, responsibility, parentType))
  }

  /**
   * Reverse engineer parent areas from selected main/additional areas
   */
  reverseEngineerParentAreas(
    areasData,
    selectedAreas,
    parentType,
    responsibility
  ) {
    if (!selectedAreas || selectedAreas.length === 0) {
      return []
    }

    const parentIds = new Set()

    selectedAreas.forEach((areaObj) => {
      const area = findAreaById(areasData, areaObj.areaId)
      if (!area) return

      // Get parent hierarchy based on responsibility and parent type
      if (
        responsibility === RESPONSIBILITY_MAP.PSO &&
        parentType === RESPONSIBILITY_MAP.EA
      ) {
        // For PSO selecting EA: get EA parent of PSO area
        const parents = getParentAreas(
          areasData,
          area.id,
          AREAS_RESPONSIBILITIES_MAP.EA
        )
        parents.forEach((p) => parentIds.add(p.id))
      } else if (
        responsibility === RESPONSIBILITY_MAP.RMA &&
        parentType === RESPONSIBILITY_MAP.EA
      ) {
        // For RMA selecting EA: get EA parent of RMA area
        const parents = getParentAreas(
          areasData,
          area.id,
          AREAS_RESPONSIBILITIES_MAP.EA
        )
        parents.forEach((p) => parentIds.add(p.id))
      } else if (
        responsibility === RESPONSIBILITY_MAP.RMA &&
        parentType === RESPONSIBILITY_MAP.PSO
      ) {
        // For RMA selecting PSO: get PSO parent of RMA area
        const parents = getParentAreas(
          areasData,
          area.id,
          AREAS_RESPONSIBILITIES_MAP.PSO
        )
        parents.forEach((p) => parentIds.add(p.id))
      }
    })

    return Array.from(parentIds)
  }

  getParentType(urlParam) {
    const typeMap = {
      ea: RESPONSIBILITY_MAP.EA,
      pso: RESPONSIBILITY_MAP.PSO
    }
    return typeMap[urlParam?.toLowerCase()] || RESPONSIBILITY_MAP.EA
  }

  isValidCombination(responsibility, parentType) {
    const validCombinations = [
      [RESPONSIBILITY_MAP.PSO, RESPONSIBILITY_MAP.EA],
      [RESPONSIBILITY_MAP.RMA, RESPONSIBILITY_MAP.EA],
      [RESPONSIBILITY_MAP.RMA, RESPONSIBILITY_MAP.PSO]
    ]

    return validCombinations.some(
      ([resp, parent]) => responsibility === resp && parentType === parent
    )
  }

  getNextRoute(isAdmin, responsibility, parentType) {
    // PSO selecting EA → go to PSO main area
    if (
      responsibility === RESPONSIBILITY_MAP.PSO &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
        : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
    }

    // RMA selecting EA → go to RMA PSO areas selection
    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_PSO
        : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_PSO
    }

    // RMA selecting PSO → go to RMA main area
    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.PSO
    ) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
        : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
    }

    // Default fallback
    return isAdmin
      ? ROUTES.ADMIN.ACCOUNTS.DETAILS
      : ROUTES.GENERAL.ACCOUNTS.DETAILS
  }

  getBackLink(isAdmin, responsibility, parentType) {
    // First parent selection goes back to details
    if (
      (responsibility === RESPONSIBILITY_MAP.PSO &&
        parentType === RESPONSIBILITY_MAP.EA) ||
      (responsibility === RESPONSIBILITY_MAP.RMA &&
        parentType === RESPONSIBILITY_MAP.EA)
    ) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.DETAILS
        : ROUTES.GENERAL.ACCOUNTS.DETAILS
    }

    // RMA PSO selection goes back to RMA EA selection
    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.PSO
    ) {
      return isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA
        : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_EA
    }

    return isAdmin
      ? ROUTES.ADMIN.ACCOUNTS.DETAILS
      : ROUTES.GENERAL.ACCOUNTS.DETAILS
  }

  /**
   * Build grouped parent areas for hierarchical display
   * RMA selecting PSO: grouped by EA parent
   */
  buildGroupedParentAreas(
    masterAreas,
    sessionData,
    responsibility,
    parentType
  ) {
    // Only RMA selecting PSO needs grouping
    if (
      responsibility !== RESPONSIBILITY_MAP.RMA ||
      parentType !== RESPONSIBILITY_MAP.PSO
    ) {
      return null
    }

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
        children: psoAreas.filter((pso) => pso.parent_id === ea.id)
      }))
      .filter((group) => group.children.length > 0)
  }

  buildViewData(
    request,
    isAdmin,
    responsibility,
    parentType,
    parentAreas,
    selectedAreas = [],
    groupedParentAreas = null,
    options = {}
  ) {
    const { hasError = false } = options
    const localeKey = isAdmin ? 'add_user' : 'request_account'
    const responsibilityLower = responsibility.toLowerCase()

    // Determine which translation keys to use
    let translationBase
    if (
      responsibility === RESPONSIBILITY_MAP.PSO &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      translationBase = 'accounts.areas.pso.ea_areas'
    } else if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      translationBase = 'accounts.areas.rma.ea_areas'
    } else if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.PSO
    ) {
      translationBase = 'accounts.areas.rma.pso_areas'
    }

    return {
      pageTitle: request.t(`${translationBase}.title`),
      isAdmin,
      responsibility: responsibilityLower,
      parentType,
      parentAreas,
      selectedAreas,
      groupedParentAreas,
      hasError,
      backLink: this.getBackLink(isAdmin, responsibility, parentType),
      submitRoute: isAdmin
        ? `${ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS}/${parentType.toLowerCase()}`
        : `${ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS}/${parentType.toLowerCase()}`,
      localeKey,
      translationBase,
      ERROR_CODES: VIEW_ERROR_CODES
    }
  }
}

const controller = new ParentAreasController()

export const parentAreasController = {
  handler: (request, h) => controller.get(request, h)
}

export const parentAreasPostController = {
  handler: (request, h) => controller.post(request, h)
}
