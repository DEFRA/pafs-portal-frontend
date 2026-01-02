import {
  findAreaById,
  getParentAreas
} from '../../../common/helpers/areas/areas-helper.js'
import {
  ACCOUNT_VIEWS,
  VIEW_ERROR_CODES,
  AREAS_RESPONSIBILITIES_MAP,
  RESPONSIBILITY_MAP
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'
import { upsertAccount } from '../../../common/services/accounts/accounts-service.js'
import {
  extractApiValidationErrors,
  extractApiError
} from '../../../common/helpers/error-renderer/index.js'

/**
 * Check Answers Controller
 * Displays summary of user details and area selection
 * Works for both self-registration and admin user creation flows
 */
class CheckAnswersController {
  async get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}

    const { firstName, email, responsibility, admin, areas = [] } = sessionData

    // Redirect if required data is missing
    if (!firstName || !email) {
      request.server.logger.info(
        { firstName, email },
        'Missing firstName or email, redirecting'
      )
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.DETAILS
          : ROUTES.GENERAL.ACCOUNTS.DETAILS
      )
    }

    // For non-admin users, responsibility and areas are required
    if (admin === false) {
      if (!responsibility) {
        return h.redirect(
          isAdmin
            ? ROUTES.ADMIN.ACCOUNTS.DETAILS
            : ROUTES.GENERAL.ACCOUNTS.DETAILS
        )
      }

      const mainArea = areas.find((a) => a.primary)
      if (!mainArea) {
        return h.redirect(
          isAdmin
            ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
            : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
        )
      }
    }

    // Get areas for display
    const areasData = await request.getAreas()
    const areaDetails = this.getAreaDetails(areasData, areas)
    const parentAreasDisplay = this.getParentAreasDisplay(
      areasData,
      sessionData,
      areas
    )

    return h.view(
      ACCOUNT_VIEWS.CHECK_ANSWERS,
      this.buildViewData(
        request,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay
      )
    )
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}

    // Get areas for re-rendering
    const areasData = await request.getAreas()
    const areaDetails = this.getAreaDetails(areasData, sessionData.areas || [])
    const parentAreasDisplay = this.getParentAreasDisplay(
      areasData,
      sessionData,
      sessionData.areas || []
    )

    try {
      // Prepare payload for API submission
      const payload = this.prepareApiPayload(sessionData)

      // Submit to backend API
      const apiResponse = await upsertAccount(payload)

      // Check if API request was successful
      if (!apiResponse.success) {
        return this.handleApiError(
          request,
          h,
          isAdmin,
          sessionData,
          areaDetails,
          parentAreasDisplay,
          apiResponse
        )
      }

      // Store status for confirmation page and redirect
      return this.handleSuccess(
        request,
        h,
        isAdmin,
        sessionKey,
        sessionData,
        apiResponse
      )
    } catch (error) {
      return this.handleUnexpectedError(
        request,
        h,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        error
      )
    }
  }

  handleApiError(
    request,
    h,
    isAdmin,
    sessionData,
    areaDetails,
    parentAreasDisplay,
    apiResponse
  ) {
    request.server.logger.error({ apiResponse }, 'API returned error response')

    // Check for backend validation errors first
    if (apiResponse.validationErrors) {
      return h.view(
        ACCOUNT_VIEWS.CHECK_ANSWERS,
        this.buildViewData(
          request,
          isAdmin,
          sessionData,
          areaDetails,
          parentAreasDisplay,
          {
            fieldErrors: extractApiValidationErrors(apiResponse)
          }
        )
      )
    }

    // Handle general API errors
    const apiError = extractApiError(apiResponse)
    return h.view(
      ACCOUNT_VIEWS.CHECK_ANSWERS,
      this.buildViewData(
        request,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        {
          errorCode: apiError?.errorCode || VIEW_ERROR_CODES.NETWORK_ERROR
        }
      )
    )
  }

  handleSuccess(request, h, isAdmin, sessionKey, sessionData, apiResponse) {
    const status = apiResponse.data?.status || 'pending'
    request.yar.set(sessionKey, { ...sessionData, submissionStatus: status })

    // Redirect to confirmation page
    return h.redirect(
      isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.CONFIRMATION
        : ROUTES.GENERAL.ACCOUNTS.CONFIRMATION
    )
  }

  handleUnexpectedError(
    request,
    h,
    isAdmin,
    sessionData,
    areaDetails,
    parentAreasDisplay,
    error
  ) {
    // This handles unexpected errors (network failures, timeouts, etc.)
    request.server.logger.error(
      { error },
      'Unexpected error during account submission'
    )

    return h.view(
      ACCOUNT_VIEWS.CHECK_ANSWERS,
      this.buildViewData(
        request,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        {
          errorCode: VIEW_ERROR_CODES.NETWORK_ERROR
        }
      )
    )
  }

  buildViewData(
    request,
    isAdmin,
    sessionData,
    areaDetails,
    parentAreasDisplay,
    options = {}
  ) {
    const { responsibility, admin } = sessionData
    const { fieldErrors = {}, errorCode = '' } = options
    const localeKey = this._getLocaleKey(isAdmin)
    const responsibilityLower = this._getResponsibilityLower(responsibility)
    const responsibilityLabel = this._getResponsibilityLabel(
      request,
      responsibility,
      responsibilityLower
    )

    const routes = this._getRoutes(isAdmin)

    return {
      pageTitle: request.t(`accounts.${localeKey}.check_answers.title`),
      isAdmin,
      admin,
      userData: sessionData,
      areaDetails,
      parentAreasDisplay,
      responsibility: responsibilityLower,
      responsibilityLabel,
      ...routes,
      fieldErrors,
      errorCode,
      localeKey,
      ERROR_CODES: VIEW_ERROR_CODES
    }
  }

  _getLocaleKey(isAdmin) {
    return isAdmin ? 'add_user' : 'request_account'
  }

  _getResponsibilityLower(responsibility) {
    return responsibility ? responsibility.toLowerCase() : ''
  }

  _getResponsibilityLabel(request, responsibility, responsibilityLower) {
    return responsibility
      ? request.t(`accounts.label.responsibility.${responsibilityLower}`)
      : ''
  }

  _getRoutes(isAdmin) {
    return {
      submitRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS
        : ROUTES.GENERAL.ACCOUNTS.CHECK_ANSWERS,
      detailsRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.DETAILS
        : ROUTES.GENERAL.ACCOUNTS.DETAILS,
      mainAreaRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
        : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA,
      additionalAreasRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.ADDITIONAL_AREAS
        : ROUTES.GENERAL.ACCOUNTS.ADDITIONAL_AREAS,
      parentAreasEaRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA
        : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_EA,
      parentAreasPsoRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_PSO
        : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_PSO,
      isAdminRoute: isAdmin ? ROUTES.ADMIN.ACCOUNTS.IS_ADMIN : null
    }
  }

  getAreaDetails(areasData, userAreas) {
    const mainAreaObj = userAreas.find((a) => a.primary)
    const mainAreaDetails = mainAreaObj
      ? findAreaById(areasData, mainAreaObj.areaId)
      : null

    const additionalAreasObjs = userAreas
      .filter((a) => !a.primary)
      .map((a) => findAreaById(areasData, a.areaId))
      .filter(Boolean)

    return {
      mainArea: mainAreaDetails,
      additionalAreas: additionalAreasObjs
    }
  }

  getParentAreasDisplay(areasData, sessionData, userAreas) {
    const { responsibility } = sessionData
    if (!responsibility || userAreas.length === 0) {
      return null
    }

    // Get unique parent areas based on responsibility
    const parentAreasSet = new Set()

    userAreas.forEach((areaObj) => {
      const area = findAreaById(areasData, areaObj.areaId)
      if (!area) {
        return
      }

      // For PSO users, get EA parents
      if (responsibility === RESPONSIBILITY_MAP.PSO) {
        const eaParents = getParentAreas(
          areasData,
          area.id,
          AREAS_RESPONSIBILITIES_MAP.EA
        )
        eaParents.forEach((parent) =>
          parentAreasSet.add(JSON.stringify({ type: 'EA', area: parent }))
        )
      } else if (responsibility === RESPONSIBILITY_MAP.RMA) {
        // For RMA users, get both EA and PSO parents
        const eaParents = getParentAreas(
          areasData,
          area.id,
          AREAS_RESPONSIBILITIES_MAP.EA
        )
        eaParents.forEach((parent) =>
          parentAreasSet.add(JSON.stringify({ type: 'EA', area: parent }))
        )

        const psoParents = getParentAreas(
          areasData,
          area.id,
          AREAS_RESPONSIBILITIES_MAP.PSO
        )
        psoParents.forEach((parent) =>
          parentAreasSet.add(JSON.stringify({ type: 'PSO', area: parent }))
        )
      } else {
        // EA users or other responsibilities don't need parent areas
      }
    })

    // Convert back to objects and group by type
    const parentAreas = Array.from(parentAreasSet).map((str) => JSON.parse(str))
    const eaAreas = parentAreas
      .filter((p) => p.type === 'EA')
      .map((p) => p.area.name)
    const psoAreas = parentAreas
      .filter((p) => p.type === 'PSO')
      .map((p) => p.area.name)

    return {
      eaAreas: eaAreas.length > 0 ? eaAreas.join(', ') : null,
      psoAreas: psoAreas.length > 0 ? psoAreas.join(', ') : null
    }
  }

  prepareApiPayload(sessionData) {
    // Extract only the fields needed for API submission
    const payload = {
      firstName: sessionData.firstName,
      lastName: sessionData.lastName,
      email: sessionData.email,
      telephoneNumber: sessionData.telephoneNumber,
      organisation: sessionData.organisation,
      jobTitle: sessionData.jobTitle,
      responsibility: sessionData.responsibility,
      isAdminContext: sessionData.isAdminContext,
      admin: sessionData.admin,
      areas: sessionData.areas
    }

    // Remove undefined/null values to keep payload clean
    return Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null
      )
    )
  }
}

const controller = new CheckAnswersController()

export const checkAnswersController = {
  handler: (request, h) => controller.get(request, h)
}

export const checkAnswersPostController = {
  handler: (request, h) => controller.post(request, h)
}
