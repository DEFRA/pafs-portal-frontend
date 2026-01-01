import { validateEmail } from '../../../common/services/accounts/accounts-service.js'
import { detailsSchema } from '../schema.js'
import {
  ACCOUNT_VIEWS,
  RESPONSIBILITY_MAP,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getSessionKey } from '../helpers.js'
import {
  extractApiValidationErrors,
  extractApiError,
  extractJoiErrors
} from '../../../common/helpers/error-renderer/index.js'

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

  async post(request, h) {
    const isAdmin = request.path.startsWith('/admin')
    const sessionKey = getSessionKey(isAdmin)
    const sessionData = request.yar.get(sessionKey) || {}
    const { admin } = sessionData

    const payload = {
      ...request.payload,
      admin: isAdmin ? admin === true : false,
      isAdminContext: isAdmin
    }

    // Validate the payload
    const { error, value } = detailsSchema.validate(payload, {
      abortEarly: false
    })

    if (error) {
      return h.view(
        ACCOUNT_VIEWS.DETAILS,
        this.buildViewData(request, isAdmin, admin, payload, {
          fieldErrors: extractJoiErrors(error)
        })
      )
    }

    try {
      // Validate email with backend
      const result = await validateEmail(value.email)

      if (!result.success) {
        // Check for backend validation errors first
        if (result.validationErrors) {
          return h.view(
            ACCOUNT_VIEWS.DETAILS,
            this.buildViewData(request, isAdmin, admin, payload, {
              fieldErrors: extractApiValidationErrors(result)
            })
          )
        }

        // Handle general API errors
        const apiError = extractApiError(result)
        return h.view(
          ACCOUNT_VIEWS.DETAILS,
          this.buildViewData(request, isAdmin, admin, payload, {
            errorCode: apiError?.errorCode
          })
        )
      }

      request.yar.set(sessionKey, { ...sessionData, ...value })

      // Redirect based on user type
      // Admin users go to check answers, non-admin users go to area selection
      if (isAdmin && value.admin === true) {
        return h.redirect(ROUTES.ADMIN.ACCOUNTS.CHECK_ANSWERS)
      }

      // Non-admin users proceed to area selection based on responsibility
      // PSO and RMA users select EA areas first
      if (
        value.responsibility === RESPONSIBILITY_MAP.PSO ||
        value.responsibility === RESPONSIBILITY_MAP.RMA
      ) {
        return h.redirect(
          isAdmin
            ? ROUTES.ADMIN.ACCOUNTS.PARENT_AREAS_EA
            : ROUTES.GENERAL.ACCOUNTS.PARENT_AREAS_EA
        )
      }

      // EA users go directly to main area selection
      return h.redirect(
        isAdmin
          ? ROUTES.ADMIN.ACCOUNTS.MAIN_AREA
          : ROUTES.GENERAL.ACCOUNTS.MAIN_AREA
      )
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

    return {
      pageTitle: request.t(
        `accounts.${isAdmin ? (admin ? 'add_user.admin_details' : 'add_user.details') : 'request_account.details'}.title`
      ),
      isAdmin,
      admin,
      accountData,
      fieldErrors,
      errorCode,
      backLink: this.getBackLink(isAdmin, admin !== undefined),
      submitRoute: isAdmin
        ? ROUTES.ADMIN.ACCOUNTS.DETAILS
        : ROUTES.GENERAL.ACCOUNTS.DETAILS,
      ERROR_CODES: VIEW_ERROR_CODES
    }
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
