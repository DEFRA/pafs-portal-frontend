import { apiRequest } from '../../helpers/api-client/index.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'
import { PAGINATION } from '../../constants/common.js'
import {
  tryGetFromCache as tryGetListFromCache,
  storeInCache as storeListInCache
} from '../../helpers/cache/list-cache-helper.js'

function buildProjectsQueryParams({ search, areaId, status, page, pageSize }) {
  const queryParams = new URLSearchParams()

  queryParams.append('page', String(page))
  queryParams.append('pageSize', String(pageSize))

  if (search?.trim()) {
    queryParams.append('search', search.trim())
  }

  if (areaId) {
    queryParams.append('areaId', areaId)
  }

  if (status) {
    queryParams.append('status', status)
  }

  return queryParams
}

export async function getProjects({
  search,
  areaId,
  status,
  page = PAGINATION.DEFAULT_PAGE,
  pageSize,
  accessToken,
  cacheService
}) {
  const effectivePageSize = pageSize || getDefaultPageSize()
  const cacheParams = {
    search: search || '',
    areaId: areaId || '',
    status: status || '',
    page,
    pageSize: effectivePageSize
  }

  const { metadata, data } = await tryGetListFromCache(
    cacheService,
    cacheParams,
    'projectIds',
    (ids) => cacheService?.getProjectsByIds(ids)
  )

  if (metadata && data) {
    return {
      success: true,
      data: {
        data,
        pagination: metadata.pagination
      }
    }
  }

  const queryParams = buildProjectsQueryParams({
    search,
    areaId,
    status,
    page,
    pageSize: effectivePageSize
  })

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  const result = await apiRequest(
    `/api/v1/projects?${queryParams.toString()}`,
    {
      method: 'GET',
      headers
    }
  )

  if (result.success && result.data?.data?.length) {
    await storeListInCache(
      cacheService,
      cacheParams,
      result.data.data,
      result.data.pagination,
      (projects) => cacheService?.setProjects(projects),
      (project) => project.id || project.referenceNumber
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

/**
 * Check if project name already exists
 * @param {string} payload.name - Payload containing project name to check
 * @param {string} payload.referenceNumber - Optional reference number to exclude from check
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response with exists boolean
 */
export async function checkProjectNameExists(payload, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest('/api/v1/project/check-name', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers
  })
}

/**
 * Upserts a project proposal in the backend
 * @param {string} referenceNumber - The reference number of the project proposal
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response with project data including reference number
 */
export async function getProjectProposalOverview(referenceNumber, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest(`/api/v1/project/${referenceNumber}`, {
    method: 'GET',
    headers
  })
}

/**
 * Upserts a project proposal in the backend
 * @param {Object} proposalData - The project proposal data including level/payload
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response with project data including reference number
 */
export async function upsertProjectProposal(proposalData, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest('/api/v1/project/upsert', {
    method: 'POST',
    body: JSON.stringify(proposalData),
    headers
  })
}

export async function getProjectBenefitAreaDownloadUrl(
  referenceNumber,
  accessToken
) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest(
    `/api/v1/project/${referenceNumber}/benefit-area-file/download`,
    {
      method: 'GET',
      headers
    }
  )
}

export async function deleteProject(referenceNumber, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest(`/api/v1/project/${referenceNumber}/benefit-area-file`, {
    method: 'DELETE',
    headers
  })
}

/**
 * Update a project's status
 * @param {string} referenceNumber - The project reference number
 * @param {string} status - The new status value
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response
 */
export async function updateProjectStatus(
  referenceNumber,
  status,
  accessToken
) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest(`/api/v1/project/${referenceNumber}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
    headers
  })
}
