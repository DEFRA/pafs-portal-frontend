import { beforeEach, describe, expect, test, vi } from 'vitest'
import { wholeLifeCostController } from './controller.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  extractApiError,
  extractJoiErrors
} from '../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import { getWlcSchemaForProjectType } from '../schemas/wlc-schema.js'

vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')
vi.mock('../schemas/wlc-schema.js', async () => {
  const actual = await vi.importActual('../schemas/wlc-schema.js')
  return {
    ...actual,
    getWlcSchemaForProjectType: vi.fn()
  }
})

describe('wholeLifeCostController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      params: { referenceNumber: 'acc501e-000a-001a' },
      payload: {},
      logger: { error: vi.fn() }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue('takeover')
    }

    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
      slug: 'acc501e-000a-001a'
    })

    buildViewData.mockReturnValue({ pageTitle: 'WLC' })
    navigateToProjectOverview.mockReturnValue('overview-redirect')
    extractJoiErrors.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: 'Invalid'
    })
    extractApiError.mockReturnValue({ errorCode: 'NETWORK_ERROR' })
  })

  describe('getHandler', () => {
    test('redirects to overview for hidden project type', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STR
      })

      const result = await wholeLifeCostController.getHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith(
        'acc501e-000a-001a',
        mockH
      )
      expect(result).toBe('overview-redirect')
    })

    test('renders view for visible project type', async () => {
      await wholeLifeCostController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          localKeyPrefix: 'projects.whole_life_cost',
          backLinkOptions: {
            targetEditURL: ROUTES.PROJECT.OVERVIEW,
            conditionalRedirect: true
          },
          additionalData: expect.objectContaining({
            step: expect.any(String),
            isMandatory: expect.any(Boolean),
            columnWidth: 'full'
          })
        })
      )
      expect(mockH.view).toHaveBeenCalledWith(PROJECT_VIEWS.WHOLE_LIFE_COST, {
        pageTitle: 'WLC'
      })
    })
  })

  describe('postHandler', () => {
    test('sanitizes comma-separated payload before session update and validation', async () => {
      const validate = vi.fn().mockReturnValue({ error: null })
      getWlcSchemaForProjectType.mockReturnValue({ validate })
      saveProjectWithErrorHandling.mockResolvedValue('validation-error-view')
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '1,234,567',
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS]:
          ' 2,500 ',
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_RISK_CONTINGENCY_COSTS]: '300',
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS]: '4,000'
      }

      await wholeLifeCostController.postHandler(mockRequest, mockH)

      const expectedSanitized = {
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '1234567',
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS]:
          '2500',
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_RISK_CONTINGENCY_COSTS]: '300',
        [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS]: '4000'
      }

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expectedSanitized
      )
      expect(validate).toHaveBeenCalledWith(expectedSanitized, {
        abortEarly: false
      })
    })

    test('returns validation view when joi validation fails', async () => {
      const validate = vi.fn().mockReturnValue({ error: { details: [{}] } })
      getWlcSchemaForProjectType.mockReturnValue({ validate })

      await wholeLifeCostController.postHandler(mockRequest, mockH)

      expect(extractJoiErrors).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.WHOLE_LIFE_COST,
        expect.objectContaining({ pageTitle: 'WLC' })
      )
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('redirects to overview after successful save', async () => {
      getWlcSchemaForProjectType.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: null })
      })
      saveProjectWithErrorHandling.mockResolvedValue(null)

      const result = await wholeLifeCostController.postHandler(
        mockRequest,
        mockH
      )

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.WHOLE_LIFE_COST,
        { pageTitle: 'WLC' },
        PROJECT_VIEWS.WHOLE_LIFE_COST
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace(
          '{referenceNumber}',
          'acc501e-000a-001a'
        )
      )
      expect(result).toBe('takeover')
    })

    test('returns save helper response when helper handles error', async () => {
      getWlcSchemaForProjectType.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: null })
      })
      saveProjectWithErrorHandling.mockResolvedValue('handled-error-view')

      const result = await wholeLifeCostController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe('handled-error-view')
    })

    test('logs and renders api error when save throws', async () => {
      const error = new Error('boom')
      getWlcSchemaForProjectType.mockReturnValue({
        validate: vi.fn().mockReturnValue({ error: null })
      })
      saveProjectWithErrorHandling.mockRejectedValue(error)

      await wholeLifeCostController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error in Whole Life Cost POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.WHOLE_LIFE_COST,
        expect.objectContaining({ error: { errorCode: 'NETWORK_ERROR' } })
      )
    })

    test('redirects hidden project type to overview', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STU,
        slug: 'acc501e-000a-001a'
      })

      const result = await wholeLifeCostController.postHandler(
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
