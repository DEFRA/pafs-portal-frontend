import { login } from '../../common/services/auth/auth-service.js'
import { setAuthSession } from '../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../common/constants/routes.js'
import { AUTH_VIEWS, LOCALE_KEYS } from '../../common/constants/common.js'
import { VIEW_ERROR_CODES } from '../../common/constants/validation.js'
import { loginSchema } from '../schema.js'
import {
  extractJoiErrors,
  extractApiValidationErrors,
  extractApiError
} from '../../common/helpers/error-renderer.js'

export const loginController = {
  handler(request, h) {
    return h.view(AUTH_VIEWS.LOGIN, {
      pageTitle: request.t(LOCALE_KEYS.SIGN_IN),
      errorCode: request.query.error || '',
      warningCode: '',
      supportCode: '',
      fieldErrors: {},
      ERROR_CODES: VIEW_ERROR_CODES
    })
  }
}

export const loginPostController = {
  async handler(request, h) {
    const { email = '', password } = request.payload || {}

    const { error, value } = loginSchema.validate(
      { email, password },
      { abortEarly: false }
    )
    if (error) {
      return h.view(AUTH_VIEWS.LOGIN, {
        pageTitle: request.t(LOCALE_KEYS.SIGN_IN),
        fieldErrors: extractJoiErrors(error),
        errorCode: '',
        warningCode: '',
        supportCode: '',
        email,
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }

    try {
      const result = await login(value.email, value.password)

      if (!result.success) {
        // Check for backend validation errors first
        if (result.validationErrors) {
          return h.view(AUTH_VIEWS.LOGIN, {
            pageTitle: request.t(LOCALE_KEYS.SIGN_IN),
            errorCode: '',
            fieldErrors: extractApiValidationErrors(result),
            warningCode: '',
            supportCode: '',
            email,
            ERROR_CODES: VIEW_ERROR_CODES
          })
        }

        // Handle auth/general errors
        const apiError = extractApiError(result)
        return h.view(AUTH_VIEWS.LOGIN, {
          pageTitle: request.t(LOCALE_KEYS.SIGN_IN),
          fieldErrors: {},
          errorCode: apiError?.errorCode,
          warningCode: apiError?.warningCode || '',
          supportCode: apiError?.supportCode || '',
          email,
          ERROR_CODES: VIEW_ERROR_CODES
        })
      }

      setAuthSession(request, result.data)

      if (result.data.user.admin) {
        return h.redirect(ROUTES.ADMIN.JOURNEY_SELECTION)
      }
      return h.redirect(ROUTES.GENERAL.HOME)
    } catch (err) {
      request.server.logger.error({ err }, 'Login error')
      return h.view(AUTH_VIEWS.LOGIN, {
        pageTitle: request.t(LOCALE_KEYS.SIGN_IN),
        errorCode: VIEW_ERROR_CODES.NETWORK_ERROR,
        warningCode: '',
        supportCode: '',
        fieldErrors: {},
        email,
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }
  }
}
