/**
 * Shared listing page helpers
 * Used across users, organisations, and other admin listing pages
 * to avoid code duplication
 */

import { PAGINATION } from '../../../common/constants/common.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  buildGovukPagination,
  getDefaultPageSize
} from '../../../common/helpers/pagination/index.js'

/**
 * Build request context for listing pages
 * Extracts common data like session, flash messages, pagination, and filters
 *
 * @param {Object} request - Hapi request object
 * @param {Array<string>} filterKeys - Filter parameter keys to extract from query
 * @returns {Object} Request context
 */
export function buildListingRequestContext(request, filterKeys = []) {
  const session = getAuthSession(request)
  const logger = request.server.logger

  const successFlash = request.yar?.flash('success') || []
  const errorFlash = request.yar?.flash('error') || []
  const userCreatedFlash = request.yar?.flash('userCreated') || []

  // Prefer userCreated flash for backwards compatibility with users
  const sessionFlashLength = successFlash.length > 0 ? successFlash[0] : null
  const successNotification =
    userCreatedFlash.length > 0 ? userCreatedFlash[0] : sessionFlashLength
  const errorNotification = errorFlash.length > 0 ? errorFlash[0] : null

  const page =
    Number.parseInt(request.query.page, 10) || PAGINATION.DEFAULT_PAGE

  // Build filters object from specified keys
  const filters = {}
  for (const key of filterKeys) {
    filters[key] = request.query[key] || ''
  }

  return {
    session,
    logger,
    successNotification,
    errorNotification,
    page,
    filters
  }
}

/**
 * Build pagination object for listing views
 *
 * @param {Object} pagination - Pagination data from API
 * @param {string} baseUrl - Base URL for pagination links
 * @param {Object} filters - Current filter values
 * @returns {Object} GOV.UK formatted pagination
 */
export function buildListingPagination(pagination, baseUrl, filters) {
  const currentPage =
    pagination.page || pagination.currentPage || PAGINATION.DEFAULT_PAGE
  const totalPages = pagination.totalPages || 0
  const totalItems = pagination.total || 0
  const pageSize = pagination.pageSize || getDefaultPageSize()

  return buildGovukPagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    baseUrl,
    filters
  })
}

/**
 * Build base view model for listing pages
 * Contains common properties shared across all listing views
 *
 * @param {Object} params - View model parameters
 * @param {Object} params.request - Hapi request object
 * @param {Object} params.session - User session
 * @param {string} params.pageTitle - Page title
 * @param {Array} params.items - Formatted items to display
 * @param {Object} params.pagination - Pagination data from API
 * @param {string} params.baseUrl - Base URL for pagination
 * @param {Object} params.filters - Current filter values
 * @param {Object} [params.successNotification] - Success notification
 * @param {Object} [params.errorNotification] - Error notification
 * @param {string} [params.error] - Error message
 * @param {Object} [params.additionalData] - Additional view-specific data
 * @returns {Object} View model
 */
export function buildListingViewModel({
  _request,
  session,
  pageTitle,
  _items,
  pagination,
  baseUrl,
  filters,
  successNotification,
  errorNotification,
  error,
  additionalData = {}
}) {
  return {
    pageTitle,
    user: session?.user,
    pagination: buildListingPagination(pagination, baseUrl, filters),
    filters,
    baseUrl,
    ...(error && { error }),
    ...(successNotification && { successNotification }),
    ...(errorNotification && { errorNotification }),
    ...additionalData
  }
}

/**
 * Create empty view model for error cases
 *
 * @param {Object} params - View model parameters
 * @returns {Object} Empty view model
 */
export function buildEmptyListingViewModel(params) {
  return buildListingViewModel({
    ...params,
    items: [],
    pagination: {
      page: PAGINATION.DEFAULT_PAGE,
      totalPages: 0,
      total: 0,
      pageSize: getDefaultPageSize()
    }
  })
}
