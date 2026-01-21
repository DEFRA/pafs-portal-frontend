/**
 * User formatting and helper utilities
 * Shared between pending and active user controllers
 */

import {
  AREAS_LABELS,
  AREAS_RESPONSIBILITIES_MAP,
  PAGINATION
} from '../../../../common/constants/common.js'
import {
  buildGovukPagination,
  getDefaultPageSize
} from '../../../../common/helpers/pagination/index.js'
import { encodeUserId } from '../../../../common/helpers/security/encoder.js'

/**
 * Get primary area name from user areas array
 *
 * @param {Array} areas - User areas array
 * @returns {string|null} Primary area name or null
 */
export function getPrimaryAreaName(areas) {
  if (!areas || areas.length === 0) {
    return null
  }

  const primaryArea = areas.find((area) => area.primary)
  return primaryArea ? primaryArea.name : areas[0].name
}

/**
 * Format user for display in lists
 *
 * @param {Object} user - User object from API
 * @returns {Object} Formatted user for display
 */
export function formatUserForDisplay(user) {
  const isAdmin = user.admin || false
  return {
    id: encodeUserId(user.id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    isAdmin,
    primaryArea: isAdmin ? '-' : getPrimaryAreaName(user.areas),
    createdAt: user.createdAt,
    lastSignIn: user.lastSignIn || null,
    status: user.status,
    invitationSentAt: user.invitationSentAt,
    invitationAcceptedAt: user.invitationAcceptedAt
  }
}

/**
 * Format users array for display
 *
 * @param {Array} users - Users array from API
 * @returns {Array} Formatted users for display
 */
export function formatUsersForDisplay(users) {
  return users.map(formatUserForDisplay)
}

/**
 * Get area filter options
 * Returns 'All areas' option plus grouped areas (EA, PSO, RMA)
 *
 * @param {Function} t - Translation function
 * @param {Object} areasByType - Areas data structure from cache
 * @returns {Array} Area options for dropdown with grouping
 */
export function getAreaFilterOptions(t, areasByType) {
  const options = [
    { value: '', text: t('accounts.manage_users.filters.all_areas') }
  ]

  if (!areasByType) {
    return options
  }

  // Add EA areas as a group
  const eaAreas = areasByType[AREAS_RESPONSIBILITIES_MAP.EA] || []
  if (eaAreas.length > 0) {
    options.push({
      label: AREAS_LABELS.EA,
      options: eaAreas.map((area) => ({
        value: area.id,
        text: area.name
      }))
    })
  }

  // Add PSO areas as a group
  const psoAreas = areasByType[AREAS_RESPONSIBILITIES_MAP.PSO] || []
  if (psoAreas.length > 0) {
    options.push({
      label: AREAS_LABELS.PSO,
      options: psoAreas.map((area) => ({
        value: area.id,
        text: area.name
      }))
    })
  }

  // Add RMA areas as a group
  const rmaAreas = areasByType[AREAS_RESPONSIBILITIES_MAP.RMA] || []
  if (rmaAreas.length > 0) {
    options.push({
      label: AREAS_LABELS.RMA,
      options: rmaAreas.map((area) => ({
        value: area.id,
        text: area.name
      }))
    })
  }

  return options
}

/**
 * Build view model for users listing page
 *
 * @param {Object} params - Parameters for building view model
 * @param {Object} params.request - Hapi request object
 * @param {Object} params.session - User session
 * @param {Array} params.users - Formatted users array
 * @param {Object} params.pagination - Pagination data from API
 * @param {number} params.pendingCount - Pending users count
 * @param {number} params.activeCount - Active users count
 * @param {Object} params.filters - Current filter values
 * @param {string} params.currentTab - Current tab ('pending' or 'active')
 * @param {string} params.baseUrl - Base URL for form and pagination
 * @param {Object} [params.areasByType] - Areas data structure from cache
 * @param {string} [params.error] - Error message if any
 * @param {Object} [params.successNotification] - Success notification data
 * @param {Object} [params.errorNotification] - Error notification data
 * @returns {Object} View model
 */
export function buildUsersViewModel({
  request,
  session,
  users,
  pagination,
  pendingCount,
  activeCount,
  filters,
  currentTab,
  baseUrl,
  areasByType,
  error,
  successNotification,
  errorNotification
}) {
  const currentPage =
    pagination.page || pagination.currentPage || PAGINATION.DEFAULT_PAGE
  const totalPages = pagination.totalPages || 0
  const totalItems = pagination.total || 0
  const pageSize = pagination.pageSize || getDefaultPageSize()

  return {
    pageTitle: request.t('accounts.manage_users.title'),
    user: session?.user,
    users,
    pagination: buildGovukPagination({
      currentPage,
      totalPages,
      totalItems,
      pageSize,
      baseUrl,
      filters
    }),
    pendingCount,
    activeCount,
    filters,
    areas: getAreaFilterOptions(request.t, areasByType),
    currentTab,
    baseUrl,
    tabUrls: {
      pending: '/admin/users/pending',
      active: '/admin/users/active'
    },
    ...(error && { error }),
    ...(successNotification && { successNotification }),
    ...(errorNotification && { errorNotification })
  }
}

/**
 * Get empty users view model for error cases
 *
 * @param {Object} params - Parameters
 * @param {Object} params.request - Hapi request object
 * @param {Object} params.session - User session
 * @param {Object} params.filters - Current filter values
 * @param {string} params.currentTab - Current tab
 * @param {string} params.baseUrl - Base URL
 * @param {Object} [params.areasByType] - Areas data structure from cache
 * @param {string} params.error - Error message
 * @param {Object} [params.successNotification] - Success notification data
 * @param {Object} [params.errorNotification] - Error notification data
 * @returns {Object} Empty view model
 */
export function getEmptyUsersViewModel({
  request,
  session,
  filters,
  currentTab,
  baseUrl,
  areasByType,
  error,
  successNotification,
  errorNotification
}) {
  return buildUsersViewModel({
    request,
    session,
    users: [],
    pagination: {
      page: PAGINATION.DEFAULT_PAGE,
      totalPages: 0,
      total: 0,
      pageSize: getDefaultPageSize()
    },
    pendingCount: 0,
    activeCount: 0,
    filters,
    currentTab,
    baseUrl,
    areasByType,
    error,
    successNotification,
    errorNotification
  })
}
