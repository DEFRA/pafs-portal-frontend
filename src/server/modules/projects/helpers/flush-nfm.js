import { apiRequest } from '../../../common/helpers/api-client/index.js'

/**
 * Flush NFM data for a project in the backend (core_project and related tables)
 * @param {string} referenceNumber
 * @param {string} accessToken
 * @returns {Promise<object>} API response
 */
export async function flushNfmSection(referenceNumber, accessToken) {
  return apiRequest('/api/v1/project/flush-section', {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    body: JSON.stringify({ referenceNumber, section: 'nfm' })
  })
}
