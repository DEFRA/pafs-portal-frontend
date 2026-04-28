import { apiRequest } from '../../helpers/api-client/index.js'

/**
 * Get the current user's area programme download status.
 * Also returns live project counts for the display panel.
 */
export async function getUserProgrammeStatus(accessToken) {
  return apiRequest('/api/v1/downloads/programme/status', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

/**
 * Trigger user area programme generation.
 * Returns 202 Accepted; poll status until ready.
 */
export async function generateUserProgramme(accessToken) {
  return apiRequest('/api/v1/downloads/programme/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

/**
 * Get a presigned download URL for a user programme file.
 * type: 'fcerm1' | 'benefit-areas' | 'moderations'
 */
export async function getUserProgrammeFileUrl(accessToken, type) {
  return apiRequest(`/api/v1/downloads/programme/file/${type}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

/**
 * Get the shared admin system-wide download status.
 */
export async function getAdminProgrammeStatus(accessToken) {
  return apiRequest('/api/v1/admin/downloads/programme/status', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

/**
 * Trigger admin system-wide programme generation.
 */
export async function generateAdminProgramme(accessToken) {
  return apiRequest('/api/v1/admin/downloads/programme/generate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}

/**
 * Get a presigned download URL for the admin system-wide FCERM1 file.
 */
export async function getAdminProgrammeFileUrl(accessToken) {
  return apiRequest('/api/v1/admin/downloads/programme/file', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  })
}
