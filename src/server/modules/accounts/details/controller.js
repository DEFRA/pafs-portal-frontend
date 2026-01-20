import { validateEmail } from '../../../common/services/accounts/accounts-service.js'
import { detailsSchema } from '../schema.js'
import {
  ACCOUNT_VIEWS,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers/session-helpers.js'
import {
  extractApiValidationErrors,
  extractApiError,
  extractJoiErrors
} from '../../../common/helpers/error-renderer/index.js'
import { addEditModeContext } from '../helpers/view-data-helper.js'
import { getNextRouteAfterDetails } from '../helpers/navigation-helper.js'
import { decodeUserId } from '../../../common/helpers/security/encoder.js'

class DetailsController {
  get(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { admin } = sessionData

    return h.view(
      ACCOUNT_VIEWS.DETAILS,
      this.buildViewData(request, isAdmin, admin, sessionData, {})
    )
  }

  /**
   * Validate payload and render error view if invalid
   * @private
   */
  _validatePayload(request, h, isAdmin, admin, payload) {
    const { error } = detailsSchema.validate(payload, { abortEarly: false })
    if (!error) return null

    return h.view(
      ACCOUNT_VIEWS.DETAILS,
      this.buildViewData(request, isAdmin, admin, payload, {
        fieldErrors: extractJoiErrors(error)
      })
    )
  }

  /**
   * Validate email with backend and return error view if invalid
   * @private
   */
  async _validateEmailWithBackend(
    request,
    h,
    isAdmin,
    admin,
    payload,
    email,
    userId
  ) {
    const result = await validateEmail(email, userId)

    if (!result.success) {
      if (result.validationErrors) {
        return h.view(
          ACCOUNT_VIEWS.DETAILS,
          this.buildViewData(request, isAdmin, admin, payload, {
            fieldErrors: extractApiValidationErrors(result)
          })
        )
      }

      const apiError = extractApiError(result)
      return h.view(
        ACCOUNT_VIEWS.DETAILS,
        this.buildViewData(request, isAdmin, admin, payload, {
          errorCode: apiError?.errorCode
        })
      )
    }

    return null
  }

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { admin } = sessionData
    const encodedId = request.params?.encodedId
    const userId = encodedId ? decodeUserId(encodedId) : null

    const payload = {
      ...request.payload,
      admin: isAdmin ? admin === true : false,
      isAdminContext: isAdmin
    }

    // Validate the payload
    const validationError = this._validatePayload(
      request,
      h,
      isAdmin,
      admin,
      payload
    )
    if (validationError) return validationError

    const { value } = detailsSchema.validate(payload, { abortEarly: false })

    try {
      // Validate email with backend
      const emailError = await this._validateEmailWithBackend(
        request,
        h,
        isAdmin,
        admin,
        payload,
        value.email,
        userId
      )
      if (emailError) return emailError

      request.yar.set(sessionKey, { ...sessionData, ...value })

      // Determine next route
      const nextRoute = getNextRouteAfterDetails(request, {
        ...sessionData,
        ...value
      })
      return h.redirect(nextRoute)
    } catch (err) {
      request.server.logger.error({ err }, 'Email validation error')
      return h.view(
        ACCOUNT_VIEWS.DETAILS,
        this.buildViewData(request, isAdmin, admin, payload, {
          errorCode: VIEW_ERROR_CODES.NETWORK_ERROR
        })
      )
    }
  }

  buildViewData(request, isAdmin, admin, accountData, options = {}) {
    const { fieldErrors = {}, errorCode = '' } = options
    const pageTitleKey = this.getPageTitleKey(isAdmin, admin)
    const responsibilityLegendKey = isAdmin
      ? 'responsibility_legend_admin'
      : 'responsibility_legend'
    const encodedId = request.params?.encodedId
    const isEditMode = !!encodedId
    const titleSuffix = isEditMode ? 'edit_title' : 'title'

    const viewData = {
      pageTitle: request.t(`accounts.${pageTitleKey}.${titleSuffix}`),
      isAdmin,
      admin,
      accountData,
      fieldErrors,
      errorCode,
      backLink: this.getBackLink(isAdmin, admin !== undefined),
      submitRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.DETAILS
        : ROUTES.GENERAL.ACCOUNTS.DETAILS,
      ERROR_CODES: VIEW_ERROR_CODES,
      responsibilityLegendKey,
      isEditMode
    }

    return addEditModeContext(request, viewData, {
      editRoute: ROUTES.ADMIN.ACCOUNTS.EDIT.DETAILS
    })
  }

  getPageTitleKey(isAdmin, admin) {
    if (!isAdmin) {
      return 'request_account.details'
    }
    return admin ? 'add_user.admin_details' : 'add_user.details'
  }

  getBackLink(isAdmin, adminFlagSet = false) {
    if (isAdmin) {
      return adminFlagSet
        ? ROUTES.ADMIN.ACCOUNTS.IS_ADMIN
        : ROUTES.ADMIN.ACCOUNTS.START
    }
    return ROUTES.GENERAL.ACCOUNTS.START
  }
}

const controller = new DetailsController()

export const detailsController = {
  handler: (request, h) => controller.get(request, h)
}

export const detailsPostController = {
  handler: (request, h) => controller.post(request, h)
}
