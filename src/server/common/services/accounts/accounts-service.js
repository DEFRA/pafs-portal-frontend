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

async function tryGetFromCache(cacheService, cacheParams) {
  if (!cacheService) {
    return { metadata: null, data: null }
  }

  const metadata = await cacheService.getListMetadata(cacheParams)

  if (!metadata || !metadata.accountIds) {
    return { metadata: null, data: null }
  }

  const cachedAccounts = await cacheService.getAccountsByIds(
    metadata.accountIds
  )

  const allAccountsCached = cachedAccounts.every((account) => account !== null)
  if (!allAccountsCached) {
    return { metadata: null, data: null }
  }

  return { metadata, data: cachedAccounts }
}

async function storeInCache(cacheService, cacheParams, accounts, pagination) {
  if (!cacheService || !accounts || accounts.length === 0) {
    return
  }

  await cacheService.setAccounts(accounts)

  const accountIds = accounts
    .map((account) => account.id || account.userId)
    .filter(Boolean)
  await cacheService.setListMetadata(cacheParams, accountIds, pagination)
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
    page,
    pageSize: effectivePageSize
  }

  const { metadata, data } = await tryGetFromCache(cacheService, cacheParams)
  if (metadata && data) {
    return {
      success: true,
      data: {
        data,
        pagination: metadata.pagination
      }
    }
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

  if (result.success && result.data?.data?.length) {
    await storeInCache(
      cacheService,
      cacheParams,
      result.data.data,
      result.data.pagination
    )

    // Normalize response structure for UI
    return {
      success: true,
      data: {
        data: result.data.data,
        pagination: result.data.pagination
      }
    }
  }

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

export async function validateEmail(email, excludeUserId = null) {
  const payload = excludeUserId ? { email, excludeUserId } : { email }
  return apiRequest('/api/v1/validate-email', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function getAccountById(id, accessToken, cacheService) {
  if (cacheService) {
    const cached = await cacheService.getAccount(id)
    if (cached) {
      return {
        success: true,
        data: cached
      }
    }
  }

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const result = await apiRequest(`/api/v1/accounts/${id}`, {
    method: 'GET',
    headers
  })

  if (result.success && result.data && cacheService) {
    await cacheService.setAccount(id, result.data)
  }

  return result
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

export async function approveAccount(userId, accessToken) {
  return apiRequest(`/api/v1/accounts/${userId}/approve`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export async function deleteAccount(userId, accessToken) {
  return apiRequest(`/api/v1/accounts/${userId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export async function resendInvitation(userId, accessToken) {
  return apiRequest(`/api/v1/accounts/${userId}/resend-invitation`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}

export async function reactivateAccount(userId, accessToken) {
  return apiRequest(`/api/v1/accounts/${userId}/reactivate`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })
}
