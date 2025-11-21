import Joi from 'joi'
import {
  resetPassword,
  validateResetToken
} from '../../common/services/auth/auth-service.js'
import { ROUTES } from '../../common/constants/routes.js'
import { PASSWORD } from '../../common/constants/validation.js'
import { AUTH_VIEWS, PAGE_TITLE } from '../../common/constants/common.js'

class ResetPasswordController {
  async get(request, h) {
    const { token } = request.query

    if (!token) {
      return h.redirect(ROUTES.LOGIN)
    }

    try {
      const result = await validateResetToken(token)

      if (!result.success) {
        return h
          .redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
          .state('canViewTokenExpired', '1')
      }

      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(PAGE_TITLE.PASSWORD_RESET),
        token
      })
    } catch (error) {
      request.server.logger.error(
        { err: error },
        'Error validating reset token'
      )

      return h
        .redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
        .state('canViewTokenExpired', '1')
    }
  }

  async post(request, h) {
    const { token, newPassword, confirmPassword } = request.payload || {}

    if (!token) {
      return h
        .redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
        .state('canViewTokenExpired', '1')
    }

    const validation = this.validateInput(newPassword, confirmPassword, request)
    if (validation.errors) {
      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(PAGE_TITLE.PASSWORD_RESET),
        validationErrors: validation.errors,
        token
      })
    }

    try {
      const result = await resetPassword(token, newPassword, confirmPassword)

      if (!result.success) {
        return this.handleResetError(result, token, request, h)
      }

      return h
        .redirect(ROUTES.RESET_PASSWORD_SUCCESS)
        .state('canViewSuccess', '1')
    } catch (error) {
      request.server.logger.error({ err: error }, 'Reset password error')

      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(PAGE_TITLE.PASSWORD_RESET),
        errorMessage: request.t('auth.service_error'),
        token
      })
    }
  }

  validateInput(newPassword, confirmPassword, _request) {
    const schema = Joi.object({
      newPassword: Joi.string()
        .min(PASSWORD.MIN_LENGTH)
        .max(PASSWORD.MAX_LENGTH)
        .pattern(/[A-Z]/, 'uppercase')
        .pattern(/[a-z]/, 'lowercase')
        .pattern(/\d/, 'number')
        .pattern(/[!@#$%^&*()_.+\-=[\]]/, 'special')
        .required()
        .messages({
          'string.empty': 'password-required',
          'string.min': 'password-min-length',
          'string.max': 'password-max-length',
          'string.pattern.name': 'password-{#name}',
          'any.required': 'password-required'
        }),
      confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
          'string.empty': 'confirm-password-required',
          'any.only': 'password-mismatch',
          'any.required': 'confirm-password-required'
        })
    })

    const { error } = schema.validate(
      { newPassword, confirmPassword },
      { abortEarly: false }
    )

    if (error) {
      return { errors: error.details.map((detail) => detail.message) }
    }

    return { errors: null }
  }

  handleResetError(result, token, request, h) {
    const errorData = result.error

    // Check for specific error codes
    if (errorData?.errorCode === 'AUTH_PASSWORD_RESET_EXPIRED_TOKEN') {
      return h
        .redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
        .state('canViewTokenExpired', '1')
    }

    if (errorData?.errorCode === 'AUTH_PASSWORD_RESET_INVALID_TOKEN') {
      return h
        .redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
        .state('canViewTokenExpired', '1')
    }

    // Handle same as current password error
    if (errorData?.errorCode === 'AUTH_PASSWORD_RESET_SAME_AS_CURRENT') {
      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(PAGE_TITLE.PASSWORD_RESET),
        validationErrors: ['password-same-as-current'],
        token
      })
    }

    // Handle password was used previously error
    if (
      errorData?.errorCode ===
      'AUTH_PASSWORD_RESET_PASSWORD_WAS_USED_PREVIOUSLY'
    ) {
      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(PAGE_TITLE.PASSWORD_RESET),
        validationErrors: ['password-used-previously'],
        token
      })
    }

    // Generic error
    return h.view(AUTH_VIEWS.RESET_PASSWORD, {
      pageTitle: request.t(PAGE_TITLE.PASSWORD_RESET),
      errorCode: errorData?.errorCode,
      token
    })
  }
}

const controller = new ResetPasswordController()

export const resetPasswordController = {
  handler: (request, h) => controller.get(request, h)
}

export const resetPasswordPostController = {
  handler: (request, h) => controller.post(request, h)
}

class ResetPasswordSuccessController {
  get(request, h) {
    // Prevent direct access - must come from successful password reset
    if (!request.state.canViewSuccess) {
      return h.redirect(ROUTES.LOGIN)
    }

    const response = h.view(AUTH_VIEWS.RESET_PASSWORD_SUCCESS, {
      pageTitle: request.t('password-reset.reset_password_success.title')
    })

    response.unstate('canViewSuccess')

    return response
  }
}

const successController = new ResetPasswordSuccessController()

export const resetPasswordSuccessController = {
  handler: (request, h) => successController.get(request, h)
}

class ResetPasswordTokenExpiredController {
  get(request, h) {
    // Prevent direct access - must come from invalid/expired token
    if (!request.state.canViewTokenExpired) {
      return h.redirect(ROUTES.FORGOT_PASSWORD)
    }

    const response = h.view(AUTH_VIEWS.RESET_PASSWORD_TOKEN_EXPIRED, {
      pageTitle: request.t('password-reset.reset_password_token_expired.title')
    })

    response.unstate('canViewTokenExpired')

    return response
  }
}

const tokenExpiredController = new ResetPasswordTokenExpiredController()

export const resetPasswordTokenExpiredController = {
  handler: (request, h) => tokenExpiredController.get(request, h)
}
