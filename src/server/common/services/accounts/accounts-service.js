import { apiRequest } from '../../helpers/api-client.js'
import { ACCOUNT_STATUS } from '../../constants/accounts.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'
import { PAGINATION } from '../../constants/common.js'

/**
 * Fetch accounts from the backend API
 *
 * @param {Object} params - Query parameters
 * @param {string} params.status - Account status ('pending' or 'active')
 * @param {string} [params.search] - Search query for name/email
 * @param {string} [params.areaId] - Filter by area ID
 * @param {number} [params.page] - Page number (default: 1)
 * @param {number} [params.pageSize] - Page size (default: 20)
 * @param {string} [params.accessToken] - Access token for authorization
 * @param {Object} [params.cacheService] - Optional cache service instance
 * @returns {Promise<Object>} API response with accounts data
 */
export async function getAccounts({
  status,
  search,
  areaId,
  page = PAGINATION.DEFAULT_PAGE,
  pageSize,
  accessToken,
  cacheService
}) {
  const effectivePageSize = pageSize || getDefaultPageSize()
  const cacheParams = {
    status,
    search: search || '',
    areaId: areaId || '',
    page
  }

  // Try to get from cache first
  if (cacheService) {
    const cached = await cacheService.get(cacheParams)
    if (cached) {
      return cached
    }
  }

  const queryParams = new URLSearchParams()

  queryParams.append('status', status)
  queryParams.append('page', String(page))
  queryParams.append('pageSize', String(effectivePageSize))

  if (search && search.trim()) {
    queryParams.append('search', search.trim())
  }

  if (areaId) {
    queryParams.append('areaId', areaId)
  }

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const result = await apiRequest(
    `/api/v1/accounts?${queryParams.toString()}`,
    {
      method: 'GET',
      headers
    }
  )

  // Cache successful responses
  if (result.success && cacheService) {
    await cacheService.set(cacheParams, result)
  }

  return result
}

/**
 * Get accounts count by status
 *
 * @param {string} status - Account status ('pending' or 'active')
 * @param {string} [accessToken] - Access token for authorization
 * @param {Object} [cacheService] - Optional cache service instance
 * @returns {Promise<number>} Count of accounts
 */
export async function getAccountsCount(status, accessToken, cacheService) {
  const cacheKey = `count:${status}`

  // Try to get from cache first
  if (cacheService) {
    const cached = await cacheService.getByKey(cacheKey)
    if (cached !== null) {
      return cached
    }
  }

  const result = await getAccounts({
    status,
    page: 1,
    pageSize: 1,
    accessToken
    // Don't pass cacheService here to avoid double caching
  })

  const count = result.success ? result.data?.pagination?.total || 0 : 0

  // Cache the count
  if (cacheService) {
    await cacheService.setByKey(cacheKey, count)
  }

  return count
}

/**
 * Get pending accounts count
 *
 * @param {string} [accessToken] - Access token for authorization
 * @param {Object} [cacheService] - Optional cache service instance
 * @returns {Promise<number>} Count of pending accounts
 */
export function getPendingCount(accessToken, cacheService) {
  return getAccountsCount(ACCOUNT_STATUS.PENDING, accessToken, cacheService)
}

/**
 * Get active accounts count
 *
 * @param {string} [accessToken] - Access token for authorization
 * @param {Object} [cacheService] - Optional cache service instance
 * @returns {Promise<number>} Count of active accounts
 */
export function getActiveCount(accessToken, cacheService) {
  return getAccountsCount(ACCOUNT_STATUS.ACTIVE, accessToken, cacheService)
}
