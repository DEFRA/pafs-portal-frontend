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
 * Creates a new project proposal in the backend
 * @param {Object} proposalData - The project proposal data
 * @param {string} proposalData.name - The project name
 * @param {string} proposalData.project_type - The project type code (DEF, REP, REF, etc.)
 * @param {Array<string>} proposalData.project_intervesion_types - Selected intervention type codes
 * @param {string} proposalData.main_intervension_type - Primary intervention type code (optional)
 * @param {string} proposalData.pending_financial_year - First financial year (YYYY format)
 * @param {string} proposalData.project_end_financial_year - Last financial year (YYYY format)
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} API response with project data including reference number
 */
export async function createProjectProposal(proposalData, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest('/api/v1/project-proposal', {
    method: 'POST',
    body: JSON.stringify(proposalData),
    headers
  })
}
