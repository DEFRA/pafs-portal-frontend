import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { getProjectBenefitAreaDownloadUrl } from '../../../../common/services/project/project-service.js'
import { updateSessionData } from '../project-utils.js'

/**
 * Check if download URL needs to be regenerated
 * @param {Object} projectData - Project data
 * @returns {boolean} True if URL should be regenerated
 */
export function _shouldGenerateDownloadUrl(projectData) {
  const downloadUrl =
    projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]
  const downloadExpiry =
    projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]

  // Regenerate if URL or expiry date is missing
  if (!downloadUrl || !downloadExpiry) {
    return true
  }

  // Regenerate if expired
  return new Date(downloadExpiry) < new Date()
}

/**
 * Data enrichment function: Regenerates benefit area file download URL if needed
 * Follows the enrichment pattern: (request, projectData) => { success, projectData, error? }
 *
 * @param {Object} request - Hapi request object
 * @param {Object} projectData - Current project data
 * @returns {Promise<Object>} { success, projectData, error? }
 */
export async function getBenefitAreaDownloadData(request, projectData) {
  const hasBenefitAreaFile = Boolean(
    projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]
  )

  if (hasBenefitAreaFile && _shouldGenerateDownloadUrl(projectData)) {
    try {
      const authSession = getAuthSession(request)
      const accessToken = authSession?.accessToken
      const referenceNumber = projectData[PROJECT_PAYLOAD_FIELDS.SLUG]

      const response = await getProjectBenefitAreaDownloadUrl(
        referenceNumber,
        accessToken
      )

      if (response.success && response.data) {
        const downloadData = response.data
        // Update session with new download URL and expiry
        updateSessionData(request, {
          [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
            downloadData.data.downloadUrl,
          [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]:
            downloadData.data.expiresAt
        })

        // Update projectData to reflect the changes in the current render
        projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL] =
          downloadData.data.downloadUrl
        projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY] =
          downloadData.data.expiresAt

        return { success: true, projectData }
      }
      return { success: false, projectData, error: response.error }
    } catch (error) {
      request.server.logger.error(
        { err: error },
        'Failed to regenerate benefit area file download URL'
      )
      return { success: false, projectData, error }
    }
  }

  return { success: true, projectData }
}
