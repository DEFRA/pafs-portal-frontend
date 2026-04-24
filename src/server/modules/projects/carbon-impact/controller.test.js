import { beforeEach, describe, expect, test, vi } from 'vitest'
import { carbonImpactController } from './controller.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  buildViewData,
  getSessionData,
  getProjectStep,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import { getCarbonImpactCalc } from '../../../common/services/project/project-service.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

vi.mock('../helpers/project-utils.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../../../common/services/project/project-service.js')
vi.mock('../../../common/helpers/auth/session-manager.js')

describe('carbonImpactController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: { referenceNumber: 'acc501e-000a-001a' },
      payload: {},
      logger: { error: vi.fn() },
      route: { path: '/project/{referenceNumber}/carbon-impact' }
    }

    mockH = {
      view: vi.fn().mockReturnValue('view-response'),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue('takeover')
    }

    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
      slug: 'acc501e-000a-001a',
      [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: 3,
      [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: 2025,
      [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: 6,
      [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: 2026
    })

    buildViewData.mockReturnValue({ pageTitle: 'Carbon Impact' })
    navigateToProjectOverview.mockReturnValue('overview-redirect')
    saveProjectWithErrorHandling.mockResolvedValue(null)
    getAuthSession.mockReturnValue({ accessToken: 'test-token' })
    getCarbonImpactCalc.mockResolvedValue({ success: false })

    // Mock getProjectStep to extract the last part of the path
    getProjectStep.mockImplementation((request) => {
      const pathname = request?.route?.path || ''
      return pathname.split('/').pop()
    })
  })

  describe('getHandler', () => {
    test('redirects to overview for hidden project type (STR)', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STR
      })

      const result = await carbonImpactController.getHandler(mockRequest, mockH)

      expect(navigateToProjectOverview).toHaveBeenCalledWith(
        'acc501e-000a-001a',
        mockH
      )
      expect(result).toBe('overview-redirect')
    })

    test('redirects to overview for hidden project type (STU)', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STU
      })

      const result = await carbonImpactController.getHandler(mockRequest, mockH)

      expect(result).toBe('overview-redirect')
    })

    test('renders input page view for carbon-cost-build', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          localKeyPrefix: 'projects.carbon_cost_build'
        })
      )
      expect(mockH.view).toHaveBeenCalled()
    })

    test('renders carbon-prepare view when prerequisites are met', async () => {
      // When on the entry point and prerequisites are met, should redirect to prepare
      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('renders carbon-required-information view when prerequisites are not met', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
        slug: 'acc501e-000a-001a'
        // Missing prerequisite fields
      })

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })
  })

  describe('postHandler', () => {
    test('redirect on carbon-required-information post', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-required-information'

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace(
          '{referenceNumber}',
          'acc501e-000a-001a'
        )
      )
      expect(result).toBe('takeover')
    })

    test('redirect on carbon-prepare post to first input page', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-prepare'

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    test('updates session and redirects on carbon-cost-build post', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '1,234.56'
      }

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      // Should update session with the field value
      expect(updateSessionData).toHaveBeenCalled()
      // Should persist to database using the correct payload level
      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.CARBON_COST_BUILD,
        expect.any(Object),
        expect.any(String)
      )
      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    test('sanitizes comma-separated values', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '1,234.56'
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '1234.56'
        })
      )
    })

    test('redirects hidden project type to overview', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STU,
        slug: 'acc501e-000a-001a'
      })
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith(
        'acc501e-000a-001a',
        mockH
      )
      expect(result).toBe('overview-redirect')
    })
  })

  describe('getHandler — info and display pages', () => {
    test('renders carbon-required-information view', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-required-information'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('renders carbon-prepare view', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-prepare'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('renders whole-life-carbon display page without calling API', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/whole-life-carbon'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(getCarbonImpactCalc).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()
    })

    test('renders net-carbon display page without calling API', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/net-carbon'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(getCarbonImpactCalc).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()
    })

    test('renders carbon-summary display page and calls getCarbonImpactCalc', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(getCarbonImpactCalc).toHaveBeenCalledWith(
        'acc501e-000a-001a',
        'test-token'
      )
      expect(mockH.view).toHaveBeenCalled()
    })

    test('renders carbon-impact-assessment display page and calls getCarbonImpactCalc', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-impact-assessment'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(getCarbonImpactCalc).toHaveBeenCalledWith(
        'acc501e-000a-001a',
        'test-token'
      )
      expect(mockH.view).toHaveBeenCalled()
    })

    test('still renders carbon-summary when API returns no success', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'
      getCarbonImpactCalc.mockResolvedValue({ success: false })

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('still renders carbon-summary when getCarbonImpactCalc throws', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'
      getCarbonImpactCalc.mockRejectedValue(new Error('API unreachable'))

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('enriches displayData with calc values on successful API response', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'
      getCarbonImpactCalc.mockResolvedValue({
        success: true,
        data: {
          capitalCarbonBaseline: 100,
          capitalCarbonTarget: 90,
          operationalCarbonBaseline: 50,
          operationalCarbonTarget: 45,
          netCarbonEstimate: 150,
          netCarbonWithBlanks: 120,
          constructionTotalFunding: 500000,
          hasValuesChanged: false,
          hexdigest: 'abc123',
          carbonCostBuild: '10.0',
          carbonCostOperation: '5.0',
          carbonCostSequestered: '2.0',
          carbonCostAvoided: '1.0'
        }
      })

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            displayData: expect.objectContaining({
              capitalCarbonBaseline: 100,
              capitalCarbonTarget: 90
            })
          })
        })
      )
    })

    test('sets fallback netCarbonEstimate when API returns no success', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
        slug: 'acc501e-000a-001a',
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: 3,
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: 2026,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '10',
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '5'
      })
      getCarbonImpactCalc.mockResolvedValue({ success: false })

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            displayData: expect.objectContaining({
              netCarbonEstimate: expect.any(Number),
              allCarbonValuesPresent: false
            })
          })
        })
      )
    })

    test('uses empty accessToken when authSession is null', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'
      getAuthSession.mockReturnValue(null)

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(getCarbonImpactCalc).toHaveBeenCalledWith('acc501e-000a-001a', '')
    })

    test('formats currency values in displayData (null → Not provided)', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            displayData: expect.objectContaining({
              benefitDisplay: 'Not provided',
              forecastDisplay: 'Not provided'
            })
          })
        })
      )
    })

    test('formats valid numeric currency values in displayData', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
        slug: 'acc501e-000a-001a',
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: 3,
        [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: 2025,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: 6,
        [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: 2026,
        [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '500000',
        [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000'
      })

      await carbonImpactController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            displayData: expect.objectContaining({
              forecastDisplay: '£500,000',
              benefitDisplay: '£200,000'
            })
          })
        })
      )
    })
  })

  describe('postHandler — display page steps', () => {
    test('POST whole-life-carbon redirects to next step', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/whole-life-carbon'

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    test('POST net-carbon redirects to next step', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/net-carbon'

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    test('POST carbon-summary redirects to next step', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-summary'

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    test('POST carbon-impact-assessment saves hexdigest and redirects to overview', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-impact-assessment'
      getCarbonImpactCalc.mockResolvedValue({
        success: true,
        data: { hexdigest: 'abc123def456' }
      })

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(getCarbonImpactCalc).toHaveBeenCalledWith(
        'acc501e-000a-001a',
        'test-token'
      )
      expect(updateSessionData).toHaveBeenCalled()
      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        null,
        PROJECT_PAYLOAD_LEVELS.CARBON_VALUES_HEXDIGEST,
        {},
        null
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace(
          '{referenceNumber}',
          'acc501e-000a-001a'
        )
      )
      expect(result).toBe('takeover')
    })

    test('POST carbon-impact-assessment still redirects when API returns no hexdigest', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-impact-assessment'
      getCarbonImpactCalc.mockResolvedValue({ success: false })

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })

    test('POST carbon-impact-assessment still redirects when _saveHexdigest throws', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-impact-assessment'
      getCarbonImpactCalc.mockRejectedValue(new Error('API error'))

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalled()
      expect(result).toBe('takeover')
    })
  })

  describe('postHandler — remaining input steps', () => {
    test('POST carbon-cost-operation saves with correct payload level', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-cost-operation'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '50.00'
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.CARBON_COST_OPERATION,
        expect.any(Object),
        expect.any(String)
      )
    })

    test('POST carbon-cost-sequestered saves with correct payload level', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-cost-sequestered'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '10.5'
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.CARBON_COST_SEQUESTERED,
        expect.any(Object),
        expect.any(String)
      )
    })

    test('POST carbon-cost-avoided saves with correct payload level', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-avoided'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '3.0'
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.CARBON_COST_AVOIDED,
        expect.any(Object),
        expect.any(String)
      )
    })

    test('POST carbon-savings-net-economic-benefit saves with correct payload level', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-savings-net-economic-benefit'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000'
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
        expect.any(Object),
        expect.any(String)
      )
    })

    test('POST carbon-operational-cost-forecast saves with correct payload level', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-operational-cost-forecast'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '150000'
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.CARBON_OPERATIONAL_COST_FORECAST,
        expect.any(Object),
        expect.any(String)
      )
    })

    test('POST with null payload field stores null in session', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: ''
      }

      await carbonImpactController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: null
        })
      )
    })

    test('POST validation error (negative value) renders view instead of redirecting', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '-5.00'
      }

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(mockH.redirect).not.toHaveBeenCalled()
      expect(result).toBe('view-response')
    })

    test('POST validation error (non-numeric) renders view with error data', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-cost-operation'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: 'not-a-number'
      }

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(result).toBe('view-response')
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('POST returns error response from saveProjectWithErrorHandling', async () => {
      mockRequest.route.path = '/project/{referenceNumber}/carbon-cost-build'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '100.00'
      }
      saveProjectWithErrorHandling.mockResolvedValue('error-response')

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe('error-response')
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('POST required field validation error (empty operational cost)', async () => {
      mockRequest.route.path =
        '/project/{referenceNumber}/carbon-operational-cost-forecast'
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: ''
      }

      const result = await carbonImpactController.postHandler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(result).toBe('view-response')
    })
  })
})
