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

      expect(formatDate).toHaveBeenCalledWith(4, '2025')
      expect(formatDate).toHaveBeenCalledWith(3, 2027) // financialEndYear (2026) + 1
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

    test('should build rangeHint from financial year start for START_OUTLINE_BUSINESS_CASE', async () => {
      await importantDatesController.getHandler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'projects.important_dates.start_outline_business_case.range_hint',
        expect.objectContaining({
          rangeStart: 'Month 4 2025',
          rangeEnd: 'Month 3 2027'
        })
      )
    })

    test('should build rangeHint 1 month after previous stage for COMPLETE_OUTLINE_BUSINESS_CASE', async () => {
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

      // Previous stage (start OBC) is April 2025, so the range starts May 2025
      expect(formatDate).toHaveBeenCalledWith(5, 2025)
      expect(mockRequest.t).toHaveBeenCalledWith(
        'projects.important_dates.complete_outline_business_case.range_hint',
        expect.objectContaining({
          rangeStart: 'Month 5 2025',
          rangeEnd: 'Month 3 2027'
        })
      )
    })

    test('should build rangeHint up to 1 month before OBC start for EARLIEST_START_DATE', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.EARLIEST_START_DATE)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.EARLIEST_START_DATE] = {
        backLinkOptions: { url: '/back' },
        localKeyPrefix: 'projects.important_dates.earliest_date',
        fieldType: 'date',
        monthField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
        yearField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR,
        fieldName: 'earliestWithGia',
        schema: {}
      }

      await importantDatesController.getHandler(mockRequest, mockH)

      // OBC start is April 2025, so the upper bound is March 2025
      expect(formatDate).toHaveBeenCalledWith(3, 2025)
      expect(mockRequest.t).toHaveBeenCalledWith(
        'projects.important_dates.earliest_date.range_hint',
        expect.objectContaining({
          rangeEnd: 'Month 3 2025'
        })
      )
    })

    test('should return empty rangeHint for EARLIEST_START_DATE when OBC start is missing', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.EARLIEST_START_DATE)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.EARLIEST_START_DATE] = {
        backLinkOptions: { url: '/back' },
        localKeyPrefix: 'projects.important_dates.earliest_date',
        fieldType: 'date',
        monthField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
        yearField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR,
        fieldName: 'earliestWithGia',
        schema: {}
      }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
      })

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            rangeHint: ''
          })
        })
      )
    })

    test('should not build a rangeHint for radio field COULD_START_EARLY', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.COULD_START_EARLY)
      IMPORTANT_DATES_CONFIG[PROJECT_STEPS.COULD_START_EARLY] = {
        backLinkOptions: { url: '/back' },
        localKeyPrefix: 'projects.important_dates.could_start_earlier',
        fieldType: 'radio',
        fieldName: 'couldStartEarly',
        schema: {}
      }

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            rangeHint: ''
          })
        })
      )
    })

    test('should build a dynamic dateHint from the range start for START_OUTLINE_BUSINESS_CASE', async () => {
      await importantDatesController.getHandler(mockRequest, mockH)

      // Minimum accepted input is the financial year start (April 2025)
      expect(mockRequest.t).toHaveBeenCalledWith(
        'projects.important_dates.date_hint',
        { month: 4, year: 2025 }
      )
    })

    test('should build a dynamic dateHint 1 month after the previous stage for COMPLETE_OUTLINE_BUSINESS_CASE', async () => {
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

      // Previous stage (start OBC) is April 2025, so the minimum is May 2025
      expect(mockRequest.t).toHaveBeenCalledWith(
        'projects.important_dates.date_hint',
        { month: 5, year: 2025 }
      )
    })

    test('should fall back to the generic date hint when there is no resolvable range start', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001'
      })

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith('projects.common.date_hint')
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

    test('uses previous calendar year for FY start when current month is before April', async () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-03-01')) // March = month 3 < 4

      await importantDatesController.getHandler(mockRequest, mockH)

      // March 2025 → FY 2024 starts in April 2024
      expect(formatDate).toHaveBeenCalledWith(4, 2024)

      vi.useRealTimers()
    })

    test('currentFinancialYearStart falls back to empty string when formatDate returns falsy', async () => {
      // Make formatDate return null for all calls to exercise the || '' guard
      formatDate.mockReturnValue(null)

      await importantDatesController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            currentFinancialYearStart: ''
          })
        })
      )
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

    test('falls back to overview when step is not in the navigation sequence', async () => {
      const UNKNOWN_STEP = 'some-unlisted-step'
      IMPORTANT_DATES_CONFIG[UNKNOWN_STEP] = {
        backLinkOptions: {},
        localKeyPrefix: 'projects.important_dates.start_outline_business_case',
        fieldType: 'date',
        monthField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
        yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
        schema: {}
      }
      getProjectStep.mockReturnValue(UNKNOWN_STEP)
      getSessionData.mockReturnValue({ slug: 'TEST-001' })
      navigateToProjectOverview.mockReturnValue('overview-redirect')

      const result = await importantDatesController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe('overview-redirect')
    })
  })

  describe('STR/STU simplified journey', () => {
    const SIMPLIFIED_TYPES = ['STU', 'STR']

    describe('getHandler — skips middle steps', () => {
      test.each(SIMPLIFIED_TYPES)(
        '%s: redirects COMPLETE_OUTLINE_BUSINESS_CASE to START_BENEFITS',
        async (projectType) => {
          getProjectStep.mockReturnValue(
            PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE
          )
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType
          })

          await importantDatesController.getHandler(mockRequest, mockH)

          expect(mockH.redirect).toHaveBeenCalledWith(
            ROUTES.PROJECT.EDIT.START_BENEFITS.replace(
              '{referenceNumber}',
              'TEST-001'
            )
          )
        }
      )

      test.each(SIMPLIFIED_TYPES)(
        '%s: redirects AWARD_MAIN_CONTRACT to START_BENEFITS',
        async (projectType) => {
          getProjectStep.mockReturnValue(PROJECT_STEPS.AWARD_MAIN_CONTRACT)
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType
          })

          await importantDatesController.getHandler(mockRequest, mockH)

          expect(mockH.redirect).toHaveBeenCalledWith(
            ROUTES.PROJECT.EDIT.START_BENEFITS.replace(
              '{referenceNumber}',
              'TEST-001'
            )
          )
        }
      )

      test.each(SIMPLIFIED_TYPES)(
        '%s: redirects START_WORK to START_BENEFITS',
        async (projectType) => {
          getProjectStep.mockReturnValue(PROJECT_STEPS.START_WORK)
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType
          })

          await importantDatesController.getHandler(mockRequest, mockH)

          expect(mockH.redirect).toHaveBeenCalledWith(
            ROUTES.PROJECT.EDIT.START_BENEFITS.replace(
              '{referenceNumber}',
              'TEST-001'
            )
          )
        }
      )

      test.each(SIMPLIFIED_TYPES)(
        '%s: renders view for START_OUTLINE_BUSINESS_CASE (not skipped)',
        async (projectType) => {
          getProjectStep.mockReturnValue(
            PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE
          )
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })

          await importantDatesController.getHandler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            PROJECT_VIEWS.IMPORTANT_DATES,
            expect.any(Object)
          )
        }
      )

      test.each(SIMPLIFIED_TYPES)(
        '%s: renders view for START_BENEFITS (not skipped)',
        async (projectType) => {
          getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
          IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
            backLinkOptions: {},
            localKeyPrefix:
              'projects.important_dates.start_achieving_its_benefits',
            fieldType: 'date',
            monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
            yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
            schema: {}
          }
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })

          await importantDatesController.getHandler(mockRequest, mockH)

          expect(mockH.view).toHaveBeenCalledWith(
            PROJECT_VIEWS.IMPORTANT_DATES,
            expect.any(Object)
          )
        }
      )
    })

    describe('postHandler — simplified step sequence', () => {
      test.each(SIMPLIFIED_TYPES)(
        '%s: after START_OUTLINE_BUSINESS_CASE goes to START_BENEFITS',
        async (projectType) => {
          getProjectStep.mockReturnValue(
            PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE
          )
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })
          IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE] = {
            backLinkOptions: {},
            localKeyPrefix:
              'projects.important_dates.start_outline_business_case',
            fieldType: 'date',
            monthField:
              PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
            yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
            schema: {}
          }
          saveProjectWithErrorHandling.mockResolvedValue(null)

          await importantDatesController.postHandler(mockRequest, mockH)

          expect(mockH.redirect).toHaveBeenCalledWith(
            ROUTES.PROJECT.EDIT.START_BENEFITS.replace(
              '{referenceNumber}',
              'TEST-001'
            )
          )
        }
      )
    })

    describe('_getConfig locale key override', () => {
      test('STU START_OUTLINE uses study_start locale prefix', async () => {
        getProjectStep.mockReturnValue(
          PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE
        )
        getSessionData.mockReturnValue({
          slug: 'TEST-001',
          projectType: 'STU',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
        })
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE] = {
          backLinkOptions: {},
          localKeyPrefix:
            'projects.important_dates.start_outline_business_case',
          fieldType: 'date',
          monthField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
          yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
          schema: {}
        }

        await importantDatesController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.important_dates.study_start'
          })
        )
      })

      test('STR START_BENEFITS uses strategy_end locale prefix', async () => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
        getSessionData.mockReturnValue({
          slug: 'TEST-001',
          projectType: 'STR',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
        })
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
          backLinkOptions: {
            targetURL: ROUTES.PROJECT.OVERVIEW,
            targetEditURL: ROUTES.PROJECT.EDIT.START_WORK,
            conditionalRedirect: false
          },
          localKeyPrefix:
            'projects.important_dates.start_achieving_its_benefits',
          fieldType: 'date',
          monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
          yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
          schema: {}
        }

        await importantDatesController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: 'projects.important_dates.strategy_end',
            backLinkOptions: expect.objectContaining({
              targetEditURL: ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE
            })
          })
        )
      })

      test.each(['STU', 'STR'])(
        '%s START_BENEFITS passes useObcAsPreviousStage=true to view data',
        async (projectType) => {
          getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })
          IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
            backLinkOptions: {},
            localKeyPrefix:
              'projects.important_dates.start_achieving_its_benefits',
            fieldType: 'date',
            monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
            yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
            schema: {}
          }

          await importantDatesController.getHandler(mockRequest, mockH)

          expect(buildViewData).toHaveBeenCalledWith(
            mockRequest,
            expect.objectContaining({
              additionalData: expect.objectContaining({
                useObcAsPreviousStage: true
              })
            })
          )
        }
      )

      test('full-journey project does not set useObcAsPreviousStage on START_BENEFITS', async () => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
        getSessionData.mockReturnValue({
          slug: 'TEST-001',
          projectType: 'DEF',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
        })
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
          backLinkOptions: {},
          localKeyPrefix:
            'projects.important_dates.start_achieving_its_benefits',
          fieldType: 'date',
          monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
          yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
          schema: {}
        }

        await importantDatesController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              useObcAsPreviousStage: false
            })
          })
        )
      })

      test.each(['STU', 'STR'])(
        '%s START_BENEFITS: _getPreviousStageData uses OBC start fields',
        async (projectType) => {
          getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: '5',
            [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })
          IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
            backLinkOptions: {},
            localKeyPrefix:
              'projects.important_dates.start_achieving_its_benefits',
            fieldType: 'date',
            monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
            yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
            schema: {}
          }

          await importantDatesController.getHandler(mockRequest, mockH)

          // formatDate should be called with OBC start values (not startConstruction)
          expect(formatDate).toHaveBeenCalledWith('5', '2025')
        }
      )
    })

    describe('range and date hints', () => {
      // [projectType, startDateLocalePrefix, endDateLocalePrefix]
      const HINT_PREFIXES = [
        ['STU', 'study_start', 'study_end'],
        ['STR', 'strategy_start', 'strategy_end']
      ]

      test.each(HINT_PREFIXES)(
        '%s START_OUTLINE_BUSINESS_CASE: range hint spans the financial year and date hint uses the FY start',
        async (projectType, startPrefix) => {
          getProjectStep.mockReturnValue(
            PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE
          )
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })
          IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE] = {
            backLinkOptions: {},
            localKeyPrefix:
              'projects.important_dates.start_outline_business_case',
            fieldType: 'date',
            monthField:
              PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
            yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
            schema: {}
          }

          await importantDatesController.getHandler(mockRequest, mockH)

          // Lower bound is the financial year start (April 2025); upper bound
          // is the financial year end (March 2027 for FY end year 2026).
          expect(mockRequest.t).toHaveBeenCalledWith(
            `projects.important_dates.${startPrefix}.range_hint`,
            expect.objectContaining({
              rangeStart: 'Month 4 2025',
              rangeEnd: 'Month 3 2027'
            })
          )
          expect(mockRequest.t).toHaveBeenCalledWith(
            'projects.important_dates.date_hint',
            { month: 4, year: 2025 }
          )
        }
      )

      test.each(HINT_PREFIXES)(
        '%s START_BENEFITS: range hint starts 1 month after the start date and date hint matches',
        async (projectType, _startPrefix, endPrefix) => {
          getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
          getSessionData.mockReturnValue({
            slug: 'TEST-001',
            projectType,
            [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: '5',
            [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
          })
          IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
            backLinkOptions: {},
            localKeyPrefix:
              'projects.important_dates.start_achieving_its_benefits',
            fieldType: 'date',
            monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
            yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
            schema: {}
          }

          await importantDatesController.getHandler(mockRequest, mockH)

          // Previous stage (study/strategy start) is May 2025, so the range
          // starts June 2025 and the date hint reflects the same minimum.
          expect(formatDate).toHaveBeenCalledWith(6, 2025)
          expect(mockRequest.t).toHaveBeenCalledWith(
            `projects.important_dates.${endPrefix}.range_hint`,
            expect.objectContaining({
              rangeStart: 'Month 6 2025',
              rangeEnd: 'Month 3 2027'
            })
          )
          expect(mockRequest.t).toHaveBeenCalledWith(
            'projects.important_dates.date_hint',
            { month: 6, year: 2025 }
          )
        }
      )

      test('full-journey START_BENEFITS still derives its range from start construction, not the OBC start', async () => {
        getProjectStep.mockReturnValue(PROJECT_STEPS.START_BENEFITS)
        getSessionData.mockReturnValue({
          slug: 'TEST-001',
          projectType: 'DEF',
          [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: '5',
          [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: '2025',
          [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: '9',
          [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: '2025',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: '2025',
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: '2026'
        })
        IMPORTANT_DATES_CONFIG[PROJECT_STEPS.START_BENEFITS] = {
          backLinkOptions: {},
          localKeyPrefix:
            'projects.important_dates.start_achieving_its_benefits',
          fieldType: 'date',
          monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
          yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
          schema: {}
        }

        await importantDatesController.getHandler(mockRequest, mockH)

        // Previous stage (start construction) is Sep 2025, so the range starts
        // Oct 2025 — proving the simplified fix does not affect the full journey.
        expect(mockRequest.t).toHaveBeenCalledWith(
          'projects.important_dates.start_achieving_its_benefits.range_hint',
          expect.objectContaining({
            rangeStart: 'Month 10 2025',
            rangeEnd: 'Month 3 2027'
          })
        )
        expect(mockRequest.t).toHaveBeenCalledWith(
          'projects.important_dates.date_hint',
          { month: 10, year: 2025 }
        )
      })
    })
  })
})
