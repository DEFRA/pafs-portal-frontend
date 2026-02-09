import { describe, test, expect, beforeEach, vi } from 'vitest'
import { financialYearController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { FINANCIAL_YEAR_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getCurrentFinancialYearStartYear,
  isYearBeyondRange,
  getProjectStep,
  getSessionData,
  updateSessionData,
  validatePayload,
  buildFinancialYearOptions,
  getAfterMarchYear,
  navigateToProjectOverview,
  requiredInterventionTypesForProjectType
} from '../helpers/project-utils.js'

// Mock all dependencies
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-config.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')

describe('FinancialYearController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: {},
      logger: {
        error: vi.fn()
      },
      t: vi.fn((key, params) => `${key}_${JSON.stringify(params || {})}`)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    // Default mocks
    getSessionData.mockReturnValue({
      projectType: 'FRM',
      projectInterventionTypes: ['ENV']
    })

    getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_START_YEAR)
    getCurrentFinancialYearStartYear.mockReturnValue(2025)
    getAfterMarchYear.mockReturnValue(2035)
    buildFinancialYearOptions.mockReturnValue([
      { value: '2025', text: '2025/2026' }
    ])
    isYearBeyondRange.mockReturnValue(false)

    FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_START_YEAR] = {
      localKeyPrefix: 'projects.financial_year.start',
      fieldName: 'financialStartYear',
      schema: {}
    }

    FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_END_YEAR] = {
      localKeyPrefix: 'projects.financial_year.end',
      fieldName: 'financialEndYear',
      schema: {}
    }

    FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL] = {
      localKeyPrefix: 'projects.financial_year.start_manual',
      fieldName: 'financialStartYear',
      schema: {}
    }

    FINANCIAL_YEAR_CONFIG[PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL] = {
      localKeyPrefix: 'projects.financial_year.end_manual',
      fieldName: 'financialEndYear',
      schema: {}
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Test Page',
      backLink: '/back'
    })

    validatePayload.mockReturnValue(null)
    saveProjectWithErrorHandling.mockResolvedValue(null)
    requiredInterventionTypesForProjectType.mockReturnValue(false)
  })

  describe('getHandler', () => {
    test('should render view for FINANCIAL_START_YEAR', async () => {
      await financialYearController.getHandler(mockRequest, mockH)

      expect(getProjectStep).toHaveBeenCalledWith(mockRequest)
      expect(getCurrentFinancialYearStartYear).toHaveBeenCalled()
      expect(buildFinancialYearOptions).toHaveBeenCalledWith(2025)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FINANCIAL_YEAR,
        expect.any(Object)
      )
    })

    test('should include afterMarchYear in additionalData', async () => {
      await financialYearController.getHandler(mockRequest, mockH)

      expect(getAfterMarchYear).toHaveBeenCalledWith(2025)
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            afterMarchYear: 2035
          })
        })
      )
    })

    test('should include manual link for FINANCIAL_START_YEAR', async () => {
      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            afterMarchLinkText: expect.any(String),
            afterMarchLinkHref: ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL
          })
        })
      )
    })

    test('should redirect to manual if year is beyond range for FINANCIAL_START_YEAR', async () => {
      getSessionData.mockReturnValue({
        financialStartYear: '2050'
      })
      isYearBeyondRange.mockReturnValue(true)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(isYearBeyondRange).toHaveBeenCalledWith('2050', 2025)
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL
      )
      expect(mockH.takeover).toHaveBeenCalled()
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('should render view for FINANCIAL_END_YEAR', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FINANCIAL_YEAR,
        expect.any(Object)
      )
    })

    test('should include manual link for FINANCIAL_END_YEAR', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            afterMarchLinkText: expect.any(String),
            afterMarchLinkHref: ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL
          })
        })
      )
    })

    test('should redirect to manual if year is beyond range for FINANCIAL_END_YEAR', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)
      getSessionData.mockReturnValue({
        financialEndYear: '2050'
      })
      isYearBeyondRange.mockReturnValue(true)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL
      )
    })

    test('should render manual view for FINANCIAL_START_YEAR_MANUAL', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('should render manual view for FINANCIAL_END_YEAR_MANUAL', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('should use correct manual link in edit mode for FINANCIAL_START_YEAR', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'

      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            afterMarchLinkHref:
              ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL.replace(
                '{referenceNumber}',
                'TEST-001'
              )
          })
        })
      )
    })

    test('should use correct manual link in edit mode for FINANCIAL_END_YEAR', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            afterMarchLinkHref:
              ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL.replace(
                '{referenceNumber}',
                'TEST-001'
              )
          })
        })
      )
    })

    test('should use TYPE route as back link when no intervention types needed', async () => {
      requiredInterventionTypesForProjectType.mockReturnValue(false)

      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: ROUTES.PROJECT.TYPE
          })
        })
      )
    })

    test('should use INTERVENTION_TYPE route when only 1 intervention type', async () => {
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      getSessionData.mockReturnValue({
        projectType: 'FRM',
        projectInterventionTypes: ['ENV']
      })

      await financialYearController.getHandler(mockRequest, mockH)

      expect(requiredInterventionTypesForProjectType).toHaveBeenCalledWith(
        'FRM'
      )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: ROUTES.PROJECT.INTERVENTION_TYPE
          })
        })
      )
    })

    test('should use PRIMARY_INTERVENTION_TYPE route when multiple intervention types', async () => {
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      getSessionData.mockReturnValue({
        projectType: 'FRM',
        projectInterventionTypes: ['ENV', 'FCE']
      })

      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE
          })
        })
      )
    })

    test('should use TYPE route in edit mode regardless of intervention types', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      requiredInterventionTypesForProjectType.mockReturnValue(true)
      getSessionData.mockReturnValue({
        projectType: 'FRM',
        projectInterventionTypes: ['ENV', 'FCE']
      })

      await financialYearController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: ROUTES.PROJECT.TYPE
          })
        })
      )
    })
  })

  describe('postHandler', () => {
    beforeEach(() => {
      getSessionData.mockReturnValue({
        projectType: 'FRM'
      })
    })

    test('should update session data with payload', async () => {
      mockRequest.payload = { financialStartYear: '2025' }

      await financialYearController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        mockRequest.payload
      )
    })

    test('should return validation error if validation fails', async () => {
      const validationError = { error: 'validation failed' }
      validatePayload.mockReturnValue(validationError)

      const result = await financialYearController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(validationError)
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should not call saveProjectWithErrorHandling in create mode for FINANCIAL_START_YEAR', async () => {
      mockRequest.payload = { financialStartYear: '2025' }

      await financialYearController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should redirect to FINANCIAL_END_YEAR in create mode for FINANCIAL_START_YEAR', async () => {
      mockRequest.payload = { financialStartYear: '2025' }

      await financialYearController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_END_YEAR
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to FINANCIAL_END_YEAR in create mode for FINANCIAL_START_YEAR_MANUAL', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL)
      mockRequest.payload = { financialStartYear: '2050' }

      await financialYearController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_END_YEAR
      )
    })

    test('should call saveProjectWithErrorHandling in edit mode for FINANCIAL_START_YEAR', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: 'FRM'
      })

      await financialYearController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR
      )
    })

    test('should navigate to overview in edit mode for FINANCIAL_START_YEAR', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: 'FRM'
      })
      navigateToProjectOverview.mockReturnValue('overview-redirect')

      const result = await financialYearController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe('overview-redirect')
    })

    test('should call saveProjectWithErrorHandling in create mode for FINANCIAL_END_YEAR', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)
      getSessionData.mockReturnValue({
        projectType: 'FRM'
      })

      await financialYearController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.INITIAL_SAVE,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR
      )
    })

    test('should navigate to overview in create mode for FINANCIAL_END_YEAR', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)
      getSessionData.mockReturnValue({
        slug: 'TEST-001'
      })
      navigateToProjectOverview.mockReturnValue('overview-redirect')

      const result = await financialYearController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe('overview-redirect')
    })

    test('should call saveProjectWithErrorHandling in edit mode for FINANCIAL_END_YEAR', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: 'FRM'
      })

      await financialYearController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR
      )
    })

    test('should return error response if saveProjectWithErrorHandling fails', async () => {
      const errorResponse = { error: 'save failed' }
      saveProjectWithErrorHandling.mockResolvedValue(errorResponse)
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)

      const result = await financialYearController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(errorResponse)
    })

    test('should handle errors and render view with error message', async () => {
      const error = new Error('Test error')
      saveProjectWithErrorHandling.mockRejectedValue(error)
      extractApiError.mockReturnValue({ message: 'API error' })
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR)

      await financialYearController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error financial year POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FINANCIAL_YEAR,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })

    test('should handle FINANCIAL_END_YEAR_MANUAL in create mode', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL)
      getSessionData.mockReturnValue({
        slug: 'TEST-001'
      })
      navigateToProjectOverview.mockReturnValue('overview-redirect')

      await financialYearController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.INITIAL_SAVE,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR
      )
    })
  })
})
