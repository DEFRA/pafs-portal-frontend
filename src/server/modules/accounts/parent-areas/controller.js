import {
  ACCOUNT_VIEWS,
  AREAS_RESPONSIBILITIES_MAP,
  RESPONSIBILITY_MAP,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { buildGroupedAreas, getSessionKey } from '../helpers/session-helpers.js'
import {
  getAreasByType,
  findAreaById,
  getParentAreas
} from '../../../common/helpers/areas/areas-helper.js'
import Joi from 'joi'
import { addEditModeContext } from '../helpers/view-data-helper.js'
import { getEditModeContext } from '../helpers/navigation-helper.js'

// Workflow configuration for responsibility-parentType combinations
const WORKFLOW_CONFIG = {
  [`${RESPONSIBILITY_MAP.PSO}-${RESPONSIBILITY_MAP.EA}`]: {
    nextRoute: 'MAIN_AREA',
    backRoute: 'DETAILS',
    translationKey: 'pso.ea_areas'
  },
  [`${RESPONSIBILITY_MAP.RMA}-${RESPONSIBILITY_MAP.EA}`]: {
    nextRoute: 'PARENT_AREAS',
    nextRouteParams: { type: 'pso' },
    backRoute: 'DETAILS',
    translationKey: 'rma.ea_areas'
  },
  [`${RESPONSIBILITY_MAP.RMA}-${RESPONSIBILITY_MAP.PSO}`]: {
    nextRoute: 'MAIN_AREA',
    backRoute: 'PARENT_AREAS',
    backRouteParams: { type: 'ea' },
    translationKey: 'rma.pso_areas'
  }
}

/**
 * Parent Areas Selection Controller
 * Generic controller for selecting parent areas (EA for PSO/RMA, PSO for RMA)
 * Reverse engineers selections from main/additional areas when coming back from check-answers
 */
class ParentAreasController {
  /**
   * Get workflow configuration for responsibility-parentType combination
   * @private
   */
  _getWorkflowConfig(responsibility, parentType) {
    return WORKFLOW_CONFIG[`${responsibility}-${parentType}`] || null
  }

  /**
   * Get route based on admin context
   * @private
   */
  _getRoute(isAdmin, routeKey, params = {}) {
    const base = isAdmin ? ROUTES.ADMIN.ACCOUNTS : ROUTES.GENERAL.ACCOUNTS
    let route = base[routeKey]

    // Replace route parameters
    Object.entries(params).forEach(([key, value]) => {
      route = route.replace(`{${key}}`, value)
    })

    return route
  }

  /**
   * Extract and validate request context
   * @private
   */
  _extractRequestContext(request) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility, areas = [] } = sessionData
    const parentType = this.getParentType(request.params.type)

    return {
      isAdmin,
      sessionKey,
      sessionData,
      responsibility,
      areas,
      parentType
    }
  }

  /**
   * Get parent areas data and selected IDs
   * @private
   */
  async _getParentAreasData(request, context) {
    const areasData = await request.getAreas()
    const parentAreas = getAreasByType(
      areasData,
      AREAS_RESPONSIBILITIES_MAP[context.parentType.toUpperCase()]
    )

    const tempKey = `${context.parentType.toLowerCase()}Areas`
    let selectedParentIds = context.sessionData[tempKey] || []

    if (selectedParentIds.length === 0) {
      selectedParentIds = this.reverseEngineerParentAreas(
        areasData,
        context.areas,
        context.parentType,
        context.responsibility
      )
    }

    return { areasData, parentAreas, selectedParentIds }
  }
  async get(request, h) {
    const context = this._extractRequestContext(request)

    // Validate responsibility and parent type combination
    if (!this.isValidCombination(context.responsibility, context.parentType)) {
      return h.redirect(this._getRoute(context.isAdmin, 'DETAILS'))
    }

    // Get parent areas data
    const { areasData, parentAreas, selectedParentIds } =
      await this._getParentAreasData(request, context)

    // Build grouped parent areas for RMA selecting PSO
    const groupedParentAreas =
      context.parentType === RESPONSIBILITY_MAP.PSO
        ? buildGroupedAreas(
            areasData,
            context.sessionData,
            RESPONSIBILITY_MAP.PSO
          )
        : null

    return h.view(
      ACCOUNT_VIEWS.PARENT_AREAS,
      this.buildViewData(request, {
        isAdmin: context.isAdmin,
        responsibility: context.responsibility,
        parentType: context.parentType,
        parentAreas,
        selectedAreas: selectedParentIds,
        groupedParentAreas
      })
    )
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility } = sessionData
    const parentType = this.getParentType(request.params.type)
    const { parentAreas: selectedAreas = [] } = request.payload
    const editModeContext = getEditModeContext(request)

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

      const groupedParentAreas =
        parentType === RESPONSIBILITY_MAP.PSO
          ? buildGroupedAreas(areasData, sessionData, RESPONSIBILITY_MAP.PSO)
          : null

      return h.view(
        ACCOUNT_VIEWS.PARENT_AREAS,
        this.buildViewData(request, {
          isAdmin,
          responsibility,
          parentType,
          parentAreas,
          selectedAreas: normalizedAreas,
          groupedParentAreas,
          hasError: true
        })
      )
    }

    // Store temporary parent selection (will be discarded, only used for filtering)
    const tempKey = `${parentType.toLowerCase()}Areas`
    request.yar.set(sessionKey, {
      ...sessionData,
      [tempKey]: normalizedAreas
    })

    // Redirect to next step based on responsibility
    return h.redirect(
      this.getNextRoute(isAdmin, responsibility, parentType, editModeContext)
    )
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
    const targetAreaType = this.getTargetAreaType(responsibility, parentType)

    if (!targetAreaType) {
      return []
    }

    selectedAreas.forEach((areaObj) => {
      const area = findAreaById(areasData, areaObj.areaId)
      if (!area) {
        return
      }

      const parents = getParentAreas(areasData, area.id, targetAreaType)
      parents.forEach((p) => parentIds.add(p.id))
    })

    return Array.from(parentIds)
  }

  getTargetAreaType(responsibility, parentType) {
    const typeMap = {
      [`${RESPONSIBILITY_MAP.PSO}-${RESPONSIBILITY_MAP.EA}`]:
        AREAS_RESPONSIBILITIES_MAP.EA,
      [`${RESPONSIBILITY_MAP.RMA}-${RESPONSIBILITY_MAP.EA}`]:
        AREAS_RESPONSIBILITIES_MAP.EA,
      [`${RESPONSIBILITY_MAP.RMA}-${RESPONSIBILITY_MAP.PSO}`]:
        AREAS_RESPONSIBILITIES_MAP.PSO
    }
    return typeMap[`${responsibility}-${parentType}`] || null
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

  getNextRoute(isAdmin, responsibility, parentType, editModeContext) {
    const routeKey = this.getNextRouteKey(responsibility, parentType)
    return this.buildRoute(isAdmin, routeKey, editModeContext)
  }

  getNextRouteKey(responsibility, parentType) {
    // PSO selecting EA → go to PSO main area
    if (
      responsibility === RESPONSIBILITY_MAP.PSO &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      return 'MAIN_AREA'
    }

    // RMA selecting EA → go to RMA PSO areas selection
    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      return 'PARENT_AREAS_PSO'
    }

    // RMA selecting PSO → go to RMA main area
    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.PSO
    ) {
      return 'MAIN_AREA'
    }

    return 'DETAILS'
  }

  buildRoute(isAdmin, routeKey, editModeContext) {
    const { isEditMode, encodedId, baseRoutes } = editModeContext
    if (isEditMode) {
      return baseRoutes[routeKey]
        .replace('{encodedId}', encodedId)
        .replace('{type}', RESPONSIBILITY_MAP.PSO.toLowerCase())
    }
    return isAdmin
      ? ROUTES.ADMIN.ACCOUNTS[routeKey]
      : ROUTES.GENERAL.ACCOUNTS[routeKey]
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

  buildViewData(request, context) {
    const {
      isAdmin,
      responsibility,
      parentType,
      parentAreas,
      selectedAreas = [],
      groupedParentAreas = null,
      hasError = false
    } = context

    const localeKey = isAdmin ? 'add_user' : 'request_account'
    const responsibilityLower = responsibility.toLowerCase()
    const translationBase = this.getTranslationBase(responsibility, parentType)

    const viewData = {
      pageTitle: request.t(`${translationBase}.title`),
      isAdmin,
      responsibility: responsibilityLower,
      parentType,
      parentAreas,
      selectedAreas,
      groupedParentAreas,
      hasError,
      backLink: this.getBackLink(isAdmin, responsibility, parentType),
      submitRoute: this.getSubmitRoute(isAdmin, parentType),
      localeKey,
      translationBase,
      ERROR_CODES: VIEW_ERROR_CODES
    }

    const editRouteMap = {
      ea: ROUTES.ADMIN.ACCOUNTS.EDIT.PARENT_AREAS_EA,
      pso: ROUTES.ADMIN.ACCOUNTS.EDIT.PARENT_AREAS_PSO
    }

    return addEditModeContext(request, viewData, {
      editRoute: editRouteMap[parentType.toLowerCase()]
    })
  }

  getSubmitRoute(isAdmin, parentType) {
    const typeParam = parentType.toLowerCase()
    return isAdmin
      ? `${ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS}/${typeParam}`
      : `${ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS}/${typeParam}`
  }

  getTranslationBase(responsibility, parentType) {
    if (
      responsibility === RESPONSIBILITY_MAP.PSO &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      return 'accounts.areas.pso.ea_areas'
    }

    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.EA
    ) {
      return 'accounts.areas.rma.ea_areas'
    }

    if (
      responsibility === RESPONSIBILITY_MAP.RMA &&
      parentType === RESPONSIBILITY_MAP.PSO
    ) {
      return 'accounts.areas.rma.pso_areas'
    }

    return 'accounts.areas.default'
  }
}

const controller = new ParentAreasController()

export const parentAreasController = {
  handler: (request, h) => controller.get(request, h)
}

export const parentAreasPostController = {
  handler: (request, h) => controller.post(request, h)
}
