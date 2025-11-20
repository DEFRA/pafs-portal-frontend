import Joi from 'joi'
import { login } from '../../common/services/auth/auth-service.js'
import { setAuthSession } from '../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../common/constants/routes.js'

class LoginController {
  get(request, h) {
    const { error } = request.query

    return h.view('auth/login/index', {
      pageTitle: request.t('common.sign_in'),
      errorCode: error // Error code from backend or middleware
    })
  }

  async post(request, h) {
    const { email, password } = request.payload || {}

    const validation = this.validateInput(email, password, request)
    if (validation.errors) {
      return h.view('auth/login/index', {
        pageTitle: request.t('common.sign_in'),
        validationErrors: validation.errors,
        email: email || ''
      })
    }

    try {
      const result = await login(email, password)

      if (!result.success) {
        return this.handleLoginError(result, email, request, h)
      }

      setAuthSession(request, result.data)
      return this.redirectAfterLogin(result.data.user, h)
    } catch (error) {
      request.server.logger.error({ err: error }, 'Login error')

      return h.view('auth/login/index', {
        pageTitle: request.t('common.sign_in'),
        errorMessage: request.t('auth.service_error'),
        email: email || ''
      })
    }
  }

  validateInput(email, password, request) {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .max(254)
        .trim()
        .lowercase()
        .required()
        .messages({
          'string.empty': 'email-required',
          'string.email': 'email-invalid',
          'any.required': 'email-required'
        }),
      password: Joi.string().required().messages({
        'string.empty': 'password-required',
        'any.required': 'password-required'
      })
    })

    const { error } = schema.validate(
      { email, password },
      { abortEarly: false }
    )

    if (error) {
      // Return all validation errors as an array
      return { errors: error.details.map((detail) => detail.message) }
    }

    return { errors: null }
  }

  handleLoginError(result, email, request, h) {
    // result.error contains the API response body: { errorCode, warningCode, supportCode }
    const errorData = result.error

    return h.view('auth/login/index', {
      pageTitle: request.t('common.sign_in'),
      errorCode: errorData?.errorCode,
      warningCode: errorData?.warningCode,
      supportCode: errorData?.supportCode,
      email: email || ''
    })
  }

  redirectAfterLogin(user, h) {
    if (user.admin) {
      return h.redirect(ROUTES.ADMIN.USERS)
    }
    return h.redirect(ROUTES.GENERAL.HOME)
  }
}

const controller = new LoginController()

export const loginController = {
  handler: (request, h) => controller.get(request, h)
}

export const loginPostController = {
  handler: (request, h) => controller.post(request, h)
}
