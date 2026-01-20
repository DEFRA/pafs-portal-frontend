import {
  getAreaDetails,
  getParentAreasDisplay,
  determineResponsibilityFromAreas
} from '../../../common/helpers/areas/areas-helper.js'
import {
  ACCOUNT_VIEWS,
  VIEW_ERROR_CODES,
  AREAS_RESPONSIBILITIES_MAP,
  RESPONSIBILITY_MAP
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers/session-helpers.js'
import { upsertAccount } from '../../../common/services/accounts/accounts-service.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  clearEditSession,
  getEditModeContext
} from '../helpers/navigation-helper.js'
import {
  CHECK_ANSWERS_LOCALE_KEYS,
  ENCODED_ID_PLACEHOLDER
} from '../../../common/constants/accounts.js'
import {
  handleApiError,
  handleSuccess,
  handleUnexpectedError
} from './response-handler.js'
import {
  buildViewModeProperties,
  getLocaleKey,
  getResponsibilityLower,
  getResponsibilityLabel,
  getRoutes,
  getPageTitle
} from './view-builder.js'

/**
 * Check Answers Controller
 * Displays summary of user details and area selection
 * Works for both self-registration and admin user creation flows
 */
class CheckAnswersController {
  /**
   * Get area display data for rendering
   * @private
   */
  async _getAreaDisplayData(request, sessionData) {
    const areasData = await request.getAreas()
    const areaDetails = getAreaDetails(areasData, sessionData.areas || [])
    const parentAreasDisplay = getParentAreasDisplay(
      areasData,
      sessionData.responsibility,
      sessionData.areas || [],
      RESPONSIBILITY_MAP,
      AREAS_RESPONSIBILITIES_MAP
    )
    return { areasData, areaDetails, parentAreasDisplay }
  }

  /**
   * Validate session data and return redirect if invalid
   * @private
   */
  _validateSession(request, h, sessionData, isAdmin, isEditMode, encodedId) {
    const { firstName, email, responsibility, admin, areas = [] } = sessionData

    if (!firstName || !email) {
      request.server.logger.info(
        { firstName, email },
        'Missing firstName or email, redirecting'
      )
      return this._redirectToDetails(h, isAdmin, isEditMode, encodedId)
    }

    if (admin === false) {
      if (!responsibility) {
        return this._redirectToDetails(h, isAdmin, isEditMode, encodedId)
      }

      const mainArea = areas.find((a) => a.primary)
      if (!mainArea) {
        return this._redirectToMainArea(h, isAdmin, isEditMode, encodedId)
      }
    }

    return null
  }
  async get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { isEditMode, encodedId } = getEditModeContext(request)

    // Validate session data
    const validationRedirect = this._validateSession(
      request,
      h,
      sessionData,
      isAdmin,
      isEditMode,
      encodedId
    )
    if (validationRedirect) {
      return validationRedirect
    }

    // Get area display data
    const { areaDetails, parentAreasDisplay } = await this._getAreaDisplayData(
      request,
      sessionData
    )

    return h.view(
      ACCOUNT_VIEWS.CHECK_ANSWERS,
      this.buildViewData(
        request,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        { isEditMode, encodedId }
      )
    )
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { isEditMode, encodedId } = getEditModeContext(request)

    // Get areas for re-rendering on error
    const { areaDetails, parentAreasDisplay } = await this._getAreaDisplayData(
      request,
      sessionData
    )

    try {
      // Prepare payload for API submission
      const payload = this.prepareApiPayload(sessionData, isEditMode)

      // Get access token for admin users
      const accessToken = isAdmin ? getAuthSession(request)?.accessToken : ''

      // Submit to backend API
      const apiResponse = await upsertAccount(payload, accessToken)

      // Check if API request was successful
      if (!apiResponse.success) {
        return handleApiError(this, {
          request,
          h,
          isAdmin,
          sessionData,
          areaDetails,
          parentAreasDisplay,
          apiResponse
        })
      }

      // Store status for confirmation page and redirect
      return handleSuccess(this, {
        request,
        h,
        isAdmin,
        sessionKey,
        sessionData,
        apiResponse,
        isEditMode,
        encodedId
      })
    } catch (error) {
      return handleUnexpectedError(this, {
        request,
        h,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        error
      })
    }
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
    const {
      fieldErrors = {},
      errorCode = '',
      isViewMode = false,
      isEditMode = false,
      encodedId = null
    } = options

    const localeKey = getLocaleKey(isAdmin)
    const responsibilityLower = getResponsibilityLower(responsibility)
    const responsibilityLabel = getResponsibilityLabel(
      request,
      responsibility,
      responsibilityLower
    )
    const responsibilityLegendKey = isAdmin
      ? CHECK_ANSWERS_LOCALE_KEYS.RESPONSIBILITY_LEGEND_ADMIN
      : CHECK_ANSWERS_LOCALE_KEYS.RESPONSIBILITY_LEGEND

    const routes = getRoutes(isAdmin, isEditMode, encodedId, isViewMode)
    const viewAccountProps = isViewMode ? buildViewModeProperties(options) : {}

    const pageTitle = getPageTitle(
      request,
      isViewMode,
      isEditMode,
      sessionData,
      localeKey
    )

    const heading = isEditMode
      ? request.t(`accounts.${localeKey}.check_answers.edit_heading`)
      : request.t(`accounts.${localeKey}.check_answers.heading`)

    const submitButtonText = isEditMode
      ? request.t(`accounts.${localeKey}.check_answers.edit_submit_button`)
      : request.t(`accounts.${localeKey}.check_answers.submit_button`)

    return {
      pageTitle,
      heading,
      submitButtonText,
      isAdmin,
      admin,
      userData: sessionData,
      areaDetails,
      parentAreasDisplay,
      responsibility: responsibilityLower,
      responsibilityLabel,
      responsibilityLegendKey,
      ...routes,
      fieldErrors,
      errorCode,
      localeKey,
      ERROR_CODES: VIEW_ERROR_CODES,
      isEditMode,
      encodedId,
      ...viewAccountProps
    }
  }

  _redirectToDetails(h, isAdmin, isEditMode, encodedId) {
    if (isEditMode) {
      return ROUTES.ADMIN.ACCOUNTS.EDIT.DETAILS.replace(
        ENCODED_ID_PLACEHOLDER,
        encodedId
      )
    }
    return isAdmin
      ? h.redirect(ROUTES.ADMIN.ACCOUNTS.DETAILS)
      : h.redirect(ROUTES.GENERAL.ACCOUNTS.DETAILS)
  }

  _redirectToMainArea(h, isAdmin, isEditMode, encodedId) {
    if (isEditMode) {
      return ROUTES.ADMIN.ACCOUNTS.EDIT.MAIN_AREA.replace(
        ENCODED_ID_PLACEHOLDER,
        encodedId
      )
    }
    return isAdmin
      ? h.redirect(ROUTES.ADMIN.ACCOUNTS.MAIN_AREA)
      : h.redirect(ROUTES.GENERAL.ACCOUNTS.MAIN_AREA)
  }

  // Area-related methods moved to areas-helper.js for single source of truth

  prepareApiPayload(sessionData, isEditMode = false) {
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
      areas: (sessionData.areas || []).map((area) => ({
        areaId: area.areaId,
        primary: area.primary
      }))
    }

    // In edit mode, include the user ID
    if (isEditMode && sessionData.editingUserId) {
      payload.id = sessionData.editingUserId
    }

    // Remove undefined/null values to keep payload clean
    return Object.fromEntries(
      Object.entries(payload).filter(
        ([_, value]) => value !== undefined && value !== null
      )
    )
  }

  /**
   * Get flash notifications from session
   * @private
   */
  _getFlashNotifications(request) {
    const notifications = {}
    const success = request.yar.flash('success')
    const error = request.yar.flash('error')

    if (success && success.length > 0) {
      notifications.successNotification = success[0]
    }

    if (error && error.length > 0) {
      notifications.errorNotification = error[0]
    }

    return notifications
  }

  /**
   * View existing account (admin only)
   * Uses account data from pre-handler (request.pre.accountData)
   */
  async viewAccount(request, h) {
    const { encodedId } = request.params

    // Clear any edit session data when viewing account
    clearEditSession(request)

    try {
      // Get account data from pre-handler
      const { account, areasData } = request.pre.accountData

      // Transform and prepare view data
      const viewData = this._prepareAccountViewData(
        request,
        account,
        areasData,
        encodedId
      )

      // Add flash notifications
      Object.assign(viewData, this._getFlashNotifications(request))

      return h.view(ACCOUNT_VIEWS.CHECK_ANSWERS, viewData)
    } catch (error) {
      request.server.logger.error({ error, encodedId }, 'Error viewing account')
      return h.redirect(ROUTES.ADMIN.USERS_ACTIVE)
    }
  }

  /**
   * Prepare complete view data for account display
   */
  _prepareAccountViewData(request, account, areasData, encodedId) {
    // Transform API account data with proper responsibility lookup
    const sessionData = this._transformAccountToSessionData(account, areasData)
    const areaDetails = getAreaDetails(areasData, sessionData.areas || [])
    const parentAreasDisplay = getParentAreasDisplay(
      areasData,
      sessionData.responsibility,
      sessionData.areas || [],
      RESPONSIBILITY_MAP,
      AREAS_RESPONSIBILITIES_MAP
    )

    return this.buildViewData(
      request,
      true, // isAdmin
      sessionData,
      areaDetails,
      parentAreasDisplay,
      {
        isViewMode: true,
        encodedId,
        accountStatus: account.status,
        accountDisabled: account.disabled,
        invitationAcceptedAt: account.invitationAcceptedAt,
        createdAt: account.createdAt,
        invitationSentAt: account.invitationSentAt,
        lastSignIn: account.lastSignIn
      }
    )
  }

  /**
   * Transform API account data to session data format
   */
  _transformAccountToSessionData(account, areasData) {
    const responsibility = determineResponsibilityFromAreas(
      account,
      areasData,
      RESPONSIBILITY_MAP,
      AREAS_RESPONSIBILITIES_MAP
    )

    return {
      firstName: account.firstName,
      lastName: account.lastName,
      email: account.email,
      telephoneNumber: account.telephoneNumber,
      organisation: account.organisation,
      jobTitle: account.jobTitle,
      responsibility,
      admin: account.admin,
      areas: account.areas
        ? account.areas.map((area) => ({
            areaId: area.id,
            primary: area.primary
          }))
        : []
    }
  }
}

const controller = new CheckAnswersController()

export const checkAnswersController = {
  handler: (request, h) => controller.get(request, h)
}

export const checkAnswersPostController = {
  handler: (request, h) => controller.post(request, h)
}

export const viewAccountController = {
  handler: (request, h) => controller.viewAccount(request, h)
}
