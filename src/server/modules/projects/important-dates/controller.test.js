import { describe, test, expect, beforeEach, vi } from 'vitest'
import { importantDatesController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { IMPORTANT_DATES_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  updateSessionData,
  validatePayload,
  navigateToProjectOverview,
  formatDate
} from '../helpers/project-utils.js'

// Mock all dependencies
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-config.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')

describe('ImportantDatesController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: { step: PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE },
      logger: {
        error: vi.fn()
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    // Default mocks
    getSessionData.mockReturnValue({
      slug: 'TEST-001',
      [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: '4',
      [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: '2025',
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
      [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
    })

    getProjectStep.mockReturnValue(PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE)

    IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE] = {
      backLinkOptions: { url: '/back' },
      localKeyPrefix: 'projects.important_dates.start_outline_business_case',
      fieldType: 'date',
      monthField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
      yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
      fieldName: 'startOutlineBusinessCase',
      schema: {}
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Test Page',
      backLink: '/back',
      localKeyPrefix: 'projects.important_dates.start_outline_business_case'
    })

    formatDate.mockImplementation((month, year) =>
      month && year ? `Month ${month} ${year}` : ''
    )
  })

  describe('getHandler', () => {
    test('should render view with correct data for START_OUTLINE_BUSINESS_CASE', async () => {
      await importantDatesController.getHandler(mockRequest, mockH)

      expect(getProjectStep).toHaveBeenCalledWith(mockRequest)
      expect(getSessionData).toHaveBeenCalledWith(mockRequest)
      expect(buildViewData).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.IMPORTANT_DATES,
        expect.objectContaining({
          pageTitle: 'Test Page',
          backLink: '/back'
        })
      )
    })

    test('should include previousStageDate for COMPLETE_OUTLINE_BUSINESS_CASE', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE
      )
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE] = {
        backLinkOptions: { url: '/back' },
        localKeyPrefix:
          'projects.important_dates.complete_outline_business_case',
        fieldType: 'date',
        monthField: PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
        yearField: PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
        fieldName: 'completeOutlineBusinessCase',
        schema: {}
      }

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(formatDate).toHaveBeenCalledWith('4', '2025')
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            previousStageDate: 'Month 4 2025'
          })
        })
      )
    })

    test('should include financial year dates', async () => {
      await importantDatesController.getHandler(mockRequest, mockH)

      expect(formatDate).toHaveBeenCalledWith('4', '2025')
      expect(formatDate).toHaveBeenCalledWith('3', '2026')
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            financialYearStart: expect.any(String),
            financialYearEnd: expect.any(String)
          })
        })
      )
    })

    test('should handle missing financial year dates', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001'
      })

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            financialYearStart: '',
            financialYearEnd: ''
          })
        })
      )
    })

    test('should render view for COULD_START_EARLY step', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.COULD_START_EARLY)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY] = {
        backLinkOptions: { url: '/back' },
        localKeyPrefix: 'projects.important_dates.could_start_early',
        fieldType: 'radio',
        fieldName: 'couldStartEarly',
        schema: {}
      }

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.IMPORTANT_DATES,
        expect.any(Object)
      )
    })

    test('should render view for EARLIEST_START_DATE step', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.EARLIEST_START_DATE)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.EARLIEST_START_DATE] = {
        backLinkOptions: { url: '/back' },
        localKeyPrefix: 'projects.important_dates.earliest_start_date',
        fieldType: 'date',
        monthField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
        yearField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR,
        fieldName: 'earliestWithGia',
        schema: {}
      }

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('postHandler', () => {
    beforeEach(() => {
      validatePayload.mockReturnValue(null)
      saveProjectWithErrorHandling.mockResolvedValue(null)
    })

    test('should update session data with payload', async () => {
      mockRequest.payload = {
        startOutlineBusinessCaseMonth: '5',
        startOutlineBusinessCaseYear: '2025'
      }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        mockRequest.payload
      )
    })

    test('should return validation error if validation fails', async () => {
      const validationError = { error: 'validation failed' }
      validatePayload.mockReturnValue(validationError)

      const result = await importantDatesController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(validationError)
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should call saveProjectWithErrorHandling with correct level', async () => {
      await importantDatesController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.START_OUTLINE_BUSINESS_CASE,
        expect.any(Object),
        PROJECT_VIEWS.IMPORTANT_DATES
      )
    })

    test('should return response if saveProjectWithErrorHandling returns error', async () => {
      const errorResponse = { error: 'save failed' }
      saveProjectWithErrorHandling.mockResolvedValue(errorResponse)

      const result = await importantDatesController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(errorResponse)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('should redirect to next step for START_OUTLINE_BUSINESS_CASE', async () => {
      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to next step for COMPLETE_OUTLINE_BUSINESS_CASE', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE
      )
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE] = {
        schema: {}
      }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to next step for AWARD_MAIN_CONTRACT', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.AWARD_MAIN_CONTRACT)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.AWARD_MAIN_CONTRACT] = {
        schema: {}
      }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.START_WORK.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should redirect to next step for START_WORK', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.START_WORK)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_WORK] = {
        schema: {}
      }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.START_BENEFITS.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to next step for START_BENEFITS', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
        schema: {}
      }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.COULD_START_EARLY.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to EARLIEST_START_DATE when couldStartEarly is true (boolean)', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.COULD_START_EARLY)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY] = {
        schema: {}
      }
      mockRequest.payload = { couldStartEarly: true }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.EARLIEST_START_DATE.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to EARLIEST_START_DATE when couldStartEarly is "true" (string)', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.COULD_START_EARLY)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY] = {
        schema: {}
      }
      mockRequest.payload = { couldStartEarly: 'true' }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.EARLIEST_START_DATE.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to overview when couldStartEarly is false', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.COULD_START_EARLY)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY] = {
        schema: {}
      }
      mockRequest.payload = { couldStartEarly: false }
      navigateToProjectOverview.mockReturnValue('overview-redirect')

      const result = await importantDatesController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe('overview-redirect')
    })

    test('should redirect to overview when couldStartEarly is "false"', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.COULD_START_EARLY)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY] = {
        schema: {}
      }
      mockRequest.payload = { couldStartEarly: 'false' }
      navigateToProjectOverview.mockReturnValue('overview-redirect')

      const result = await importantDatesController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe('overview-redirect')
    })

    test('should redirect to overview for EARLIEST_START_DATE', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.EARLIEST_START_DATE)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.EARLIEST_START_DATE] = {
        schema: {}
      }

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should handle errors and render view with error message', async () => {
      const error = new Error('Test error')
      saveProjectWithErrorHandling.mockRejectedValue(error)
      extractApiError.mockReturnValue({ message: 'API error' })

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error important dates POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.IMPORTANT_DATES,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })

    test('should handle missing referenceNumber gracefully', async () => {
      getSessionData.mockReturnValue({})

      await importantDatesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      )
    })
  })
})
