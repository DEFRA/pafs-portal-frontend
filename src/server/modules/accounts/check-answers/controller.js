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
import {
  extractApiValidationErrors,
  extractApiError
} from '../../../common/helpers/error-renderer/index.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { ACCOUNT_STATUS } from '../../../common/constants/accounts.js'
import { createAccountsCacheService } from '../../../common/services/accounts/accounts-cache.js'
import {
  clearEditSession,
  getEditModeContext
} from '../helpers/navigation-helper.js'

// Locale key constants to avoid magic strings
const LOCALE_KEYS = {
  ADMIN: 'add_user',
  USER: 'request_account',
  RESPONSIBILITY_LEGEND_ADMIN: 'responsibility_legend_admin',
  RESPONSIBILITY_LEGEND: 'responsibility_legend'
}

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
        return this.handleApiError(
          request,
          h,
          isAdmin,
          sessionData,
          areaDetails,
          parentAreasDisplay,
          apiResponse,
          isEditMode,
          encodedId
        )
      }

      // Store status for confirmation page and redirect
      return this.handleSuccess(
        request,
        h,
        isAdmin,
        sessionKey,
        sessionData,
        apiResponse,
        isEditMode,
        encodedId
      )
    } catch (error) {
      return this.handleUnexpectedError(
        request,
        h,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        error,
        isEditMode,
        encodedId
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
    apiResponse,
    isEditMode = false,
    encodedId = null
  ) {
    request.server.logger.error({ apiResponse }, 'API returned error response')

    const viewOptions = { isEditMode, encodedId }

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
            ...viewOptions,
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
          ...viewOptions,
          errorCode: apiError?.errorCode || VIEW_ERROR_CODES.NETWORK_ERROR
        }
      )
    )
  }

  /**
   * Invalidate account caches after create/update
   * @private
   */
  async _invalidateAccountCache(request, isEditMode, apiResponse, sessionData) {
    const cacheService = createAccountsCacheService(request.server)

    if (isEditMode) {
      const accountId = apiResponse.data?.userId || sessionData.editingUserId
      if (accountId) {
        const accountKey = cacheService.generateAccountKey(accountId)
        await cacheService.dropByKey(accountKey).catch((error) => {
          request.server.logger.warn(
            { error, accountId },
            'Failed to invalidate specific account cache'
          )
        })
      }
    } else {
      await cacheService.invalidateAll().catch((error) => {
        request.server.logger.warn(
          { error },
          'Failed to invalidate accounts cache'
        )
      })
    }
  }

  /**
   * Handle successful account update in edit mode
   * @private
   */
  _handleEditSuccess(request, h, sessionData, encodedId) {
    const { firstName, lastName } = sessionData

    request.yar.flash('success', {
      title: request.t('accounts.view_user.notifications.updated_title'),
      message: request.t('accounts.view_user.notifications.updated_message', {
        userName: `${firstName} ${lastName}`
      })
    })

    clearEditSession(request)
    return h.redirect(ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId))
  }

  /**
   * Handle successful account creation in admin mode
   * @private
   */
  _handleCreateSuccess(request, h, sessionKey, sessionData, apiResponse) {
    const { firstName, lastName } = sessionData

    request.yar.flash('userCreated', {
      name: `${firstName} ${lastName}`,
      userId: apiResponse.data?.userId
    })

    request.yar.set(sessionKey, undefined)
    return h.redirect(ROUTES.ADMIN.USERS_ACTIVE)
  }

  /**
   * Handle successful account registration for non-admin
   * @private
   */
  _handleUserSuccess(request, h, sessionKey, sessionData, status) {
    request.yar.set(sessionKey, { ...sessionData, submissionStatus: status })
    return h.redirect(ROUTES.GENERAL.ACCOUNTS.CONFIRMATION)
  }

  async handleSuccess(
    request,
    h,
    isAdmin,
    sessionKey,
    sessionData,
    apiResponse,
    isEditMode = false,
    encodedId = null
  ) {
    const status = apiResponse.data?.status || ACCOUNT_STATUS.PENDING

    // Invalidate caches
    await this._invalidateAccountCache(
      request,
      isEditMode,
      apiResponse,
      sessionData
    )

    // Handle different flows
    if (isAdmin) {
      if (isEditMode) {
        return this._handleEditSuccess(request, h, sessionData, encodedId)
      }
      return this._handleCreateSuccess(
        request,
        h,
        sessionKey,
        sessionData,
        apiResponse
      )
    }

    return this._handleUserSuccess(request, h, sessionKey, sessionData, status)
  }

  handleUnexpectedError(
    request,
    h,
    isAdmin,
    sessionData,
    areaDetails,
    parentAreasDisplay,
    error,
    isEditMode = false,
    encodedId = null
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
          isEditMode,
          encodedId,
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
    const {
      fieldErrors = {},
      errorCode = '',
      isViewMode = false,
      isEditMode = false,
      encodedId = null
    } = options

    const localeKey = this._getLocaleKey(isAdmin)
    const responsibilityLower = this._getResponsibilityLower(responsibility)
    const responsibilityLabel = this._getResponsibilityLabel(
      request,
      responsibility,
      responsibilityLower
    )
    const responsibilityLegendKey = isAdmin
      ? LOCALE_KEYS.RESPONSIBILITY_LEGEND_ADMIN
      : LOCALE_KEYS.RESPONSIBILITY_LEGEND

    const routes = this._getRoutes(isAdmin, isEditMode, encodedId, isViewMode)
    const viewAccountProps = isViewMode
      ? this._buildViewModeProperties(options)
      : {}

    const pageTitle = this._getPageTitle(
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

  /**
   * Build view mode specific properties
   * Extracted to reduce cognitive complexity of buildViewData
   */
  _buildViewModeProperties(options) {
    const {
      accountStatus,
      accountDisabled,
      invitationAcceptedAt,
      createdAt,
      invitationSentAt,
      lastSignIn,
      encodedId
    } = options

    const statusFlags = this._determineStatusFlags(
      accountStatus,
      accountDisabled,
      invitationAcceptedAt
    )

    const accountInfo = {
      createdAt,
      invitationSentAt,
      invitationAcceptedAt,
      lastSignIn
    }

    return {
      isViewMode: true,
      encodedId,
      ...statusFlags,
      backLink: statusFlags.isPending
        ? ROUTES.ADMIN.USERS_PENDING
        : ROUTES.ADMIN.USERS_ACTIVE,
      accountInfo,
      actionRoutes: this._buildActionRoutes(encodedId)
    }
  }

  /**
   * Determine account status flags
   */
  _determineStatusFlags(accountStatus, accountDisabled, invitationAcceptedAt) {
    return {
      isPending: accountStatus === 'pending',
      isActive: accountStatus === 'active' || accountStatus === 'approved',
      isDisabled: accountDisabled,
      hasAcceptedInvitation: !!invitationAcceptedAt
    }
  }

  /**
   * Build action routes for user management
   * Uses route constants to avoid magic strings
   */
  _buildActionRoutes(encodedId) {
    return {
      approve: ROUTES.ADMIN.USER_ACTIONS.APPROVE.replace(
        '{encodedId}',
        encodedId
      ),
      delete: ROUTES.ADMIN.USER_ACTIONS.DELETE.replace(
        '{encodedId}',
        encodedId
      ),
      resendInvitation: ROUTES.ADMIN.USER_ACTIONS.RESEND_INVITATION.replace(
        '{encodedId}',
        encodedId
      ),
      reactivate: ROUTES.ADMIN.USER_ACTIONS.REACTIVATE.replace(
        '{encodedId}',
        encodedId
      ),
      editDetails: ROUTES.ADMIN.USER_ACTIONS.EDIT_DETAILS.replace(
        '{encodedId}',
        encodedId
      )
    }
  }

  _getLocaleKey(isAdmin) {
    return isAdmin ? LOCALE_KEYS.ADMIN : LOCALE_KEYS.USER
  }

  _getResponsibilityLower(responsibility) {
    return responsibility ? responsibility.toLowerCase() : ''
  }

  _getResponsibilityLabel(request, responsibility, responsibilityLower) {
    return responsibility
      ? request.t(`accounts.label.responsibility.${responsibilityLower}`)
      : ''
  }

  /**
   * Get routes for edit mode
   * @private
   */
  _getEditRoutes(encodedId) {
    const editRoutes = ROUTES.ADMIN.ACCOUNTS.EDIT
    return {
      submitRoute: editRoutes.CHECK_ANSWERS.replace('{encodedId}', encodedId),
      detailsRoute: editRoutes.DETAILS.replace('{encodedId}', encodedId),
      mainAreaRoute: editRoutes.MAIN_AREA.replace('{encodedId}', encodedId),
      additionalAreasRoute: editRoutes.ADDITIONAL_AREAS.replace(
        '{encodedId}',
        encodedId
      ),
      parentAreasEaRoute: editRoutes.PARENT_AREAS.replace(
        '{type}',
        'ea'
      ).replace('{encodedId}', encodedId),
      parentAreasPsoRoute: editRoutes.PARENT_AREAS.replace(
        '{type}',
        'pso'
      ).replace('{encodedId}', encodedId),
      isAdminRoute: editRoutes.IS_ADMIN.replace('{encodedId}', encodedId),
      cancelRoute: ROUTES.ADMIN.USER_VIEW.replace('{encodedId}', encodedId)
    }
  }

  /**
   * Get routes for create mode
   * @private
   */
  _getCreateRoutes(isAdmin) {
    const baseRoutes = isAdmin ? ROUTES.ADMIN.ACCOUNTS : ROUTES.GENERAL.ACCOUNTS

    return {
      submitRoute: baseRoutes.CHECK_ANSWERS,
      detailsRoute: baseRoutes.DETAILS,
      mainAreaRoute: baseRoutes.MAIN_AREA,
      additionalAreasRoute: baseRoutes.ADDITIONAL_AREAS,
      parentAreasEaRoute: baseRoutes.PARENT_AREAS_EA,
      parentAreasPsoRoute: baseRoutes.PARENT_AREAS_PSO,
      isAdminRoute: isAdmin ? baseRoutes.IS_ADMIN : null
    }
  }

  _getRoutes(
    isAdmin,
    isEditMode = false,
    encodedId = null,
    isViewMode = false
  ) {
    if ((isEditMode || isViewMode) && encodedId) {
      return this._getEditRoutes(encodedId)
    }
    return this._getCreateRoutes(isAdmin)
  }

  _getPageTitle(request, isViewMode, isEditMode, sessionData, localeKey) {
    if (isViewMode) {
      return `${request.t('accounts.view_user.title')} - ${sessionData.firstName} ${sessionData.lastName}`
    }
    if (isEditMode) {
      return request.t(`accounts.${localeKey}.check_answers.edit_title`)
    }
    return request.t(`accounts.${localeKey}.check_answers.title`)
  }

  _redirectToDetails(h, isAdmin, isEditMode, encodedId) {
    if (isEditMode) {
      return ROUTES.ADMIN.ACCOUNTS.EDIT.DETAILS.replace(
        '{encodedId}',
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
        '{encodedId}',
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
