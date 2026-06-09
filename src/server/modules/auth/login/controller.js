import { login } from '../../../common/services/auth/auth-service.js'
import { setAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { AUTH_VIEWS, LOCALE_KEYS } from '../../../common/constants/common.js'
import { VIEW_ERROR_CODES } from '../../../common/constants/validation.js'
import { loginSchema } from '../schema.js'
import {
  extractJoiErrors,
  extractApiValidationErrors,
  extractApiError
} from '../../../common/helpers/error-renderer/index.js'
import { invalidateAccountsCacheOnAuth } from '../helpers/cache-invalidation.js'

function renderLogin(request, h, overrides = {}) {
  return h.view(AUTH_VIEWS.LOGIN, {
    pageTitle: request.t(LOCALE_KEYS.SIGN_IN),
    errorCode: '',
    warningCode: '',
    supportCode: '',
    fieldErrors: {},
    ERROR_CODES: VIEW_ERROR_CODES,
    ...overrides
  })
}

function handleLoginFailure(request, h, result, email) {
  if (result.validationErrors) {
    return renderLogin(request, h, {
      fieldErrors: extractApiValidationErrors(result),
      email
    })
  }
  const apiError = extractApiError(result)
  return renderLogin(request, h, {
    errorCode: apiError?.errorCode,
    warningCode: apiError?.warningCode || '',
    supportCode: apiError?.supportCode || '',
    email
  })
}

function resolvePostLoginRedirect(request, result) {
  const returnTo = request.yar.get('returnTo')
  request.yar.set('returnTo', null)
  const isAdmin = result.data.user.admin
  if (
    returnTo &&
    typeof returnTo === 'string' &&
    returnTo.startsWith('/') &&
    !returnTo.startsWith('//') &&
    !(isAdmin && returnTo === ROUTES.GENERAL.HOME)
  ) {
    return returnTo
  }
  return isAdmin ? ROUTES.ADMIN.JOURNEY_SELECTION : ROUTES.GENERAL.HOME
}

export const loginController = {
  handler(request, h) {
    const flashAuthError = request.yar.flash('authError')
    const authError = flashAuthError?.[0] || ''

    return renderLogin(request, h, { errorCode: authError })
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
      return renderLogin(request, h, {
        fieldErrors: extractJoiErrors(error),
        email
      })
    }

    try {
      const result = await login(value.email, value.password)

      if (!result.success) {
        request.metrics.counter('authEvent', 1, { outcome: 'failure' })
        return handleLoginFailure(request, h, result, email)
      }

      setAuthSession(request, result.data)
      request.metrics.counter('authEvent', 1, { outcome: 'success' })
      invalidateAccountsCacheOnAuth(request, 'login').catch((err) => {
        request.server.logger.warn(
          { err },
          'Background cache invalidation failed on login'
        )
      })

      return h.redirect(resolvePostLoginRedirect(request, result))
    } catch (err) {
      request.server.logger.error({ err }, 'Login error')
      return renderLogin(request, h, {
        errorCode: VIEW_ERROR_CODES.NETWORK_ERROR,
        email
      })
    }
  }
}
