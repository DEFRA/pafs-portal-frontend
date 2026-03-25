// src/server/modules/projects/helpers/session-refresh.js
// Global helper to refresh project session from backend after save
import { getProjectProposalOverview } from '../../../common/services/project/project-service.js'
import { initializeEditSession } from './project-edit-session.js'

/**
 * Fetch latest project data from backend and update session
 * @param {Object} request - Hapi request object
 * @param {string} referenceNumber - Project reference number
 * @param {string} [accessToken] - Optional access token (will try to get from session if not provided)
 * @returns {Promise<void>}
 */
export async function refreshSessionFromBackend(
  request,
  referenceNumber,
  accessToken
) {
  try {
    let token = accessToken
    if (!token) {
      const authSession =
        request.auth?.credentials || request.yar.get('authSession')
      token = authSession?.accessToken
    }
    if (token && referenceNumber) {
      const backendResult = await getProjectProposalOverview(
        referenceNumber,
        token
      )
      if (backendResult?.success && backendResult.data) {
        initializeEditSession(request, backendResult.data)
      }
    }
  } catch (err) {
    // Optionally log error in production
  }
}
