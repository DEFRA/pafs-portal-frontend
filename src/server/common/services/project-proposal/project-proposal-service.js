import { apiRequest } from '../../helpers/api-client.js'

/**
 * Check if project name already exists
 * @param {string} name - Project name to check
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response with exists boolean
 */
export async function checkProjectNameExists(name, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest('/api/v1/project-proposal/check-name', {
    method: 'POST',
    body: JSON.stringify({ name }),
    headers
  })
}
