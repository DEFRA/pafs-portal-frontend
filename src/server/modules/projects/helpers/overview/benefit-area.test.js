import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getBenefitAreaDownloadData,
  _shouldGenerateDownloadUrl
} from './benefit-area.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { getProjectBenefitAreaDownloadUrl } from '../../../../common/services/project/project-service.js'
import { updateSessionData } from '../project-utils.js'

// Mock dependencies
vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/project/project-service.js')
vi.mock('../project-utils.js')

describe('benefit-area', () => {
  let mockRequest
  let mockLogger

  beforeEach(() => {
    vi.clearAllMocks()

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    }

    mockRequest = {
      server: {
        logger: mockLogger
      }
    }

    getAuthSession.mockReturnValue({ accessToken: 'test-token' })
    updateSessionData.mockImplementation(() => {})
  })

  describe('_shouldGenerateDownloadUrl', () => {
    test('should return true when downloadUrl is missing', () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]: null,
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: null
      }

      const result = _shouldGenerateDownloadUrl(projectData)

      expect(result).toBe(true)
    })

    test('should return true when downloadUrl is expired', () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString() // 1 hour ago

      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
          'https://example.com/file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: pastDate
      }

      const result = _shouldGenerateDownloadUrl(projectData)

      expect(result).toBe(true)
    })

    test('should return false when downloadUrl exists and is not expired', () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hour from now

      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
          'https://example.com/file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: futureDate
      }

      const result = _shouldGenerateDownloadUrl(projectData)

      expect(result).toBe(false)
    })

    test('should return false when downloadUrl exists and no expiry date', () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
          'https://example.com/file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: null
      }

      const result = _shouldGenerateDownloadUrl(projectData)

      expect(result).toBe(false)
    })
  })

  describe('getBenefitAreaDownloadData', () => {
    test('should return success without regenerating when no benefit area file', async () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: null
      }

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result).toEqual({
        success: true,
        projectData
      })
      expect(getProjectBenefitAreaDownloadUrl).not.toHaveBeenCalled()
    })

    test('should return success without regenerating when URL is valid', async () => {
      const futureDate = new Date(Date.now() + 1000 * 60 * 60).toISOString()
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
          'https://example.com/file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: futureDate
      }

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result).toEqual({
        success: true,
        projectData
      })
      expect(getProjectBenefitAreaDownloadUrl).not.toHaveBeenCalled()
    })

    test('should regenerate URL when missing', async () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]: null,
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: null,
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST-001'
      }

      const downloadResponse = {
        success: true,
        data: {
          data: {
            downloadUrl: 'https://s3.example.com/presigned-url',
            expiresAt: '2026-02-08T00:00:00Z'
          }
        }
      }

      getProjectBenefitAreaDownloadUrl.mockResolvedValue(downloadResponse)

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result.success).toBe(true)
      expect(
        result.projectData[
          PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL
        ]
      ).toBe('https://s3.example.com/presigned-url')
      expect(
        result.projectData[
          PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY
        ]
      ).toBe('2026-02-08T00:00:00Z')
      expect(getAuthSession).toHaveBeenCalledWith(mockRequest)
      expect(getProjectBenefitAreaDownloadUrl).toHaveBeenCalledWith(
        'TEST-001',
        'test-token'
      )
      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
          'https://s3.example.com/presigned-url',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]:
          '2026-02-08T00:00:00Z'
      })
    })

    test('should regenerate URL when expired', async () => {
      const pastDate = new Date(Date.now() - 1000 * 60 * 60).toISOString()
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]:
          'https://example.com/old-url',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_EXPIRY]: pastDate,
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST-002'
      }

      const downloadResponse = {
        success: true,
        data: {
          data: {
            downloadUrl: 'https://s3.example.com/new-presigned-url',
            expiresAt: '2026-02-09T00:00:00Z'
          }
        }
      }

      getProjectBenefitAreaDownloadUrl.mockResolvedValue(downloadResponse)

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result.success).toBe(true)
      expect(
        result.projectData[
          PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL
        ]
      ).toBe('https://s3.example.com/new-presigned-url')
      expect(getProjectBenefitAreaDownloadUrl).toHaveBeenCalledWith(
        'TEST-002',
        'test-token'
      )
    })

    test('should handle API error response', async () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]: null,
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST-003'
      }

      const errorResponse = {
        success: false,
        error: { message: 'API error occurred' }
      }

      getProjectBenefitAreaDownloadUrl.mockResolvedValue(errorResponse)

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result).toEqual({
        success: false,
        projectData,
        error: errorResponse.error
      })
    })

    test('should handle exception and log error', async () => {
      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]: null,
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST-004'
      }

      const error = new Error('Network timeout')
      getProjectBenefitAreaDownloadUrl.mockRejectedValue(error)

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result.success).toBe(false)
      expect(result.projectData).toEqual(projectData)
      expect(result.error).toBe(error)
      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: error },
        'Failed to regenerate benefit area file download URL'
      )
    })

    test('should handle missing access token', async () => {
      getAuthSession.mockReturnValue(null)

      const projectData = {
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]: 'file.zip',
        [PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_DOWNLOAD_URL]: null,
        [PROJECT_PAYLOAD_FIELDS.SLUG]: 'TEST-005'
      }

      const downloadResponse = {
        success: true,
        data: {
          data: {
            downloadUrl: 'https://s3.example.com/url',
            expiresAt: '2026-02-08T00:00:00Z'
          }
        }
      }

      getProjectBenefitAreaDownloadUrl.mockResolvedValue(downloadResponse)

      const result = await getBenefitAreaDownloadData(mockRequest, projectData)

      expect(result.success).toBe(true)
      expect(getProjectBenefitAreaDownloadUrl).toHaveBeenCalledWith(
        'TEST-005',
        undefined
      )
    })
  })
})
