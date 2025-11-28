import {
  resetPassword,
  validateResetToken
} from '../../common/services/auth/auth-service.js'
import { ROUTES } from '../../common/constants/routes.js'
import { VIEW_ERROR_CODES } from '../../common/constants/validation.js'
import { AUTH_VIEWS, LOCALE_KEYS } from '../../common/constants/common.js'
import { extractJoiErrors } from '../../common/helpers/error-renderer.js'
import { resetPasswordSchema } from '../schema.js'

/**
 * GET /reset-password - Show reset password form
 */
export const resetPasswordController = {
  async handler(request, h) {
    const { token } = request.query

    if (!token) {
      return h.redirect(ROUTES.LOGIN)
    }

    try {
      const result = await validateResetToken(token)

      if (!result.success) {
        request.yar.flash('tokenExpired', true)
        return h.redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
      }

      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(LOCALE_KEYS.PASSWORD_RESET),
        token,
        fieldErrors: {},
        errorCode: '',
        ERROR_CODES: VIEW_ERROR_CODES
      })
    } catch (err) {
      request.server.logger.error({ err }, 'Error validating reset token')
      request.yar.flash('tokenExpired', true)
      return h.redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
    }
  }
}

/**
 * POST /reset-password - Process password reset
 */
export const resetPasswordPostController = {
  async handler(request, h) {
    const { token, newPassword, confirmPassword } = request.payload || {}

    if (!token) {
      request.yar.flash('tokenExpired', true)
      return h.redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
    }

    // Validate input using schema
    const { error, value } = resetPasswordSchema.validate(
      { token, newPassword, confirmPassword },
      { abortEarly: false }
    )

    if (error) {
      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(LOCALE_KEYS.PASSWORD_RESET),
        fieldErrors: extractJoiErrors(error),
        token,
        errorCode: '',
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }

    try {
      const result = await resetPassword(
        value.token,
        value.newPassword,
        value.confirmPassword
      )

      if (!result.success) {
        return handleResetError(result, token, request, h)
      }

      // Success - redirect to success page
      request.yar.flash('resetSuccess', true)
      return h.redirect(ROUTES.RESET_PASSWORD_SUCCESS)
    } catch (err) {
      request.server.logger.error({ err }, 'Reset password error')
      return h.view(AUTH_VIEWS.RESET_PASSWORD, {
        pageTitle: request.t(LOCALE_KEYS.PASSWORD_RESET),
        fieldErrors: {},
        errorCode: VIEW_ERROR_CODES.NETWORK_ERROR,
        token,
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }
  }
}

/**
 * Handle API errors from reset password
 */
function handleResetError(result, token, request, h) {
  const errorData = result.errors?.[0]

  // Token expired or invalid - redirect to token expired page
  if (
    errorData?.errorCode === 'AUTH_PASSWORD_RESET_EXPIRED_TOKEN' ||
    errorData?.errorCode === 'AUTH_PASSWORD_RESET_INVALID_TOKEN'
  ) {
    request.yar.flash('tokenExpired', true)
    return h.redirect(ROUTES.RESET_PASSWORD_TOKEN_EXPIRED)
  }

  // Password same as current
  if (errorData?.errorCode === 'AUTH_PASSWORD_RESET_SAME_AS_CURRENT') {
    return h.view(AUTH_VIEWS.RESET_PASSWORD, {
      pageTitle: request.t(LOCALE_KEYS.PASSWORD_RESET),
      fieldErrors: { newPassword: 'PASSWORD_SAME_AS_CURRENT' },
      token,
      errorCode: '',
      ERROR_CODES: VIEW_ERROR_CODES
    })
  }

  // Password was used previously
  if (
    errorData?.errorCode === 'AUTH_PASSWORD_RESET_PASSWORD_WAS_USED_PREVIOUSLY'
  ) {
    return h.view(AUTH_VIEWS.RESET_PASSWORD, {
      pageTitle: request.t(LOCALE_KEYS.PASSWORD_RESET),
      fieldErrors: { newPassword: 'PASSWORD_USED_PREVIOUSLY' },
      token,
      errorCode: '',
      ERROR_CODES: VIEW_ERROR_CODES
    })
  }

  // Generic error
  return h.view(AUTH_VIEWS.RESET_PASSWORD, {
    pageTitle: request.t(LOCALE_KEYS.PASSWORD_RESET),
    fieldErrors: {},
    errorCode: errorData?.errorCode || VIEW_ERROR_CODES.UNKNOWN_ERROR,
    token,
    ERROR_CODES: VIEW_ERROR_CODES
  })
}

/**
 * GET /reset-password/success - Show success page
 */
export const resetPasswordSuccessController = {
  handler(request, h) {
    // Check flash session for access control
    const flashSuccess = request.yar.flash('resetSuccess')

    if (!flashSuccess?.[0]) {
      return h.redirect(ROUTES.LOGIN)
    }

    return h.view(AUTH_VIEWS.RESET_PASSWORD_SUCCESS, {
      pageTitle: request.t('auth.reset_password_success.title')
    })
  }
}

/**
 * GET /reset-password/token-expired - Show token expired page
 */
export const resetPasswordTokenExpiredController = {
  handler(request, h) {
    // Check flash session for access control
    const flashExpired = request.yar.flash('tokenExpired')

    if (!flashExpired?.[0]) {
      return h.redirect(ROUTES.FORGOT_PASSWORD)
    }

    return h.view(AUTH_VIEWS.RESET_PASSWORD_TOKEN_EXPIRED, {
      pageTitle: request.t('auth.reset_password_token_expired.title')
    })
  }
}
