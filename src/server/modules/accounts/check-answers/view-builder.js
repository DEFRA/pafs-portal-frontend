import { ROUTES } from '../../../common/constants/routes.js'
import {
  ENCODED_ID_PLACEHOLDER,
  CHECK_ANSWERS_LOCALE_KEYS
} from '../../../common/constants/accounts.js'

/**
 * Build action routes for user management
 */
export function buildActionRoutes(encodedId) {
  return {
    approve: ROUTES.ADMIN.USER_ACTIONS.APPROVE.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    delete: ROUTES.ADMIN.USER_ACTIONS.DELETE.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    resendInvitation: ROUTES.ADMIN.USER_ACTIONS.RESEND_INVITATION.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    reactivate: ROUTES.ADMIN.USER_ACTIONS.REACTIVATE.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    )
  }
}

/**
 * Determine account status flags
 */
export function determineStatusFlags(
  accountStatus,
  accountDisabled,
  invitationAcceptedAt
) {
  return {
    isPending: accountStatus === 'pending',
    isActive: accountStatus === 'active' || accountStatus === 'approved',
    isDisabled: accountDisabled,
    hasAcceptedInvitation: !!invitationAcceptedAt
  }
}

/**
 * Build view mode specific properties
 */
export function buildViewModeProperties(options) {
  const {
    accountStatus,
    accountDisabled,
    invitationAcceptedAt,
    createdAt,
    invitationSentAt,
    lastSignIn,
    encodedId
  } = options

  const statusFlags = determineStatusFlags(
    accountStatus,
    accountDisabled,
    invitationAcceptedAt
  )

  const accountInfo = {
    createdAt,
    invitationSentAt,
    invitationAcceptedAt,
    lastSignIn
  }

  return {
    isViewMode: true,
    encodedId,
    ...statusFlags,
    backLink: statusFlags.isPending
      ? ROUTES.ADMIN.USERS_PENDING
      : ROUTES.ADMIN.USERS_ACTIVE,
    accountInfo,
    actionRoutes: buildActionRoutes(encodedId)
  }
}

/**
 * Get locale key based on admin context
 */
export function getLocaleKey(isAdmin) {
  return isAdmin
    ? CHECK_ANSWERS_LOCALE_KEYS.ADMIN
    : CHECK_ANSWERS_LOCALE_KEYS.USER
}

/**
 * Get responsibility in lowercase format
 */
export function getResponsibilityLower(responsibility) {
  return responsibility ? responsibility.toLowerCase() : ''
}

/**
 * Get responsibility label with translation
 */
export function getResponsibilityLabel(
  request,
  responsibility,
  responsibilityLower
) {
  return responsibility
    ? request.t(`accounts.label.responsibility.${responsibilityLower}`)
    : ''
}

/**
 * Get routes for edit mode
 */
export function getEditRoutes(encodedId) {
  const editRoutes = ROUTES.ADMIN.ACCOUNTS.EDIT
  return {
    submitRoute: editRoutes.CHECK_ANSWERS.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    detailsRoute: editRoutes.DETAILS.replace(ENCODED_ID_PLACEHOLDER, encodedId),
    mainAreaRoute: editRoutes.MAIN_AREA.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    additionalAreasRoute: editRoutes.ADDITIONAL_AREAS.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    parentAreasEaRoute: editRoutes.PARENT_AREAS.replace('{type}', 'ea').replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    parentAreasPsoRoute: editRoutes.PARENT_AREAS.replace(
      '{type}',
      'pso'
    ).replace(ENCODED_ID_PLACEHOLDER, encodedId),
    isAdminRoute: editRoutes.IS_ADMIN.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    ),
    cancelRoute: ROUTES.ADMIN.USER_VIEW.replace(
      ENCODED_ID_PLACEHOLDER,
      encodedId
    )
  }
}

/**
 * Get routes for create mode
 */
export function getCreateRoutes(isAdmin) {
  const baseRoutes = isAdmin ? ROUTES.ADMIN.ACCOUNTS : ROUTES.GENERAL.ACCOUNTS

  return {
    submitRoute: baseRoutes.CHECK_ANSWERS,
    detailsRoute: baseRoutes.DETAILS,
    mainAreaRoute: baseRoutes.MAIN_AREA,
    additionalAreasRoute: baseRoutes.ADDITIONAL_AREAS,
    parentAreasEaRoute: baseRoutes.PARENT_AREAS_EA,
    parentAreasPsoRoute: baseRoutes.PARENT_AREAS_PSO,
    isAdminRoute: isAdmin ? baseRoutes.IS_ADMIN : null
  }
}

/**
 * Get appropriate routes based on context
 */
export function getRoutes(
  isAdmin,
  isEditMode = false,
  encodedId = null,
  isViewMode = false
) {
  if ((isEditMode || isViewMode) && encodedId) {
    return getEditRoutes(encodedId)
  }
  return getCreateRoutes(isAdmin)
}

/**
 * Get page title based on context
 */
export function getPageTitle(
  request,
  isViewMode,
  isEditMode,
  sessionData,
  localeKey
) {
  if (isViewMode) {
    return `${request.t('accounts.view_user.title')} - ${sessionData.firstName} ${sessionData.lastName}`
  }
  if (isEditMode) {
    return request.t(`accounts.${localeKey}.check_answers.edit_title`)
  }
  return request.t(`accounts.${localeKey}.check_answers.title`)
}
