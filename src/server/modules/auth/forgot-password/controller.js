import { forgotPassword } from '../../../common/services/auth/auth-service.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { VIEW_ERROR_CODES } from '../../../common/constants/validation.js'
import { AUTH_VIEWS } from '../../../common/constants/common.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { forgotPasswordSchema } from '../schema.js'

/**
 * GET /forgot-password - Show forgot password form
 */
export const forgotPasswordController = {
  handler(request, h) {
    return h.view(AUTH_VIEWS.FORGOT_PASSWORD, {
      pageTitle: request.t('auth.forgot_password.title'),
      fieldErrors: {},
      email: '',
      ERROR_CODES: VIEW_ERROR_CODES
    })
  }
}

/**
 * POST /forgot-password - Process forgot password request
 */
export const forgotPasswordPostController = {
  async handler(request, h) {
    const { email = '' } = request.payload || {}

    // Validate input
    const { error, value } = forgotPasswordSchema.validate(
      { email },
      { abortEarly: false }
    )
    if (error) {
      return h.view(AUTH_VIEWS.FORGOT_PASSWORD, {
        pageTitle: request.t('auth.forgot_password.title'),
        fieldErrors: extractJoiErrors(error),
        email,
        ERROR_CODES: VIEW_ERROR_CODES
      })
    }

    try {
      await forgotPassword(value.email)
    } catch (err) {
      request.server.logger.error({ err }, 'Forgot password error')
    }

    // Store email in session for confirmation page
    request.yar.flash('resetEmail', value.email)
    return h.redirect(ROUTES.FORGOT_PASSWORD_CONFIRMATION)
  }
}

/**
 * GET /forgot-password/confirmation - Show confirmation page
 */
export const forgotPasswordConfirmationController = {
  handler(request, h) {
    // Get email from flash session (one-time read)
    const flashEmail = request.yar.flash('resetEmail')
    const email = flashEmail?.[0] || ''

    // Prevent direct access - must come from forgot password form
    if (!email) {
      return h.redirect(ROUTES.FORGOT_PASSWORD)
    }

    return h.view(AUTH_VIEWS.FORGOT_PASSWORD_REQUEST_CONFIRMATION, {
      pageTitle: request.t('auth.forgot_password_confirmation.title'),
      email
    })
  }
}
