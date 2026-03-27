import { beforeEach, describe, expect, test, vi } from 'vitest'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { wholeLifeBenefitsController } from './controller.js'
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
import {
  getWlbSchemaForProjectType,
  WLB_HIDDEN_PROJECT_TYPES
} from '../schemas/wlb-schemas.js'

vi.mock('../../../common/helpers/error-renderer/index.js', () => ({
  extractApiError: vi.fn(),
  extractJoiErrors: vi.fn()
}))

vi.mock('../helpers/project-submission.js', () => ({
  saveProjectWithErrorHandling: vi.fn()
}))

vi.mock('../helpers/project-utils.js', () => ({
  buildViewData: vi.fn(),
  getSessionData: vi.fn(),
  navigateToProjectOverview: vi.fn(),
  updateSessionData: vi.fn()
}))

vi.mock('../schemas/wlb-schemas.js', () => ({
  getWlbSchemaForProjectType: vi.fn(),
  WLB_HIDDEN_PROJECT_TYPES: ['STR', 'STU'],
  WLB_MANDATORY_PROJECT_TYPES: ['DEF', 'REF', 'REP']
}))

describe('wholeLifeBenefitsController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: { referenceNumber: 'REF-123' },
      logger: { error: vi.fn() }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    getSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
      slug: 'REF-123'
    })

    buildViewData.mockImplementation((_request, options = {}) => ({
      viewFromBuildViewData: true,
      ...options.additionalData
    }))

    getWlbSchemaForProjectType.mockReturnValue({
      validate: vi.fn(() => ({ error: null }))
    })

    saveProjectWithErrorHandling.mockResolvedValue(null)
  })

  describe('getHandler', () => {
    test('redirects to overview for hidden project types', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: WLB_HIDDEN_PROJECT_TYPES[0],
        slug: 'REF-123'
      })
      navigateToProjectOverview.mockReturnValue('redirected')

      const result = await wholeLifeBenefitsController.getHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('REF-123', mockH)
      expect(result).toBe('redirected')
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('renders view for non-hidden project type', async () => {
      await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.WHOLE_LIFE_BENEFITS,
        expect.objectContaining({
          viewFromBuildViewData: true
        })
      )
    })

    test('passes isMandatory=true for DEF type', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
        slug: 'REF-123'
      })

      await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            isMandatory: true
          })
        })
      )
    })

    test('passes isMandatory=false for HCR type', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.HCR,
        slug: 'REF-123'
      })

      await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            isMandatory: false
          })
        })
      )
    })
  })

  describe('postHandler', () => {
    test('redirects to overview for hidden project types', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STU,
        slug: 'REF-123'
      })
      navigateToProjectOverview.mockReturnValue('redirected')

      const result = await wholeLifeBenefitsController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('REF-123', mockH)
      expect(result).toBe('redirected')
      expect(updateSessionData).not.toHaveBeenCalled()
    })

    test('sanitizes payload and updates session before validation', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: ' 1,234 ',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '2,000 '
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1234',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '2000'
      })
    })

    test('renders view with Joi field errors when schema validation fails', async () => {
      const validationError = new Error('invalid')
      getWlbSchemaForProjectType.mockReturnValue({
        validate: vi.fn(() => ({ error: validationError }))
      })
      extractJoiErrors.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]:
          'Please enter value'
      })

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(extractJoiErrors).toHaveBeenCalledWith(validationError)
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.WHOLE_LIFE_BENEFITS,
        expect.objectContaining({
          fieldErrors: {
            [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]:
              'Please enter value'
          }
        })
      )
    })

    test('skips frontend validation when project type has no schema', async () => {
      getWlbSchemaForProjectType.mockReturnValue(null)

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.WHOLE_LIFE_BENEFITS,
        expect.any(Object),
        PROJECT_VIEWS.WHOLE_LIFE_BENEFITS
      )
    })

    test('returns early when saveProjectWithErrorHandling returns a response', async () => {
      const earlyResponse = { handled: true }
      saveProjectWithErrorHandling.mockResolvedValue(earlyResponse)

      const result = await wholeLifeBenefitsController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(earlyResponse)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('redirects to overview when save succeeds with no early response', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
        slug: 'ABC-001'
      })

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'ABC-001')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('renders error view when save throws', async () => {
      const saveError = new Error('save failed')
      saveProjectWithErrorHandling.mockRejectedValue(saveError)
      extractApiError.mockReturnValue('api error')

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error in Whole Life Benefits POST',
        saveError
      )
      expect(extractApiError).toHaveBeenCalledWith(saveError)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.WHOLE_LIFE_BENEFITS,
        expect.objectContaining({
          error: 'api error'
        })
      )
    })

    test('calls getWlbSchemaForProjectType with correct project type', async () => {
      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
        slug: 'REF-123'
      })

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(getWlbSchemaForProjectType).toHaveBeenCalledWith(PROJECT_TYPES.REF)
    })

    test('preserves all WLB field values during sanitization', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '2,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: '3,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]: '4,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: '5,000'
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1000',
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '2000',
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: '3000',
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]:
            '4000',
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: '5000'
        })
      )
    })

    test('handles payload with non-string WLB values', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: 1000,
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: null,
        other: 'value'
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: 1000,
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: null,
          other: 'value'
        })
      )
    })

    test('handles empty payload', async () => {
      mockRequest.payload = {}

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {})
    })

    test('calls buildViewData when rendering validation error', async () => {
      getWlbSchemaForProjectType.mockReturnValue({
        validate: vi.fn(() => ({
          error: new Error('Validation failed')
        }))
      })
      extractJoiErrors.mockReturnValue({
        field: 'error'
      })

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object)
      )
    })

    test('passes PROJECT_PAYLOAD_LEVELS constant to saveProjectWithErrorHandling', async () => {
      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.WHOLE_LIFE_BENEFITS,
        expect.any(Object),
        PROJECT_VIEWS.WHOLE_LIFE_BENEFITS
      )
    })
  })

  describe('internal methods', () => {
    describe('_getProjectType', () => {
      test('should return project type from session', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(getSessionData).toHaveBeenCalledWith(mockRequest)
      })
    })

    describe('_isHiddenForProjectType', () => {
      test('should return true for STR type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STR,
          slug: 'REF-123'
        })
        navigateToProjectOverview.mockReturnValue('redirect')

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).toHaveBeenCalled()
      })

      test('should return true for STU type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STU,
          slug: 'REF-123'
        })
        navigateToProjectOverview.mockReturnValue('redirect')

        await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).toHaveBeenCalled()
      })

      test('should return false for DEF type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).not.toHaveBeenCalled()
      })

      test('should return false for REF type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).not.toHaveBeenCalled()
      })

      test('should return false for REP type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REP,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).not.toHaveBeenCalled()
      })

      test('should return false for ELO type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.ELO,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).not.toHaveBeenCalled()
      })

      test('should return false for HCR type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.HCR,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(navigateToProjectOverview).not.toHaveBeenCalled()
      })
    })

    describe('_isMandatory', () => {
      test('should return true for DEF type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              isMandatory: true
            })
          })
        )
      })

      test('should return true for REF type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              isMandatory: true
            })
          })
        )
      })

      test('should return true for REP type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REP,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              isMandatory: true
            })
          })
        )
      })

      test('should return false for ELO type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.ELO,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              isMandatory: false
            })
          })
        )
      })

      test('should return false for HCR type', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.HCR,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              isMandatory: false
            })
          })
        )
      })
    })

    describe('_buildViewData', () => {
      test('should include all required WLB field names', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              wlbFields: expect.arrayContaining([
                PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS,
                PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED,
                PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS,
                PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS,
                PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS
              ])
            })
          })
        )
      })

      test('should include step constant in view data', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              step: expect.any(String)
            })
          })
        )
      })

      test('should include columnWidth full in view data', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              columnWidth: 'full'
            })
          })
        )
      })

      test('should include PROJECT_PAYLOAD_FIELDS constant', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            additionalData: expect.objectContaining({
              PROJECT_PAYLOAD_FIELDS: expect.any(Object)
            })
          })
        )
      })

      test('should pass conditional redirect back link options', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            backLinkOptions: {
              targetEditURL: ROUTES.PROJECT.OVERVIEW,
              conditionalRedirect: true
            }
          })
        )
      })

      test('should pass local key prefix for internationalization', async () => {
        getSessionData.mockReturnValue({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          slug: 'REF-123'
        })

        await wholeLifeBenefitsController.getHandler(mockRequest, mockH)

        expect(buildViewData).toHaveBeenCalledWith(
          mockRequest,
          expect.objectContaining({
            localKeyPrefix: expect.stringContaining('whole_life_benefits')
          })
        )
      })
    })
  })

  describe('sanitizeWlbPayload function', () => {
    test('should remove commas from string values', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1,234,567'
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1234567'
        })
      )
    })

    test('should trim whitespace from string values', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '  1000  '
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1000'
        })
      )
    })

    test('should handle multiple spaces and commas', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '  1,234,567  '
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1234567'
        })
      )
    })

    test('should preserve non-string values unchanged', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: 5000,
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: null
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: 5000,
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: null
        })
      )
    })

    test('should not sanitize non-WLB fields', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1,000',
        otherField: '2,000'
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1000',
          otherField: '2,000'
        })
      )
    })

    test('should handle all 5 WLB fields simultaneously', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]:
          '  2,000  ',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: '3,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]:
          '  4,000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: '5,000  '
      }

      await wholeLifeBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '1000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '2000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: '3000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]: '4000',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: '5000'
      })
    })
  })
})
