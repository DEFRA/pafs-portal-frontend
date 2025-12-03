/**
 * Common pagination helper for GOV.UK Frontend pagination component
 * Implements the GOV.UK Design System pagination pattern:
 * https://design-system.service.gov.uk/components/pagination/
 *
 */

import { config } from '../../../../config/config.js'
import { PAGINATION } from '../../constants/common.js'

export function getDefaultPageSize() {
  return config.get('pagination.defaultPageSize')
}

export function buildPaginationUrl(baseUrl, params) {
  const queryParts = Object.entries(params)
    .filter(
      ([, value]) => value !== undefined && value !== null && value !== ''
    )
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)

  return queryParts.length > 0 ? `${baseUrl}?${queryParts.join('&')}` : baseUrl
}

function createPageItem(pageNumber, currentPage, baseUrl, filters) {
  return {
    number: String(pageNumber),
    href: buildPaginationUrl(baseUrl, { page: pageNumber, ...filters }),
    current: currentPage === pageNumber
  }
}

function calculateSummary(currentPage, pageSize, totalItems) {
  const startItem = (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  return { startItem, endItem, totalItems }
}

function buildNavLinks(currentPage, totalPages, baseUrl, filters) {
  const previous =
    currentPage > 1
      ? {
          href: buildPaginationUrl(baseUrl, {
            page: currentPage - 1,
            ...filters
          })
        }
      : undefined

  const next =
    currentPage < totalPages
      ? {
          href: buildPaginationUrl(baseUrl, {
            page: currentPage + 1,
            ...filters
          })
        }
      : undefined

  return { previous, next }
}

function buildStartItems(currentPage, totalPages, createItem) {
  // Build pages 1 to currentPage+1, then ellipsis and last page
  const pageNumbers = Array.from({ length: currentPage + 1 }, (_, i) => i + 1)

  return [
    ...pageNumbers.map(createItem),
    { ellipsis: true },
    createItem(totalPages)
  ]
}

function buildEndItems(currentPage, totalPages, createItem) {
  // Build pages from currentPage-1 to totalPages
  const startPage = currentPage - 1
  const pageNumbers = Array.from(
    { length: totalPages - startPage + 1 },
    (_, i) => startPage + i
  )

  return [createItem(1), { ellipsis: true }, ...pageNumbers.map(createItem)]
}

function buildMiddleItems(currentPage, totalPages, createItem) {
  // First page, ellipsis, surrounding pages, ellipsis, last page
  return [
    createItem(1),
    { ellipsis: true },
    createItem(currentPage - 1),
    createItem(currentPage),
    createItem(currentPage + 1),
    { ellipsis: true },
    createItem(totalPages)
  ]
}

/**
 * Build page items following GOV.UK Design System pattern:
 * [1] 2 … 100      (page 1)
 * 1 [2] 3 … 100    (page 2)
 * 1 2 [3] 4 … 100  (page 3)
 * 1 2 3 [4] 5 … 100 (page 4)
 * 1 … 4 [5] 6 … 100 (page 5 onwards, middle)
 * 1 … 97 [98] 99 100 (page 98)
 * 1 … 98 [99] 100   (page 99)
 * 1 … 99 [100]      (page 100)
 *
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} baseUrl - Base URL
 * @param {Object} filters - Filter parameters
 * @returns {Array} Array of page items
 */
function buildPageItems(currentPage, totalPages, baseUrl, filters) {
  const createItem = (page) =>
    createPageItem(page, currentPage, baseUrl, filters)

  // For small page counts, show all pages without ellipsis
  if (totalPages <= PAGINATION.MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => createItem(i + 1))
  }

  // Near the start (pages 1-4)
  if (currentPage <= PAGINATION.START_THRESHOLD) {
    return buildStartItems(currentPage, totalPages, createItem)
  }

  // Near the end (last 4 pages)
  if (currentPage >= totalPages - PAGINATION.END_OFFSET) {
    return buildEndItems(currentPage, totalPages, createItem)
  }

  // Middle pages
  return buildMiddleItems(currentPage, totalPages, createItem)
}

export function buildGovukPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  baseUrl,
  filters = {}
}) {
  const effectivePageSize = pageSize || getDefaultPageSize()

  // No pagination needed for single page or empty results
  if (totalPages <= 1) {
    return {
      summary:
        totalItems > 0
          ? calculateSummary(1, effectivePageSize, totalItems)
          : null
    }
  }

  const items = buildPageItems(currentPage, totalPages, baseUrl, filters)
  const { previous, next } = buildNavLinks(
    currentPage,
    totalPages,
    baseUrl,
    filters
  )
  const summary = calculateSummary(currentPage, effectivePageSize, totalItems)

  return { items, previous, next, summary }
}
