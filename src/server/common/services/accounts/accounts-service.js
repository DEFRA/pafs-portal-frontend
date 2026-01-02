import { apiRequest } from '../../helpers/api-client/index.js'
import { ACCOUNT_STATUS } from '../../constants/accounts.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'
import { PAGINATION } from '../../constants/common.js'

function buildAccountsQueryParams({ status, search, areaId, page, pageSize }) {
  const queryParams = new URLSearchParams()

  queryParams.append('status', status)
  queryParams.append('page', String(page))
  queryParams.append('pageSize', String(pageSize))

  if (search?.trim()) {
    queryParams.append('search', search.trim())
  }

  if (areaId) {
    queryParams.append('areaId', areaId)
  }

  return queryParams
}

async function getFromCache(cacheService, cacheParams) {
  if (!cacheService) {
    return null
  }
  return cacheService.get(cacheParams)
}

async function storeInCache(cacheService, cacheParams, result) {
  if (cacheService && result.success) {
    await cacheService.set(cacheParams, result)
  }
}

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
  const cached = await getFromCache(cacheService, cacheParams)
  if (cached) {
    return cached
  }

  const queryParams = buildAccountsQueryParams({
    status,
    search,
    areaId,
    page,
    pageSize: effectivePageSize
  })

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const result = await apiRequest(
    `/api/v1/accounts?${queryParams.toString()}`,
    {
      method: 'GET',
      headers
    }
  )

  // Cache successful responses
  await storeInCache(cacheService, cacheParams, result)

  return result
}

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

export function getPendingCount(accessToken, cacheService) {
  return getAccountsCount(ACCOUNT_STATUS.PENDING, accessToken, cacheService)
}

export function getActiveCount(accessToken, cacheService) {
  return getAccountsCount(ACCOUNT_STATUS.ACTIVE, accessToken, cacheService)
}

export async function validateEmail(email) {
  return apiRequest('/api/v1/validate-email', {
    method: 'POST',
    body: JSON.stringify({ email })
  })
}

export async function upsertAccount(accountData, accessToken = '') {
  return apiRequest('/api/v1/accounts', {
    method: 'POST',
    ...(accessToken && {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }),
    body: JSON.stringify(accountData)
  })
}
