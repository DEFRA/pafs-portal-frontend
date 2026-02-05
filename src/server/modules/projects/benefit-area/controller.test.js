import { describe, test, expect, beforeEach, vi } from 'vitest'
import { benefitAreaController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { UPLOAD_STATUS } from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import {
  initiateFileUpload,
  getUploadStatus
} from '../../../common/services/file-upload/file-upload-service.js'
import {
  buildViewData,
  getSessionData,
  updateSessionData
} from '../helpers/project-utils.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../../../common/services/file-upload/file-upload-service.js')
vi.mock('../helpers/project-utils.js')

describe('BenefitAreaController', () => {
  let mockRequest
  let mockH
  let mockLogger

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    mockRequest = {
      params: { referenceNumber: 'TEST-001' },
      query: {},
      payload: {},
      logger: mockLogger
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis()
    }

    // Default mocks
    getAuthSession.mockReturnValue({ accessToken: 'test-token' })
    getSessionData.mockReturnValue({
      id: 'project-123',
      slug: 'TEST-001',
      benefitAreaFileName: null,
      benefitAreaUploadId: null,
      benefitAreaUploadUrl: null,
      benefitAreaUploadErrors: null
    })
    buildViewData.mockReturnValue({
      pageTitle: 'Upload Benefit Area',
      backLink: ROUTES.GENERAL.HOME
    })
    initiateFileUpload.mockResolvedValue({
      success: true,
      data: {
        data: {
          uploadId: 'upload-123',
          uploadUrl: 'https://cdp.example.com/upload/upload-123'
        }
      }
    })
    getUploadStatus.mockResolvedValue({
      success: true,
      data: {
        data: {
          uploadStatus: UPLOAD_STATUS.READY,
          filename: 'benefit-area.zip'
        }
      }
    })
    updateSessionData.mockImplementation(() => {})
  })

  describe('getHandler', () => {
    test('should initiate upload and render view with uploadUrl on success', async () => {
      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(getAuthSession).toHaveBeenCalledWith(mockRequest)
      expect(getSessionData).toHaveBeenCalledWith(mockRequest)
      expect(initiateFileUpload).toHaveBeenCalledWith(
        {
          entityType: 'project_benefit_area',
          entityId: 'project-123',
          reference: 'TEST-001',
          redirect: ROUTES.PROJECT.EDIT.BENEFIT_AREA_UPLOAD_STATUS.replace(
            '{referenceNumber}',
            'TEST-001'
          ),
          metadata: { step: 'benefit_area' }
        },
        'test-token'
      )
      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadId: 'upload-123',
        benefitAreaUploadUrl: 'https://cdp.example.com/upload/upload-123'
      })
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.BENEFIT_AREA,
        expect.any(Object)
      )
    })

    test('should use session slug when referenceNumber is empty', async () => {
      mockRequest.params.referenceNumber = ''
      getSessionData.mockReturnValue({
        id: 'project-123',
        slug: 'SLUG-001'
      })

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(initiateFileUpload).toHaveBeenCalledWith(
        expect.objectContaining({ reference: 'SLUG-001' }),
        'test-token'
      )
    })

    test('should use null entityId when session has no id', async () => {
      getSessionData.mockReturnValue({ slug: 'TEST-001' })

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(initiateFileUpload).toHaveBeenCalledWith(
        expect.objectContaining({ entityId: null }),
        'test-token'
      )
    })

    test('should retrieve and clear upload errors from session', async () => {
      getSessionData.mockReturnValue({
        id: 'project-123',
        slug: 'TEST-001',
        benefitAreaUploadErrors: [{ message: 'Previous error' }],
        benefitAreaUploadId: 'old-upload-123'
      })

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: null,
        benefitAreaUploadId: null
      })
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            uploadErrors: [{ message: 'Previous error' }]
          })
        })
      )
    })

    test('should not clear errors when none exist', async () => {
      await benefitAreaController.getHandler(mockRequest, mockH)

      // Should only be called once for storing upload session
      const clearCalls = updateSessionData.mock.calls.filter(
        (call) => call[1].benefitAreaUploadErrors === null
      )
      expect(clearCalls).toHaveLength(0)
    })

    test('should pass error code from query params', async () => {
      mockRequest.query.error = 'INVALID_FILE_TYPE'

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            errorCode: 'INVALID_FILE_TYPE'
          })
        })
      )
    })

    test('should handle upload initiation failure with API error', async () => {
      initiateFileUpload.mockResolvedValue({
        success: false,
        error: 'API_ERROR'
      })
      extractApiError.mockReturnValue({
        errorCode: 'UPLOAD_SERVICE_UNAVAILABLE'
      })

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(extractApiError).toHaveBeenCalled()
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            errorCode: 'UPLOAD_SERVICE_UNAVAILABLE'
          })
        })
      )
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.BENEFIT_AREA,
        expect.any(Object)
      )
    })

    test('should handle upload initiation failure without error code', async () => {
      initiateFileUpload.mockResolvedValue({ success: false })
      extractApiError.mockReturnValue(null)

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.not.objectContaining({
            errorCode: expect.anything()
          })
        })
      )
    })

    test('should handle exception during upload initiation', async () => {
      const error = new Error('Network error')
      initiateFileUpload.mockRejectedValue(error)

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(mockLogger.error).toHaveBeenCalledWith(
        { error },
        'Failed to initiate file upload'
      )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            errorCode: 'UPLOAD_INITIATION_FAILED'
          })
        })
      )
    })

    test('should include existing fileName in view data', async () => {
      getSessionData.mockReturnValue({
        id: 'project-123',
        slug: 'TEST-001',
        benefitAreaFileName: 'existing-file.zip'
      })

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          benefitAreaFileName: 'existing-file.zip'
        })
      )
    })

    test('should pass null for benefitAreaFileName when not set', async () => {
      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          benefitAreaFileName: null
        })
      )
    })

    test('should handle missing access token', async () => {
      getAuthSession.mockReturnValue(null)

      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(initiateFileUpload).toHaveBeenCalledWith(
        expect.any(Object),
        undefined
      )
    })

    test('should build view data with correct configuration', async () => {
      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          localKeyPrefix: 'projects.project_benefit_area',
          backLinkOptions: {
            targetURL: ROUTES.GENERAL.HOME,
            conditionalRedirect: true
          }
        })
      )
    })
  })

  describe('uploadStatusHandler', () => {
    beforeEach(() => {
      getSessionData.mockReturnValue({
        id: 'project-123',
        slug: 'TEST-001',
        benefitAreaUploadId: 'upload-123'
      })
    })

    test('should redirect to benefit area page if no uploadId in session', async () => {
      getSessionData.mockReturnValue({
        id: 'project-123',
        slug: 'TEST-001',
        benefitAreaUploadId: null
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
      expect(getUploadStatus).not.toHaveBeenCalled()
    })

    test('should poll upload status and redirect to overview on READY status', async () => {
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.READY,
            filename: 'benefit-area.zip'
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(mockLogger.info).toHaveBeenCalledWith(
        { uploadId: 'upload-123' },
        'Starting synchronous upload polling'
      )
      expect(getUploadStatus).toHaveBeenCalledWith('upload-123', 'test-token')
      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaFileName: 'benefit-area.zip',
        benefitAreaUploadId: null,
        benefitAreaUploadUrl: null,
        benefitAreaUploadErrors: null
      })
      expect(mockLogger.info).toHaveBeenCalledWith(
        { uploadId: 'upload-123' },
        'Upload successful'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should redirect to overview on COMPLETE status', async () => {
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.COMPLETE,
            filename: 'benefit-area.zip'
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaFileName: 'benefit-area.zip',
        benefitAreaUploadId: null,
        benefitAreaUploadUrl: null,
        benefitAreaUploadErrors: null
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should store errors and redirect to benefit area on FAILED status', async () => {
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.FAILED,
            rejectionReason: 'Invalid file format'
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [{ message: 'Invalid file format' }],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })
      expect(mockLogger.warn).toHaveBeenCalledWith(
        { uploadId: 'upload-123' },
        'Upload failed'
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should use generic error message on FAILED status without rejectionReason', async () => {
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.FAILED,
            rejectionReason: null
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [{ message: 'Upload failed' }],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })
    })

    test('should use generic error message on FAILED status with empty rejectionReason', async () => {
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.FAILED,
            rejectionReason: ''
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [{ message: 'Upload failed' }],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })
    })

    test('should continue polling on PENDING status until success', async () => {
      getUploadStatus
        .mockResolvedValueOnce({
          success: true,
          data: { data: { uploadStatus: UPLOAD_STATUS.PENDING } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: {
              uploadStatus: UPLOAD_STATUS.READY,
              filename: 'benefit-area.zip'
            }
          }
        })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(getUploadStatus).toHaveBeenCalledTimes(2)
      expect(mockLogger.info).toHaveBeenCalledWith(
        { uploadId: 'upload-123', attempt: 1 },
        'Polling upload status'
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        { uploadId: 'upload-123', attempt: 2 },
        'Polling upload status'
      )
    })

    test('should continue polling on PROCESSING status', async () => {
      getUploadStatus
        .mockResolvedValueOnce({
          success: true,
          data: { data: { uploadStatus: UPLOAD_STATUS.PROCESSING } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: {
              uploadStatus: UPLOAD_STATUS.READY,
              filename: 'benefit-area.zip'
            }
          }
        })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(getUploadStatus).toHaveBeenCalledTimes(2)
    })

    test('should handle FAILED status with truthy rejectionReason', async () => {
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.FAILED,
            rejectionReason: 'File too large'
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [{ message: 'File too large' }],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })
    })

    test('should handle status response with missing success field', async () => {
      getUploadStatus
        .mockResolvedValueOnce({
          data: { data: { uploadStatus: UPLOAD_STATUS.PENDING } }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: {
              uploadStatus: UPLOAD_STATUS.READY,
              filename: 'benefit-area.zip'
            }
          }
        })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(getUploadStatus).toHaveBeenCalledTimes(2)
    })

    test('should handle status response with null statusResponseData.data', async () => {
      getUploadStatus
        .mockResolvedValueOnce({
          success: true,
          data: { data: null }
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            data: {
              uploadStatus: UPLOAD_STATUS.READY,
              filename: 'benefit-area.zip'
            }
          }
        })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(getUploadStatus).toHaveBeenCalledTimes(2)
    })

    test('should use empty referenceNumber when not provided', async () => {
      mockRequest.params.referenceNumber = ''
      getSessionData.mockReturnValue({ benefitAreaUploadId: null })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace('{referenceNumber}', '')
      )
    })

    test('should handle missing access token', async () => {
      getAuthSession.mockReturnValue(null)

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(getUploadStatus).toHaveBeenCalledWith('upload-123', undefined)
    })

    test('should work with minimal logger implementation', async () => {
      mockRequest.logger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn()
      }

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(mockRequest.logger.info).toHaveBeenCalled()
    })

    test('should timeout after max polling attempts and redirect with timeout error', async () => {
      // Mock to return PENDING status for all 10 attempts to trigger timeout
      getUploadStatus.mockResolvedValue({
        success: true,
        data: { data: { uploadStatus: UPLOAD_STATUS.PENDING } }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(getUploadStatus).toHaveBeenCalledTimes(10)
      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [
          { message: 'Upload processing timeout - please try again' }
        ],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    }, 25000)

    test('should handle outer try-catch error when an unexpected error occurs', async () => {
      // Mock logger.info to throw an error to trigger outer try-catch
      mockLogger.info.mockImplementation(() => {
        throw new Error('Unexpected logger error')
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(Error),
          uploadId: 'upload-123'
        }),
        'Failed to check upload status'
      )
      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [
          { message: 'Failed to check upload status. Please try again.' }
        ],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.BENEFIT_AREA.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })
  })

  describe('integration scenarios', () => {
    test('should complete full successful upload flow', async () => {
      // Step 1: Initial GET request
      await benefitAreaController.getHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadId: 'upload-123',
        benefitAreaUploadUrl: 'https://cdp.example.com/upload/upload-123'
      })

      // Step 2: Status check after upload
      vi.clearAllMocks()
      getSessionData.mockReturnValue({ benefitAreaUploadId: 'upload-123' })
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.READY,
            filename: 'uploaded-file.zip'
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaFileName: 'uploaded-file.zip',
        benefitAreaUploadId: null,
        benefitAreaUploadUrl: null,
        benefitAreaUploadErrors: null
      })
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should complete full failed upload flow with retry', async () => {
      // Step 1: Initial GET request
      await benefitAreaController.getHandler(mockRequest, mockH)

      // Step 2: Upload fails
      vi.clearAllMocks()
      getSessionData.mockReturnValue({
        benefitAreaUploadId: 'upload-123',
        benefitAreaUploadUrl: 'https://cdp.example.com/upload/upload-123'
      })
      getUploadStatus.mockResolvedValue({
        success: true,
        data: {
          data: {
            uploadStatus: UPLOAD_STATUS.FAILED,
            rejectionReason: 'Invalid file format'
          }
        }
      })

      await benefitAreaController.uploadStatusHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: [{ message: 'Invalid file format' }],
        benefitAreaUploadId: null,
        benefitAreaFileName: null
      })

      // Step 3: User returns to benefit area page (uploadUrl preserved for retry)
      vi.clearAllMocks()
      getSessionData.mockReturnValue({
        benefitAreaUploadErrors: [{ message: 'Invalid file format' }],
        benefitAreaUploadUrl: 'https://cdp.example.com/upload/upload-123'
      })

      await benefitAreaController.getHandler(mockRequest, mockH)

      // Errors should be cleared
      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        benefitAreaUploadErrors: null,
        benefitAreaUploadId: null
      })
    })
  })
})
