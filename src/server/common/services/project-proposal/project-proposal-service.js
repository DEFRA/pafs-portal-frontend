import { apiRequest } from '../../helpers/api-client/index.js'

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

/**
 * Upserts a project proposal in the backend
 * @param {string} referenceNumber - The reference number of the project proposal
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response with project data including reference number
 */
export async function getProjectProposalOverview(referenceNumber, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest(
    `/api/v1/project-proposal/proposal-overview/${referenceNumber}`,
    {
      method: 'GET',
      headers
    }
  )
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
