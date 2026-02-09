/**
 * File Upload Service
 * Handles integration with backend file upload API (CDP Uploader)
 */

import { apiRequest } from '../../helpers/api-client/index.js'

/**
 * Initiate a file upload session with the backend
 *
 * @param {Object} uploadData - Upload session data
 * @param {string} uploadData.entityType - Type of entity (e.g., 'project_benefit_area')
 * @param {number|null} uploadData.entityId - ID of the entity
 * @param {string} uploadData.reference - Business reference (project reference number or slug)
 * @param {string} uploadData.redirect - Redirect path after upload completion
 * @param {Object} uploadData.metadata - Additional metadata
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} Upload session response with uploadId, uploadUrl, statusUrl
 */
export async function initiateFileUpload(uploadData, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest('/api/v1/file-uploads/initiate', {
    method: 'POST',
    body: JSON.stringify(uploadData),
    headers
  })
}

/**
 * Get upload status from the backend
 *
 * @param {string} uploadId - Upload ID
 * @param {string} accessToken - JWT access token
 * @returns {Promise<Object>} Upload status
 */
export async function getUploadStatus(uploadId, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {}

  return apiRequest(`/api/v1/file-uploads/${uploadId}/status`, {
    method: 'GET',
    headers,
    retries: 0
  })
}
