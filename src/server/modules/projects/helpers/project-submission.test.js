import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  _cleanProjectTypeSpecificData,
  buildProjectPayload,
  submitProject,
  handleProjectSubmissionError,
  saveProjectWithErrorHandling
} from './project-submission.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  extractApiError,
  extractApiValidationErrors
} from '../../../common/helpers/error-renderer/index.js'
import { upsertProjectProposal } from '../../../common/services/project/project-service.js'
import {
  getSessionData,
  requiredInterventionTypesForProjectType,
  updateSessionData
} from './project-utils.js'
import { PROJECT_PAYLOAD_LEVEL_FIELDS } from './project-config.js'
import {
  PROJECT_ERROR_CODES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS
} from '../../../common/constants/projects.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../../../common/services/project/project-service.js')
vi.mock('./project-utils.js')
vi.mock('./project-config.js')

describe('project-submission helpers', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      logger: {
        error: vi.fn()
      }
    }

    mockH = {
      view: vi.fn()
    }

    PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE] = [
      PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE,
      PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES,
      PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE
    ]

    PROJECT_PAYLOAD_LEVEL_FIELDS[PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR] =
      [
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
        PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
      ]
  })

  describe('_cleanProjectTypeSpecificData', () => {
    test('should remove intervention type fields when not required', () => {
      requiredInterventionTypesForProjectType.mockReturnValue(false)
      const sessionData = {
        projectType: 'STU',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      }

      _cleanProjectTypeSpecificData(sessionData)

      expect(requiredInterventionTypesForProjectType).toHaveBeenCalledWith(
        'STU'
      )
      expect(sessionData.projectInterventionTypes).toBeUndefined()
      expect(sessionData.mainInterventionType).toBeUndefined()
    })

    test('should keep intervention type fields when required', () => {
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      const sessionData = {
        projectType: 'DEF',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      }

      _cleanProjectTypeSpecificData(sessionData)

      expect(sessionData.projectInterventionTypes).toEqual(['NFM'])
      expect(sessionData.mainInterventionType).toBe('NFM')
    })
  })

  describe('buildProjectPayload', () => {
    test('should build payload with required fields for level', () => {
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      const sessionData = {
        projectType: 'DEF',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM',
        financialStartYear: '2025',
        extraField: 'should not be included'
      }

      const payload = buildProjectPayload(
        sessionData,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
      )

      expect(payload).toEqual({
        projectType: 'DEF',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      })
      expect(payload.financialStartYear).toBeUndefined()
      expect(payload.extraField).toBeUndefined()
    })

    test('should throw error for invalid level', () => {
      expect(() => {
        buildProjectPayload({}, 'INVALID_LEVEL')
      }).toThrow('Invalid validation level: INVALID_LEVEL')
    })

    test('should clean intervention type data when not required', () => {
      requiredInterventionTypesForProjectType.mockReturnValue(false)
      const sessionData = {
        projectType: 'STU',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      }

      const payload = buildProjectPayload(
        sessionData,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
      )

      expect(payload.projectType).toBe('STU')
      expect(payload.projectInterventionTypes).toBeUndefined()
      expect(payload.mainInterventionType).toBeUndefined()
    })

    test('should only include defined fields', () => {
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      const sessionData = {
        projectType: 'DEF'
        // projectInterventionTypes and mainInterventionType are undefined
      }

      const payload = buildProjectPayload(
        sessionData,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
      )

      expect(payload).toEqual({
        projectType: 'DEF'
      })
    })
  })

  describe('submitProject', () => {
    beforeEach(() => {
      getSessionData.mockReturnValue({
        projectType: 'DEF',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      })
      getAuthSession.mockReturnValue({
        accessToken: 'test-token'
      })
      requiredInterventionTypesForProjectType.mockReturnValue(true)
    })

    test('should submit project successfully', async () => {
      upsertProjectProposal.mockResolvedValue({
        success: true,
        data: { referenceNumber: 'TEST-001' }
      })

      const result = await submitProject(
        mockRequest,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
      )

      expect(upsertProjectProposal).toHaveBeenCalledWith(
        {
          level: PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
          payload: {
            projectType: 'DEF',
            projectInterventionTypes: ['NFM'],
            mainInterventionType: 'NFM'
          }
        },
        'test-token'
      )
      expect(result.success).toBe(true)
    })

    test('should handle submission failure from API', async () => {
      upsertProjectProposal.mockResolvedValue({
        success: false,
        data: { errors: ['error1'] }
      })

      const result = await submitProject(
        mockRequest,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(mockRequest.logger.error).toHaveBeenCalled()
    })

    test('should handle network errors', async () => {
      const networkError = new Error('Network error')
      upsertProjectProposal.mockRejectedValue(networkError)

      const result = await submitProject(
        mockRequest,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe(networkError)
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE
        }),
        'Failed to submit project'
      )
    })

    test('should log validation errors details', async () => {
      const error = new Error('Validation failed')
      error.response = {
        data: {
          validationErrors: [{ field: 'projectType', error: 'required' }],
          errors: ['error1']
        }
      }
      upsertProjectProposal.mockRejectedValue(error)

      await submitProject(mockRequest, PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            validationErrors: error.response.data.validationErrors,
            errors: error.response.data.errors
          })
        }),
        'Failed to submit project'
      )
    })
  })

  describe('handleProjectSubmissionError', () => {
    const viewData = { pageTitle: 'Test' }
    const template = 'test-template'

    test('should handle validation errors', () => {
      const error = {
        response: {
          data: {
            validationErrors: [{ field: 'projectType', error: 'required' }]
          }
        }
      }
      const fieldErrors = { projectType: 'required' }
      extractApiValidationErrors.mockReturnValue(fieldErrors)

      handleProjectSubmissionError(
        mockRequest,
        mockH,
        error,
        viewData,
        template
      )

      expect(extractApiValidationErrors).toHaveBeenCalledWith(
        error.response.data
      )
      expect(mockH.view).toHaveBeenCalledWith(template, {
        ...viewData,
        fieldErrors
      })
    })

    test('should handle API errors with error code', () => {
      const error = {
        response: {
          data: {
            errors: [{ errorCode: 'CUSTOM_ERROR', message: 'Error message' }]
          }
        }
      }
      const apiError = { errorCode: 'CUSTOM_ERROR' }
      extractApiError.mockReturnValue(apiError)

      handleProjectSubmissionError(
        mockRequest,
        mockH,
        error,
        viewData,
        template
      )

      expect(extractApiError).toHaveBeenCalledWith(error.response.data)
      expect(mockH.view).toHaveBeenCalledWith(template, {
        ...viewData,
        errorCode: 'CUSTOM_ERROR',
        error: apiError
      })
    })

    test('should handle generic errors', () => {
      const error = new Error('Generic error')
      const apiError = { errorCode: PROJECT_ERROR_CODES.NETWORK_ERROR }
      extractApiError.mockReturnValue(apiError)

      handleProjectSubmissionError(
        mockRequest,
        mockH,
        error,
        viewData,
        template
      )

      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(template, {
        ...viewData,
        errorCode: PROJECT_ERROR_CODES.NETWORK_ERROR,
        error: apiError
      })
    })
  })

  describe('saveProjectWithErrorHandling', () => {
    const viewData = { pageTitle: 'Test' }
    const template = 'test-template'

    beforeEach(() => {
      getSessionData.mockReturnValue({
        projectType: 'DEF',
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      })
      getAuthSession.mockReturnValue({
        accessToken: 'test-token'
      })
      requiredInterventionTypesForProjectType.mockReturnValue(true)
    })

    test('should return null on successful submission', async () => {
      upsertProjectProposal.mockResolvedValue({
        success: true,
        data: {
          data: {
            referenceNumber: 'TEST-001',
            slug: 'test-001'
          }
        }
      })

      const result = await saveProjectWithErrorHandling(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        viewData,
        template
      )

      expect(result).toBeNull()
    })

    test('should update session with referenceNumber and slug on first save', async () => {
      getSessionData.mockReturnValue({
        projectType: 'DEF'
        // No referenceNumber initially
      })
      upsertProjectProposal.mockResolvedValue({
        success: true,
        data: {
          data: {
            referenceNumber: 'TEST-001',
            slug: 'test-001'
          }
        }
      })

      await saveProjectWithErrorHandling(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        viewData,
        template
      )

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        referenceNumber: 'TEST-001',
        slug: 'test-001'
      })
    })

    test('should not update session if referenceNumber already exists', async () => {
      getSessionData.mockReturnValue({
        projectType: 'DEF',
        referenceNumber: 'EXISTING-001'
      })
      upsertProjectProposal.mockResolvedValue({
        success: true,
        data: {
          data: {
            referenceNumber: 'TEST-001',
            slug: 'test-001'
          }
        }
      })

      await saveProjectWithErrorHandling(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        viewData,
        template
      )

      expect(updateSessionData).not.toHaveBeenCalled()
    })

    test('should return error view on submission failure', async () => {
      const error = new Error('Submission failed')
      error.response = {
        data: {
          validationErrors: [{ field: 'projectType', error: 'required' }]
        }
      }
      upsertProjectProposal.mockRejectedValue(error)
      extractApiValidationErrors.mockReturnValue({ projectType: 'required' })
      mockH.view.mockReturnValue({ view: 'error-view' })

      const result = await saveProjectWithErrorHandling(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        viewData,
        template
      )

      expect(result).toBeDefined()
      expect(mockH.view).toHaveBeenCalledWith(template, expect.any(Object))
    })

    test('should handle API errors properly', async () => {
      const error = {
        response: {
          data: {
            errors: [{ errorCode: 'CUSTOM_ERROR' }]
          }
        }
      }
      upsertProjectProposal.mockResolvedValue({
        success: false,
        data: error.response.data
      })
      extractApiError.mockReturnValue({ errorCode: 'CUSTOM_ERROR' })

      await saveProjectWithErrorHandling(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        viewData,
        template
      )

      expect(mockH.view).toHaveBeenCalled()
    })
  })
})
