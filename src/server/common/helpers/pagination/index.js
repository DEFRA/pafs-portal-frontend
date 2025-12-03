/**
 * Common pagination helper for GOV.UK Frontend pagination component
 * @module common/helpers/pagination
 */

import { config } from '../../../../config/config.js'

/**
 * Build URL with query parameters for pagination links
 *
 * @param {string} baseUrl - Base URL
 * @param {Object} params - Query parameters
 * @returns {string} URL with query string
 */
export function buildPaginationUrl(baseUrl, params) {
  const queryParts = []

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParts.push(`${key}=${encodeURIComponent(value)}`)
    }
  })

  return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl
}

/**
 * Build GOV.UK pagination data structure
 *
 * @param {Object} params - Pagination parameters
 * @param {number} params.currentPage - Current page number
 * @param {number} params.totalPages - Total number of pages
 * @param {number} params.totalItems - Total number of items
 * @param {number} [params.pageSize] - Items per page (defaults to config value)
 * @param {string} params.baseUrl - Base URL for links
 * @param {Object} [params.filters] - Current filter values to preserve in URLs
 * @returns {Object} GOV.UK pagination structure
 */
export function buildGovukPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  baseUrl,
  filters = {}
}) {
  const effectivePageSize = pageSize || config.get('pagination.defaultPageSize')

  if (totalPages <= 1) {
    return {
      summary:
        totalItems > 0
          ? {
              startItem: 1,
              endItem: totalItems,
              totalItems
            }
          : null
    }
  }

  const items = []

  // Always show first page
  items.push({
    number: '1',
    href: buildPaginationUrl(baseUrl, { page: 1, ...filters }),
    current: currentPage === 1
  })

  // Add ellipsis before current range if needed
  if (currentPage > 3) {
    items.push({ ellipsis: true })
  }

  // Add pages around current page
  for (
    let i = Math.max(2, currentPage - 1);
    i <= Math.min(totalPages - 1, currentPage + 1);
    i++
  ) {
    if (i > 1 && i < totalPages) {
      items.push({
        number: String(i),
        href: buildPaginationUrl(baseUrl, { page: i, ...filters }),
        current: currentPage === i
      })
    }
  }

  // Add ellipsis after current range if needed
  if (currentPage < totalPages - 2) {
    items.push({ ellipsis: true })
  }

  // Always show last page
  if (totalPages > 1) {
    items.push({
      number: String(totalPages),
      href: buildPaginationUrl(baseUrl, { page: totalPages, ...filters }),
      current: currentPage === totalPages
    })
  }

  // Calculate summary values
  const startItem = (currentPage - 1) * effectivePageSize + 1
  const endItem = Math.min(currentPage * effectivePageSize, totalItems)

  return {
    items,
    previous:
      currentPage > 1
        ? {
            href: buildPaginationUrl(baseUrl, {
              page: currentPage - 1,
              ...filters
            })
          }
        : undefined,
    next:
      currentPage < totalPages
        ? {
            href: buildPaginationUrl(baseUrl, {
              page: currentPage + 1,
              ...filters
            })
          }
        : undefined,
    summary: {
      startItem,
      endItem,
      totalItems
    }
  }
}

/**
 * Get default page size from config
 *
 * @returns {number} Default page size
 */
export function getDefaultPageSize() {
  return config.get('pagination.defaultPageSize')
}
