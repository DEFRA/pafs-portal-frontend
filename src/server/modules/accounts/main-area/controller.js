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
import { getSessionKey, buildGroupedAreas } from '../helpers/session-helpers.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { mainAreaSchema } from '../schema.js'
import { addEditModeContext } from '../helpers/view-data-helper.js'
import { getEditModeContext } from '../helpers/navigation-helper.js'

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
    const groupedAreas = buildGroupedAreas(
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

  /**
   * Validate main area selection and render error view if invalid
   * @private
   */
  async _validateAndRenderErrors(
    request,
    h,
    isAdmin,
    responsibility,
    mainArea,
    sessionData
  ) {
    const { error } = mainAreaSchema.validate(
      { mainArea },
      { abortEarly: false }
    )
    if (!error) return null

    const masterAreas = await request.getAreas()
    const availableAreas = getAreasByType(
      masterAreas,
      AREAS_RESPONSIBILITIES_MAP[responsibility]
    )
    const groupedAreas = buildGroupedAreas(
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
        groupedAreas,
        {
          fieldErrors: extractJoiErrors(error)
        }
      )
    )
  }

  /**
   * Build areas array with main area as primary and preserve valid additional areas
   * @private
   */
  _buildAreasWithPrimaryFlag(mainArea, sessionData, areasData, responsibility) {
    const validAreaType = AREAS_RESPONSIBILITIES_MAP[responsibility]

    const existingAdditionalAreas = (sessionData.areas || [])
      .filter((a) => !a.primary && a.areaId !== mainArea)
      .filter((a) => {
        const areaDetails = findAreaById(areasData, a.areaId)
        return areaDetails && areaDetails.area_type === validAreaType
      })

    return [{ areaId: mainArea, primary: true }, ...existingAdditionalAreas]
  }

  /**
   * Determine redirect route based on admin/edit context
   * @private
   */
  _determineReturnRoute(isAdmin, isEditMode, encodedId, baseRoutes) {
    if (isEditMode) {
      return baseRoutes.ADDITIONAL_AREAS.replace('{encodedId}', encodedId)
    }
    return isAdmin
      ? ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS
      : ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { responsibility } = sessionData
    const { mainArea } = request.payload || {}
    const { isEditMode, encodedId, baseRoutes } = getEditModeContext(request)

    if (!responsibility) {
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.DETAILS
          : ROUTES.GENERAL.ACCOUNTS.DETAILS
      )
    }

    // Validate main area selection
    const errorView = await this._validateAndRenderErrors(
      request,
      h,
      isAdmin,
      responsibility,
      mainArea,
      sessionData
    )
    if (errorView) return errorView

    // Store main area with primary flag, preserve valid additional areas
    const areasData = await request.getAreas()
    const areas = this._buildAreasWithPrimaryFlag(
      mainArea,
      sessionData,
      areasData,
      responsibility
    )
    request.yar.set(sessionKey, { ...sessionData, areas })

    // Redirect to next step
    const returnRoute = this._determineReturnRoute(
      isAdmin,
      isEditMode,
      encodedId,
      baseRoutes
    )
    return h.redirect(returnRoute)
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

    const viewData = {
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

    return addEditModeContext(request, viewData, {
      editRoute: ROUTES.ADMIN.ACCOUNTS.EDIT.MAIN_AREA
    })
  }
}

const controller = new MainAreaController()

export const mainAreaController = {
  handler: (request, h) => controller.get(request, h)
}

export const mainAreaPostController = {
  handler: (request, h) => controller.post(request, h)
}
