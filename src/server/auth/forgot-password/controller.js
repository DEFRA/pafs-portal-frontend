import Joi from 'joi'
import { forgotPassword } from '../../common/services/auth/auth-service.js'
import { ROUTES } from '../../common/constants/routes.js'
import { EMAIL } from '../../common/constants/validation.js'
import { AUTH_VIEWS } from '../../common/constants/common.js'

class ForgotPasswordController {
  get(request, h) {
    return h.view(AUTH_VIEWS.FORGOT_PASSWORD, {
      pageTitle: request.t('password-reset.forgot_password.title')
    })
  }

  async post(request, h) {
    const { email } = request.payload || {}

    const validation = this.validateInput(email, request)
    if (validation.errors) {
      return h.view(AUTH_VIEWS.FORGOT_PASSWORD, {
        pageTitle: request.t('password-reset.forgot_password.title'),
        validationErrors: validation.errors,
        email: email || ''
      })
    }

    try {
      // Always call the API regardless of whether email exists (prevent enumeration)
      await forgotPassword(email)

      // Always redirect to confirmation page with session flags
      return h
        .redirect(ROUTES.FORGOT_PASSWORD_CONFIRMATION)
        .state('resetEmail', email)
        .state('canViewConfirmation', '1')
    } catch (error) {
      request.server.logger.error({ err: error }, 'Forgot password error')

      // Even on error, redirect to confirmation (prevent enumeration)
      return h
        .redirect(ROUTES.FORGOT_PASSWORD_CONFIRMATION)
        .state('resetEmail', email)
        .state('canViewConfirmation', '1')
    }
  }

  validateInput(email, _request) {
    const schema = Joi.object({
      email: Joi.string()
        .email({ tlds: { allow: false } })
        .max(EMAIL.MAX_LENGTH)
        .trim()
        .lowercase()
        .required()
        .messages({
          'string.empty': 'email-required',
          'string.email': 'email-invalid',
          'any.required': 'email-required'
        })
    })

    const { error } = schema.validate({ email }, { abortEarly: false })

    if (error) {
      return { errors: error.details.map((detail) => detail.message) }
    }

    return { errors: null }
  }
}

const controller = new ForgotPasswordController()

export const forgotPasswordController = {
  handler: (request, h) => controller.get(request, h)
}

export const forgotPasswordPostController = {
  handler: (request, h) => controller.post(request, h)
}

class ForgotPasswordConfirmationController {
  get(request, h) {
    // Prevent direct access - must come from forgot password form
    if (!request.state.canViewConfirmation) {
      return h.redirect(ROUTES.FORGOT_PASSWORD)
    }

    const email = request.state.resetEmail || ''

    return h
      .view(AUTH_VIEWS.FORGOT_PASSWORD_REQUEST_CONFIRMATION, {
        pageTitle: request.t(
          'password-reset.forgot_password_confirmation.title'
        ),
        email
      })
      .unstate('resetEmail')
      .unstate('canViewConfirmation')
  }
}

const confirmationController = new ForgotPasswordConfirmationController()

export const forgotPasswordConfirmationController = {
  handler: (request, h) => confirmationController.get(request, h)
}
