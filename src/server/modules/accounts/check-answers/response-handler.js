import {
  ENCODED_ID_PLACEHOLDER,
  ACCOUNT_STATUS
} from '../../../common/constants/accounts.js'
import {
  ACCOUNT_VIEWS,
  VIEW_ERROR_CODES
} from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  extractApiValidationErrors,
  extractApiError
} from '../../../common/helpers/error-renderer/index.js'
import { createAccountsCacheService } from '../../../common/services/accounts/accounts-cache.js'
import { clearEditSession } from '../helpers/navigation-helper.js'

/**
 * Handles API error responses during account submission
 */
export function handleApiError(controller, context) {
  const {
    request,
    h,
    isAdmin,
    sessionData,
    areaDetails,
    parentAreasDisplay,
    apiResponse
  } = context

  request.server.logger.error({ apiResponse }, 'API returned error response')

  // Check for backend validation errors first
  if (apiResponse.validationErrors) {
    return h.view(
      ACCOUNT_VIEWS.CHECK_ANSWERS,
      controller.buildViewData(
        request,
        isAdmin,
        sessionData,
        areaDetails,
        parentAreasDisplay,
        {
          fieldErrors: extractApiValidationErrors(apiResponse)
        }
      )
    )
  }

  // Handle general API errors
  const apiError = extractApiError(apiResponse)
  return h.view(
    ACCOUNT_VIEWS.CHECK_ANSWERS,
    controller.buildViewData(
      request,
      isAdmin,
      sessionData,
      areaDetails,
      parentAreasDisplay,
      {
        errorCode: apiError?.errorCode || VIEW_ERROR_CODES.NETWORK_ERROR
      }
    )
  )
}

/**
 * Invalidate account caches after create/update
 */
export async function invalidateAccountCache(
  request,
  isEditMode,
  apiResponse,
  sessionData
) {
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
 */
export function handleEditSuccess(request, h, sessionData, encodedId) {
  const { firstName, lastName } = sessionData

  request.yar.flash('success', {
    title: request.t('accounts.view_user.notifications.updated_title'),
    message: request.t('accounts.view_user.notifications.updated_message', {
      userName: `${firstName} ${lastName}`
    })
  })

  clearEditSession(request)
  return h.redirect(
    ROUTES.ADMIN.USER_VIEW.replace(ENCODED_ID_PLACEHOLDER, encodedId)
  )
}

/**
 * Handle successful account creation in admin mode
 */
export function handleCreateSuccess(
  request,
  h,
  sessionKey,
  sessionData,
  apiResponse
) {
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
 */
export function handleUserSuccess(request, h, sessionKey, sessionData, status) {
  request.yar.set(sessionKey, { ...sessionData, submissionStatus: status })
  return h.redirect(ROUTES.GENERAL.ACCOUNTS.CONFIRMATION)
}

/**
 * Route success response based on user type and context
 */
export async function handleSuccess(_controller, context) {
  const {
    request,
    h,
    isAdmin,
    sessionKey,
    sessionData,
    apiResponse,
    isEditMode
  } = context
  const { encodedId } = context

  const status = apiResponse.data?.status || ACCOUNT_STATUS.PENDING

  // Invalidate caches
  await invalidateAccountCache(request, isEditMode, apiResponse, sessionData)

  // Handle different flows
  if (isAdmin) {
    if (isEditMode) {
      return handleEditSuccess(request, h, sessionData, encodedId)
    }
    return handleCreateSuccess(request, h, sessionKey, sessionData, apiResponse)
  }

  return handleUserSuccess(request, h, sessionKey, sessionData, status)
}

/**
 * Handle unexpected errors during submission
 */
export function handleUnexpectedError(controller, context) {
  const {
    request,
    h,
    isAdmin,
    sessionData,
    areaDetails,
    parentAreasDisplay,
    error
  } = context

  request.server.logger.error(
    { error },
    'Unexpected error during account submission'
  )

  return h.view(
    ACCOUNT_VIEWS.CHECK_ANSWERS,
    controller.buildViewData(
      request,
      isAdmin,
      sessionData,
      areaDetails,
      parentAreasDisplay,
      {
        errorCode: VIEW_ERROR_CODES.NETWORK_ERROR
      }
    )
  )
}
