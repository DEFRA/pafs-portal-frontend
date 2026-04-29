import { describe, test, expect, beforeEach, vi } from 'vitest'
import { financialYearWarningController } from './financial-year-warning-controller.js'
import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview
} from '../../helpers/project-utils.js'

vi.mock('../../../../common/helpers/error-renderer/index.js')
vi.mock('../../helpers/project-submission.js')
vi.mock('../../helpers/project-utils.js')

describe('FinancialYearWarningController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: { referenceNumber: 'TEST-001' },
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

    buildViewData.mockReturnValue({
      pageTitle: 'Warning Page',
      backLink: '/back'
    })

    saveProjectWithErrorHandling.mockResolvedValue(null)
    navigateToProjectOverview.mockReturnValue('overview-redirect')
  })

  describe('getHandler', () => {
    test('should render warning view with back link to start year step', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_START_YEAR
      })

      await financialYearWarningController.getHandler(mockRequest, mockH)

      const expectedBackLink = ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR.replace(
        '{referenceNumber}',
        'TEST-001'
      )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: expectedBackLink
          })
        })
      )
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING,
        expect.any(Object)
      )
    })

    test('should render warning view with back link to end year step', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_END_YEAR
      })

      await financialYearWarningController.getHandler(mockRequest, mockH)

      const expectedBackLink = ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR.replace(
        '{referenceNumber}',
        'TEST-001'
      )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: expectedBackLink
          })
        })
      )
    })

    test('should render warning view with back link to start year manual step', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL
      })

      await financialYearWarningController.getHandler(mockRequest, mockH)

      const expectedBackLink =
        ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: expectedBackLink
          })
        })
      )
    })

    test('should render warning view with back link to end year manual step', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL
      })

      await financialYearWarningController.getHandler(mockRequest, mockH)

      const expectedBackLink =
        ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: expectedBackLink
          })
        })
      )
    })

    test('should fall back to overview when no pending step', async () => {
      getSessionData.mockReturnValue({})

      await financialYearWarningController.getHandler(mockRequest, mockH)

      const expectedBackLink = ROUTES.PROJECT.OVERVIEW.replace(
        '{referenceNumber}',
        'TEST-001'
      )
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          backLinkOptions: expect.objectContaining({
            targetURL: expectedBackLink
          })
        })
      )
    })
  })

  describe('postHandler', () => {
    test('should save with FINANCIAL_START_YEAR level when pending step is start year', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_START_YEAR
      })

      const result = await financialYearWarningController.postHandler(
        mockRequest,
        mockH
      )

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING
      )
      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe('overview-redirect')
    })

    test('should save with FINANCIAL_START_YEAR level when pending step is start year manual', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL
      })

      await financialYearWarningController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING
      )
    })

    test('should save with FINANCIAL_END_YEAR level when pending step is end year', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_END_YEAR
      })

      await financialYearWarningController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING
      )
    })

    test('should save with FINANCIAL_END_YEAR level when pending step is end year manual', async () => {
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL
      })

      await financialYearWarningController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR,
        expect.any(Object),
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING
      )
    })

    test('should return error response from saveProjectWithErrorHandling', async () => {
      const errorResponse = { error: 'save failed' }
      saveProjectWithErrorHandling.mockResolvedValue(errorResponse)
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_START_YEAR
      })

      const result = await financialYearWarningController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(errorResponse)
      expect(navigateToProjectOverview).not.toHaveBeenCalled()
    })

    test('should handle errors and render view with error message', async () => {
      const error = new Error('Test error')
      saveProjectWithErrorHandling.mockRejectedValue(error)
      extractApiError.mockReturnValue({ message: 'API error' })
      getSessionData.mockReturnValue({
        pendingFinancialYearStep: PROJECT_STEPS.FINANCIAL_START_YEAR
      })

      await financialYearWarningController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error financial year warning POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })
  })
})
