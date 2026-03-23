import { describe, test, expect, beforeEach, vi } from 'vitest'
import { goalsUrgencyConfidenceController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  extractApiError,
  extractJoiErrors
} from '../../../common/helpers/error-renderer/index.js'
import { GOALS_URGENCY_CONFIDENCE_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  updateSessionData,
  isConfidenceRestrictedProjectType
} from '../helpers/project-utils.js'
import { buildRadioItems } from '../helpers/radio-options.js'

vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-config.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')
vi.mock('../helpers/radio-options.js')

describe('GoalsUrgencyConfidenceController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: { step: PROJECT_STEPS.PROJECT_GOALS },
      logger: { error: vi.fn() },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    getSessionData.mockReturnValue({
      slug: 'TEST-001',
      [PROJECT_PAYLOAD_FIELDS.APPROACH]: 'Some approach text',
      [PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]: 'statutory_need',
      [PROJECT_PAYLOAD_FIELDS.URGENCY_DETAILS]: 'Some urgency details',
      [PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BETTER_PROTECTED]: 'high',
      [PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR]: 'medium_high',
      [PROJECT_PAYLOAD_FIELDS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING]: 'medium'
    })

    getProjectStep.mockReturnValue(PROJECT_STEPS.PROJECT_GOALS)

    GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.PROJECT_GOALS] = {
      localKeyPrefix: 'projects.project_goals',
      backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH,
      fieldType: 'character-count',
      maxLength: 700
    }

    GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.URGENCY_REASON] = {
      localKeyPrefix: 'projects.project_urgency.urgency_reason',
      backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.URGENCY_REASON,
      fieldType: 'radio'
    }

    GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.URGENCY_DETAILS] = {
      localKeyPrefix: 'projects.project_urgency.urgency_detail',
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.EDIT.URGENCY_REASON
      },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.URGENCY_DETAILS,
      fieldType: 'character-count',
      maxLength: 700
    }

    GOALS_URGENCY_CONFIDENCE_CONFIG[
      PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
    ] = {
      localKeyPrefix: 'projects.confidence_assessment.property_confidence',
      backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BETTER_PROTECTED,
      fieldType: 'radio'
    }

    GOALS_URGENCY_CONFIDENCE_CONFIG[
      PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
    ] = {
      localKeyPrefix: 'projects.confidence_assessment.gateway_confidence',
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED
      },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
      fieldType: 'radio'
    }

    GOALS_URGENCY_CONFIDENCE_CONFIG[
      PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
    ] = {
      localKeyPrefix: 'projects.confidence_assessment.funding_confidence',
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING,
      fieldType: 'radio'
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Test Page',
      backLink: '/back',
      localKeyPrefix: 'projects.project_goals'
    })

    buildRadioItems.mockReturnValue([
      { value: 'high', text: 'High', checked: true }
    ])

    isConfidenceRestrictedProjectType.mockImplementation((projectType) => {
      return ['ELO', 'HCR', 'STR', 'STU'].includes(projectType)
    })

    saveProjectWithErrorHandling.mockResolvedValue(null)
  })

  describe('getHandler', () => {
    test('should render view for PROJECT_GOALS step', async () => {
      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(getProjectStep).toHaveBeenCalledWith(mockRequest)
      expect(getSessionData).toHaveBeenCalledWith(mockRequest)
      expect(buildViewData).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          pageTitle: 'Test Page'
        })
      )
    })

    test('should build radio items for URGENCY_REASON step', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_REASON)

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        mockRequest.t,
        'projects.project_urgency.urgency_reason.options',
        null,
        'statutory_need',
        { useHints: false }
      )
    })

    test('should build radio items for CONFIDENCE_HOMES_BETTER_PROTECTED step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        mockRequest.t,
        'projects.confidence_assessment.property_confidence.options',
        null,
        'high',
        { useHints: true, useBoldLabels: true }
      )
    })

    test('should build radio items for CONFIDENCE_HOMES_BY_GATEWAY_FOUR step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        mockRequest.t,
        'projects.confidence_assessment.gateway_confidence.options',
        null,
        'medium_high',
        { useHints: true, useBoldLabels: true }
      )
    })

    test('should build radio items for CONFIDENCE_SECURED_PARTNERSHIP_FUNDING step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      )

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        mockRequest.t,
        'projects.confidence_assessment.funding_confidence.options',
        null,
        'medium',
        { useHints: true, useBoldLabels: true }
      )
    })

    test('should not build radio items for character-count steps', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.PROJECT_GOALS)

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).not.toHaveBeenCalled()
    })

    test('should redirect to overview for ELO project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'ELO'
      })
      mockRequest.params = { referenceNumber: 'TEST-001' }

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('should redirect to overview for HCR project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'HCR'
      })
      mockRequest.params = { referenceNumber: 'TEST-001' }

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('should redirect to overview for STR project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'STR'
      })
      mockRequest.params = { referenceNumber: 'TEST-001' }

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('should redirect to overview for STU project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'STU'
      })
      mockRequest.params = { referenceNumber: 'TEST-001' }

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('should allow DEF project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'DEF'
      })

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()
    })

    test('should not block non-confidence steps for restricted project types', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.PROJECT_GOALS)
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'ELO'
      })

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(mockH.redirect).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()
    })

    test('should include dynamic heading for URGENCY_DETAILS step', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)
      mockRequest.t.mockImplementation((key) => {
        if (
          key ===
          'projects.project_urgency.urgency_detail.statutory_need_heading'
        ) {
          return 'What is the business critical statutory need?'
        }
        return key
      })

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            dynamicHeading: 'What is the business critical statutory need?'
          })
        })
      )
    })

    test('should return null dynamic heading when urgency reason is not_urgent', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        urgencyReason: 'not_urgent'
      })

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            dynamicHeading: null
          })
        })
      )
    })

    test('should return null dynamic heading when urgency reason is missing', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)
      getSessionData.mockReturnValue({
        slug: 'TEST-001'
      })

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            dynamicHeading: null
          })
        })
      )
    })

    test('should include maxLength in additionalData for character-count steps', async () => {
      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            maxLength: 700,
            fieldType: 'character-count',
            fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH
          })
        })
      )
    })

    test('should default maxLength to 0 when not configured', async () => {
      GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.PROJECT_GOALS] = {
        ...GOALS_URGENCY_CONFIDENCE_CONFIG[PROJECT_STEPS.PROJECT_GOALS],
        maxLength: undefined
      }

      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            maxLength: 0
          })
        })
      )
    })
  })

  describe('postHandler', () => {
    test('should update session data with payload', async () => {
      mockRequest.payload = { approach: 'New approach text' }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        mockRequest.payload
      )
    })

    test('should redirect to overview after PROJECT_GOALS', async () => {
      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to URGENCY_DETAILS after URGENCY_REASON (non-not_urgent)', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_REASON)
      mockRequest.payload = {
        urgencyReason: 'statutory_need'
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.URGENCY_DETAILS.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to overview when urgency reason is not_urgent', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_REASON)
      mockRequest.payload = {
        urgencyReason: 'not_urgent'
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should redirect to overview after URGENCY_DETAILS', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should redirect to CONFIDENCE_HOMES_BY_GATEWAY_FOUR after CONFIDENCE_HOMES_BETTER_PROTECTED', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to CONFIDENCE_SECURED_PARTNERSHIP_FUNDING after CONFIDENCE_HOMES_BY_GATEWAY_FOUR', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should redirect to overview after CONFIDENCE_SECURED_PARTNERSHIP_FUNDING', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      )

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should call saveProjectWithErrorHandling with correct level for PROJECT_GOALS', async () => {
      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.APPROACH,
        expect.any(Object),
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE
      )
    })

    test('should redirect to overview on POST for ELO project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'ELO'
      })
      mockRequest.params = { referenceNumber: 'TEST-001' }
      mockRequest.payload = {
        confidenceHomesBetterProtected: 'high'
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should redirect to overview on POST for HCR project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'HCR'
      })
      mockRequest.params = { referenceNumber: 'TEST-001' }
      mockRequest.payload = {
        confidenceHomesByGatewayFour: 'medium_high'
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should allow POST for DEF project type on confidence step', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED
      )
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: 'DEF'
      })
      mockRequest.payload = {
        confidenceHomesBetterProtected: 'high'
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalled()
    })

    test('should call saveProjectWithErrorHandling with correct level for URGENCY_REASON', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_REASON)
      mockRequest.payload = {
        urgencyReason: 'statutory_need'
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.URGENCY_REASON,
        expect.any(Object),
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE
      )
    })

    test('should return response if saveProjectWithErrorHandling returns error', async () => {
      const errorResponse = { error: 'save failed' }
      saveProjectWithErrorHandling.mockResolvedValue(errorResponse)

      const result = await goalsUrgencyConfidenceController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(errorResponse)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('should render view with fieldErrors when validation fails for character-count', async () => {
      const joiError = {
        details: [
          {
            path: ['approach'],
            message: 'APPROACH_REQUIRED',
            context: { label: 'approach' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.PROJECT_GOALS
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({ approach: 'APPROACH_REQUIRED' })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          fieldErrors: { approach: 'APPROACH_REQUIRED' },
          validationMessageKey: 'required'
        })
      )
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should set validationMessageKey to max_length for MAX_LENGTH errors', async () => {
      const joiError = {
        details: [
          {
            path: ['approach'],
            message: 'APPROACH_MAX_LENGTH',
            context: { label: 'approach' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.PROJECT_GOALS
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({ approach: 'APPROACH_MAX_LENGTH' })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          validationMessageKey: 'max_length'
        })
      )
    })

    test('should render view with fieldErrors when validation fails for radio', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_REASON)
      const joiError = {
        details: [
          {
            path: ['urgencyReason'],
            message: 'URGENCY_REASON_REQUIRED',
            context: { label: 'urgencyReason' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.URGENCY_REASON
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({
        urgencyReason: 'URGENCY_REASON_REQUIRED'
      })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          fieldErrors: { urgencyReason: 'URGENCY_REASON_REQUIRED' }
        })
      )
      // Should NOT set validationMessageKey for radio fields
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.validationMessageKey).toBeUndefined()
    })

    test('should handle catch block and render view with API error', async () => {
      const error = new Error('Network error')
      saveProjectWithErrorHandling.mockRejectedValue(error)
      extractApiError.mockReturnValue({ message: 'API error' })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error in Goals Urgency Confidence POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })

    test('should fallback to overview when step has no next route in sequence', async () => {
      // Use a step that is not in STEP_SEQUENCE by manipulating getProjectStep
      // to return a step after clearing its sequence entry
      // The fallback is tested by CONFIDENCE_SECURED_PARTNERSHIP_FUNDING -> OVERVIEW
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      )

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should handle missing referenceNumber gracefully', async () => {
      getSessionData.mockReturnValue({})

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      )
    })

    test('should fallback to overview when step is not in STEP_SEQUENCE', async () => {
      // Use a step key that exists in config but not in STEP_SEQUENCE
      const fakeStep = 'unknown-step'
      getProjectStep.mockReturnValue(fakeStep)
      GOALS_URGENCY_CONFIDENCE_CONFIG[fakeStep] = {
        localKeyPrefix: 'projects.project_goals',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH,
        fieldType: 'character-count',
        maxLength: 700
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )

      // Clean up
      delete GOALS_URGENCY_CONFIDENCE_CONFIG[fakeStep]
    })

    test('should return null radioItems for steps without radio config', async () => {
      // PROJECT_GOALS is character-count, so _buildRadioItemsForStep returns null
      // But fieldType is not 'radio', so _buildRadioItemsForStep is not called
      // To test the null return, we need a radio step with no RADIO_CONFIG entry
      const fakeRadioStep = 'fake-radio-step'
      getProjectStep.mockReturnValue(fakeRadioStep)
      GOALS_URGENCY_CONFIDENCE_CONFIG[fakeRadioStep] = {
        localKeyPrefix: 'projects.project_goals',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName: 'fakeField',
        fieldType: 'radio'
      }

      // buildRadioItems is mocked, but _buildRadioItemsForStep checks RADIO_CONFIG
      // which is internal to the controller module. Since RADIO_CONFIG doesn't have
      // fakeRadioStep, it will return null before calling buildRadioItems.
      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      // buildRadioItems should NOT have been called since RADIO_CONFIG has no entry
      expect(buildRadioItems).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()

      // Clean up
      delete GOALS_URGENCY_CONFIDENCE_CONFIG[fakeRadioStep]
    })

    test('should skip validation and proceed when schema is undefined', async () => {
      const noSchemaStep = 'no-schema-step'
      getProjectStep.mockReturnValue(noSchemaStep)
      GOALS_URGENCY_CONFIDENCE_CONFIG[noSchemaStep] = {
        localKeyPrefix: 'projects.project_goals',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: undefined,
        fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH,
        fieldType: 'character-count',
        maxLength: 700
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      // Should skip validation and go straight to save
      expect(saveProjectWithErrorHandling).toHaveBeenCalled()

      // Clean up
      delete GOALS_URGENCY_CONFIDENCE_CONFIG[noSchemaStep]
    })

    test('should handle urgency details MAX_LENGTH validation', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)
      const joiError = {
        details: [
          {
            path: ['urgencyDetails'],
            message: 'URGENCY_DETAILS_MAX_LENGTH',
            context: { label: 'urgencyDetails' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.URGENCY_DETAILS
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({
        urgencyDetails: 'URGENCY_DETAILS_MAX_LENGTH'
      })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          fieldErrors: { urgencyDetails: 'URGENCY_DETAILS_MAX_LENGTH' },
          validationMessageKey: 'max_length'
        })
      )
    })

    test('should render view with fieldErrors when validation fails for radio', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_REASON)
      const joiError = {
        details: [
          {
            path: ['urgencyReason'],
            message: 'URGENCY_REASON_REQUIRED',
            context: { label: 'urgencyReason' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.URGENCY_REASON
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({
        urgencyReason: 'URGENCY_REASON_REQUIRED'
      })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          fieldErrors: { urgencyReason: 'URGENCY_REASON_REQUIRED' }
        })
      )
      // Should NOT set validationMessageKey for radio fields
      const viewData = mockH.view.mock.calls[0][1]
      expect(viewData.validationMessageKey).toBeUndefined()
    })

    test('should handle catch block and render view with API error', async () => {
      const error = new Error('Network error')
      saveProjectWithErrorHandling.mockRejectedValue(error)
      extractApiError.mockReturnValue({ message: 'API error' })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error in Goals Urgency Confidence POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })

    test('should fallback to overview when step has no next route in sequence', async () => {
      // Use a step that is not in STEP_SEQUENCE by manipulating getProjectStep
      // to return a step after clearing its sequence entry
      // The fallback is tested by CONFIDENCE_SECURED_PARTNERSHIP_FUNDING -> OVERVIEW
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
      )

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )
    })

    test('should handle missing referenceNumber gracefully', async () => {
      getSessionData.mockReturnValue({})

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('undefined')
      )
    })

    test('should fallback to overview when step is not in STEP_SEQUENCE', async () => {
      // Use a step key that exists in config but not in STEP_SEQUENCE
      const fakeStep = 'unknown-step'
      getProjectStep.mockReturnValue(fakeStep)
      GOALS_URGENCY_CONFIDENCE_CONFIG[fakeStep] = {
        localKeyPrefix: 'projects.project_goals',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH,
        fieldType: 'character-count',
        maxLength: 700
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'TEST-001')
      )

      // Clean up
      delete GOALS_URGENCY_CONFIDENCE_CONFIG[fakeStep]
    })

    test('should return null radioItems for steps without radio config', async () => {
      // PROJECT_GOALS is character-count, so _buildRadioItemsForStep returns null
      // But fieldType is not 'radio', so _buildRadioItemsForStep is not called
      // To test the null return, we need a radio step with no RADIO_CONFIG entry
      const fakeRadioStep = 'fake-radio-step'
      getProjectStep.mockReturnValue(fakeRadioStep)
      GOALS_URGENCY_CONFIDENCE_CONFIG[fakeRadioStep] = {
        localKeyPrefix: 'projects.project_goals',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName: 'fakeField',
        fieldType: 'radio'
      }

      // buildRadioItems is mocked, but _buildRadioItemsForStep checks RADIO_CONFIG
      // which is internal to the controller module. Since RADIO_CONFIG doesn't have
      // fakeRadioStep, it will return null before calling buildRadioItems.
      await goalsUrgencyConfidenceController.getHandler(mockRequest, mockH)

      // buildRadioItems should NOT have been called since RADIO_CONFIG has no entry
      expect(buildRadioItems).not.toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()

      // Clean up
      delete GOALS_URGENCY_CONFIDENCE_CONFIG[fakeRadioStep]
    })

    test('should skip validation and proceed when schema is undefined', async () => {
      const noSchemaStep = 'no-schema-step'
      getProjectStep.mockReturnValue(noSchemaStep)
      GOALS_URGENCY_CONFIDENCE_CONFIG[noSchemaStep] = {
        localKeyPrefix: 'projects.project_goals',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: undefined,
        fieldName: PROJECT_PAYLOAD_FIELDS.APPROACH,
        fieldType: 'character-count',
        maxLength: 700
      }

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      // Should skip validation and go straight to save
      expect(saveProjectWithErrorHandling).toHaveBeenCalled()

      // Clean up
      delete GOALS_URGENCY_CONFIDENCE_CONFIG[noSchemaStep]
    })

    test('should handle urgency details MAX_LENGTH validation', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)
      const joiError = {
        details: [
          {
            path: ['urgencyDetails'],
            message: 'URGENCY_DETAILS_MAX_LENGTH',
            context: { label: 'urgencyDetails' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.URGENCY_DETAILS
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({
        urgencyDetails: 'URGENCY_DETAILS_MAX_LENGTH'
      })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          fieldErrors: { urgencyDetails: 'URGENCY_DETAILS_MAX_LENGTH' },
          validationMessageKey: 'max_length'
        })
      )
    })

    test('should include dynamic validation context for urgency details required error', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.URGENCY_DETAILS)
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        urgencyReason: 'time_limited'
      })
      mockRequest.t.mockImplementation((key) => {
        if (
          key === 'projects.project_urgency.urgency_detail.time_limited_heading'
        ) {
          return 'What is the specific aspect of the project that has a time limit?'
        }
        return key
      })

      const joiError = {
        details: [
          {
            path: ['urgencyDetails'],
            message: 'URGENCY_DETAILS_REQUIRED',
            context: { label: 'urgencyDetails' }
          }
        ]
      }
      GOALS_URGENCY_CONFIDENCE_CONFIG[
        PROJECT_STEPS.URGENCY_DETAILS
      ].schema.validate.mockReturnValue({ error: joiError })
      extractJoiErrors.mockReturnValue({
        urgencyDetails: 'URGENCY_DETAILS_REQUIRED'
      })

      await goalsUrgencyConfidenceController.postHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE,
        expect.objectContaining({
          fieldErrors: { urgencyDetails: 'URGENCY_DETAILS_REQUIRED' },
          validationMessageKey: 'required',
          validationContext: {
            reason: 'the specific aspect of the project that has a time limit'
          }
        })
      )
    })
  })
})
