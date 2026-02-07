/**
 * File Upload Service - Unit Tests
 * Tests for file upload service integration with backend API
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { initiateFileUpload, getUploadStatus } from './file-upload-service.js'
import * as apiClient from '../../helpers/api-client/index.js'

vi.mock('../../helpers/api-client/index.js')

describe('file-upload-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('initiateFileUpload', () => {
    it('should call apiRequest with correct parameters when accessToken is provided', async () => {
      const mockResponse = {
        uploadId: 'upload-123',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com'
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadData = {
        entityType: 'project_benefit_area',
        entityId: 123,
        reference: 'PRJ-001',
        redirect: '/projects/123/benefit-area',
        metadata: { filename: 'test.zip' }
      }
      const accessToken = 'test-jwt-token'

      const result = await initiateFileUpload(uploadData, accessToken)

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/initiate',
        {
          method: 'POST',
          body: JSON.stringify(uploadData),
          headers: { Authorization: 'Bearer test-jwt-token' }
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call apiRequest without Authorization header when accessToken is not provided', async () => {
      const mockResponse = {
        uploadId: 'upload-456',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com'
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadData = {
        entityType: 'project_benefit_area',
        entityId: null,
        reference: 'PRJ-002',
        redirect: '/projects/create',
        metadata: {}
      }

      const result = await initiateFileUpload(uploadData, null)

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/initiate',
        {
          method: 'POST',
          body: JSON.stringify(uploadData),
          headers: {}
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call apiRequest without Authorization header when accessToken is undefined', async () => {
      const mockResponse = {
        uploadId: 'upload-789',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com'
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadData = {
        entityType: 'project_benefit_area',
        entityId: 456,
        reference: 'PRJ-003',
        redirect: '/projects/456',
        metadata: { size: 1024 }
      }

      const result = await initiateFileUpload(uploadData, undefined)

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/initiate',
        {
          method: 'POST',
          body: JSON.stringify(uploadData),
          headers: {}
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call apiRequest without Authorization header when accessToken is empty string', async () => {
      const mockResponse = {
        uploadId: 'upload-empty',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com'
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadData = {
        entityType: 'project_benefit_area',
        entityId: 789,
        reference: 'PRJ-004',
        redirect: '/projects/789',
        metadata: {}
      }

      const result = await initiateFileUpload(uploadData, '')

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/initiate',
        {
          method: 'POST',
          body: JSON.stringify(uploadData),
          headers: {}
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should propagate errors from apiRequest', async () => {
      const mockError = new Error('Network error')
      vi.mocked(apiClient.apiRequest).mockRejectedValue(mockError)

      const uploadData = {
        entityType: 'project_benefit_area',
        entityId: 999,
        reference: 'PRJ-ERROR',
        redirect: '/error',
        metadata: {}
      }

      await expect(initiateFileUpload(uploadData, 'token')).rejects.toThrow(
        'Network error'
      )
    })
  })

  describe('getUploadStatus', () => {
    it('should call apiRequest with correct parameters when accessToken is provided', async () => {
      const mockResponse = {
        status: 'completed',
        fileKey: 's3://bucket/file.zip',
        metadata: { size: 2048 }
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadId = 'upload-status-123'
      const accessToken = 'test-jwt-token'

      const result = await getUploadStatus(uploadId, accessToken)

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/upload-status-123/status',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer test-jwt-token' },
          retries: 0
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call apiRequest without Authorization header when accessToken is not provided', async () => {
      const mockResponse = {
        status: 'processing',
        fileKey: null,
        metadata: {}
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadId = 'upload-status-456'

      const result = await getUploadStatus(uploadId, null)

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/upload-status-456/status',
        {
          method: 'GET',
          headers: {},
          retries: 0
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call apiRequest without Authorization header when accessToken is undefined', async () => {
      const mockResponse = {
        status: 'pending',
        fileKey: null,
        metadata: {}
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadId = 'upload-status-789'

      const result = await getUploadStatus(uploadId, undefined)

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/upload-status-789/status',
        {
          method: 'GET',
          headers: {},
          retries: 0
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should call apiRequest without Authorization header when accessToken is empty string', async () => {
      const mockResponse = {
        status: 'failed',
        error: 'Invalid file format',
        metadata: {}
      }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      const uploadId = 'upload-status-empty'

      const result = await getUploadStatus(uploadId, '')

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/api/v1/file-uploads/upload-status-empty/status',
        {
          method: 'GET',
          headers: {},
          retries: 0
        }
      )
      expect(result).toEqual(mockResponse)
    })

    it('should propagate errors from apiRequest', async () => {
      const mockError = new Error('API error')
      vi.mocked(apiClient.apiRequest).mockRejectedValue(mockError)

      const uploadId = 'upload-error'

      await expect(getUploadStatus(uploadId, 'token')).rejects.toThrow(
        'API error'
      )
    })

    it('should include retries: 0 in request options', async () => {
      const mockResponse = { status: 'completed' }
      vi.mocked(apiClient.apiRequest).mockResolvedValue(mockResponse)

      await getUploadStatus('test-id', 'test-token')

      const callArgs = vi.mocked(apiClient.apiRequest).mock.calls[0]
      expect(callArgs[1].retries).toBe(0)
    })
  })
})
