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

vi.mock('../helpers/project-utils.js')
vi.mock('../helpers/project-submission.js')

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
      view: vi.fn(),
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
})
