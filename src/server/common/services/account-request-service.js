import { apiRequest } from '../helpers/api-client.js'

/**
 * Submit account request to backend API
 * @param {Object} payload - Account request payload
 * @returns {Promise<Object>} API response
 */
export async function submitAccountRequest(payload) {
  return apiRequest('/api/v1/account-request', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}
