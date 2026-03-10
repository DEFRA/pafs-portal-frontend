import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  environmentalBenefitsController,
  EnvironmentalBenefitsController
} from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { ENVIRONMENTAL_BENEFITS_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import { buildRadioItems } from '../helpers/radio-options.js'

vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-config.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')
vi.mock('../helpers/radio-options.js')

describe('EnvironmentalBenefitsController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: { step: PROJECT_STEPS.ENVIRONMENTAL_BENEFITS },
      pre: {},
      logger: { error: vi.fn() },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn().mockReturnValue({
        code: vi.fn().mockReturnValue(Symbol('view-response'))
      }),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    getSessionData.mockReturnValue({
      slug: 'TEST-001',
      [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: true,
      [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: false,
      [PROJECT_PAYLOAD_FIELDS.WOODLAND]: true,
      [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]: 5.25
    })

    getProjectStep.mockReturnValue(PROJECT_STEPS.ENVIRONMENTAL_BENEFITS)

    ENVIRONMENTAL_BENEFITS_CONFIG[PROJECT_STEPS.ENVIRONMENTAL_BENEFITS] = {
      localKeyPrefix: 'projects.environmental_benefits.environmental_benefits',
      backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS,
      fieldType: 'radio'
    }

    ENVIRONMENTAL_BENEFITS_CONFIG[PROJECT_STEPS.INTERTIDAL_HABITAT] = {
      localKeyPrefix: 'projects.environmental_benefits.intertidal_habitat',
      backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
      fieldType: 'radio'
    }

    ENVIRONMENTAL_BENEFITS_CONFIG[
      PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
    ] = {
      localKeyPrefix:
        'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
      backLinkOptions: {
        targetEditURL: ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT
      },
      schema: {
        validate: vi.fn().mockReturnValue({ error: null })
      },
      fieldName:
        PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
      fieldType: 'number',
      gateField: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Test Page',
      backLink: '/back',
      localKeyPrefix: 'projects.environmental_benefits.environmental_benefits'
    })

    buildRadioItems.mockReturnValue([
      { value: 'yes', text: 'Yes', checked: false },
      { value: 'no', text: 'No', checked: false }
    ])

    saveProjectWithErrorHandling.mockResolvedValue(null)
    navigateToProjectOverview.mockReturnValue(Symbol('overview-redirect'))
  })

  describe('get', () => {
    test('should return view with correct data for main environmental benefits question', async () => {
      const result = await environmentalBenefitsController.getHandler(
        mockRequest,
        mockH
      )

      expect(getProjectStep).toHaveBeenCalledWith(mockRequest)
      expect(getSessionData).toHaveBeenCalledWith(mockRequest)
      expect(buildViewData).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS,
        expect.objectContaining({
          pageTitle: 'Test Page',
          backLink: '/back'
        })
      )
      expect(result).toBe(mockH.view.mock.results[0].value)
    })

    test('should convert boolean true to "yes" for radio display', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: true
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(String),
        null,
        'yes',
        expect.any(Object)
      )
    })

    test('should convert boolean false to "no" for radio display', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: false
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(String),
        null,
        'no',
        expect.any(Object)
      )
    })

    test('should handle null/undefined values for radio fields', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: null
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(String),
        null,
        null,
        expect.any(Object)
      )
    })

    test('should redirect to overview if config not found', async () => {
      getProjectStep.mockReturnValue('INVALID_STEP')
      getSessionData.mockReturnValue({ slug: 'TEST-001' })

      const result = await environmentalBenefitsController.getHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe(navigateToProjectOverview.mock.results[0].value)
    })

    test('should handle quantity field requests', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]: 12.5
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(getSessionData).toHaveBeenCalled()
    })
  })

  describe('post', () => {
    beforeEach(() => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'yes'
      }
    })

    test('should convert "yes" to boolean true before saving', async () => {
      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: true
        })
      )
    })

    test('should convert "no" to boolean false before saving', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'no'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: false
        })
      )
    })

    test('should save number values directly for quantity fields', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          '15.75'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
            '15.75'
        })
      )
    })

    test('should redirect to first gate when main question answered yes', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'yes'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT.replace(
          REFERENCE_NUMBER_PARAM,
          'TEST-001'
        )
      )
    })

    test('should redirect to overview when main question answered no', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'no'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace(REFERENCE_NUMBER_PARAM, 'TEST-001')
      )
    })

    test('should redirect to quantity page when gate question answered yes', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERTIDAL_HABITAT)
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: 'yes'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED.replace(
          REFERENCE_NUMBER_PARAM,
          'TEST-001'
        )
      )
    })

    test('should redirect to next gate when gate question answered no', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERTIDAL_HABITAT)
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: 'no'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.WOODLAND.replace(REFERENCE_NUMBER_PARAM, 'TEST-001')
      )
    })

    test('should redirect to overview when last gate answered no', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE)

      ENVIRONMENTAL_BENEFITS_CONFIG[PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE] =
        {
          localKeyPrefix:
            'projects.environmental_benefits.create_habitat_watercourse',
          backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
          schema: {
            validate: vi.fn().mockReturnValue({ error: null })
          },
          fieldName: PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE,
          fieldType: 'radio'
        }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE]: 'no'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace(REFERENCE_NUMBER_PARAM, 'TEST-001')
      )
    })

    test('should handle validation errors', async () => {
      const mockError = { details: [{ message: 'Validation error' }] }
      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.ENVIRONMENTAL_BENEFITS
      ].schema.validate.mockReturnValue({
        error: mockError
      })
      extractJoiErrors.mockReturnValue({ field1: 'error1' })

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(extractJoiErrors).toHaveBeenCalledWith(mockError)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS,
        expect.objectContaining({
          fieldErrors: { field1: 'error1' }
        })
      )
    })

    test('should handle API errors during save', async () => {
      const apiError = { errorCode: 'API_ERROR' }
      saveProjectWithErrorHandling.mockResolvedValue(apiError)

      const result = await environmentalBenefitsController.postHandler(
        mockRequest,
        mockH
      )

      expect(saveProjectWithErrorHandling).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    test('should redirect to overview if config not found', async () => {
      getProjectStep.mockReturnValue('INVALID_STEP')
      getSessionData.mockReturnValue({ slug: 'TEST-001' })

      const result = await environmentalBenefitsController.postHandler(
        mockRequest,
        mockH
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe(navigateToProjectOverview.mock.results[0].value)
    })
  })

  describe('getHandler and postHandler', () => {
    test('should have getHandler function', async () => {
      expect(typeof environmentalBenefitsController.getHandler).toBe('function')
    })

    test('should have postHandler function', async () => {
      expect(typeof environmentalBenefitsController.postHandler).toBe(
        'function'
      )
    })
  })

  describe('additional coverage tests', () => {
    test('should handle quantity field from last gate navigating to overview', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.kilometres_of_watercourse_enhanced_or_created_single',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE]:
          '25.5'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.OVERVIEW.replace(REFERENCE_NUMBER_PARAM, 'TEST-001')
      )
    })

    test('should handle middle quantity field navigating to next gate', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_woodland_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
          '10.25'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.WET_WOODLAND.replace(
          REFERENCE_NUMBER_PARAM,
          'TEST-001'
        )
      )
    })

    test('should update session data with converted boolean value', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: true
      })

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'no'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: false
        })
      )
    })

    test('should handle empty string values for radio fields', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: ''
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(buildRadioItems).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalled()
    })

    test('should use projectData when available in pre', async () => {
      mockRequest.pre = {
        projectData: {
          slug: 'TEST-002',
          [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: false
        }
      }

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('should normalize input field values to numbers', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          '15.75'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]: 15.75
        })
      )
    })

    test('should handle empty string input values', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          ''
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
            ''
        })
      )
    })

    test('should include footer HTML when translation exists', async () => {
      mockRequest.t.mockImplementation((key) => {
        if (key === 'projects.environmental_benefits.footer.html_text') {
          return '<p>Footer content</p>'
        }
        return key
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS,
        expect.objectContaining({
          footerHtml: '<p>Footer content</p>'
        })
      )
    })

    test('should not include footer HTML when translation does not exist', async () => {
      mockRequest.t.mockImplementation((key) => key)

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      const viewCall = mockH.view.mock.calls[0][1]
      expect(viewCall.footerHtml).toBeUndefined()
    })

    test('should include suffix for input fields when translation exists', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.t.mockImplementation((key) => {
        if (
          key ===
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced.suffix'
        ) {
          return 'hectares'
        }
        return key
      })

      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]: 10
      })

      await environmentalBenefitsController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS,
        expect.objectContaining({
          suffix: 'hectares',
          inputValue: 10
        })
      )
    })

    test('should handle gate field in payload for quantity validation', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input',
        gateField: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT
      }

      mockRequest.pre = {
        projectData: {
          [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: true
        }
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          '12.5'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(
        ENVIRONMENTAL_BENEFITS_CONFIG[
          PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
        ].schema.validate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]: 12.5,
          [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: true
        }),
        expect.any(Object)
      )
    })

    test('should navigate through all gate questions with yes answers', async () => {
      const gateSteps = [
        PROJECT_STEPS.INTERTIDAL_HABITAT,
        PROJECT_STEPS.WOODLAND,
        PROJECT_STEPS.WET_WOODLAND,
        PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND,
        PROJECT_STEPS.GRASSLAND,
        PROJECT_STEPS.HEATHLAND,
        PROJECT_STEPS.PONDS_LAKES,
        PROJECT_STEPS.ARABLE_LAND,
        PROJECT_STEPS.COMPREHENSIVE_RESTORATION,
        PROJECT_STEPS.PARTIAL_RESTORATION
      ]

      for (const gateStep of gateSteps) {
        getProjectStep.mockReturnValue(gateStep)

        const fieldName = `${gateStep.toLowerCase()}`
        ENVIRONMENTAL_BENEFITS_CONFIG[gateStep] = {
          localKeyPrefix: `projects.environmental_benefits.${gateStep.toLowerCase()}`,
          backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
          schema: {
            validate: vi.fn().mockReturnValue({ error: null })
          },
          fieldName,
          fieldType: 'radio'
        }

        mockRequest.payload = { [fieldName]: 'yes' }

        await environmentalBenefitsController.postHandler(mockRequest, mockH)

        expect(mockH.redirect).toHaveBeenCalled()
      }
    })

    test('should navigate to next gate when current gate answered no', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERTIDAL_HABITAT)

      ENVIRONMENTAL_BENEFITS_CONFIG[PROJECT_STEPS.INTERTIDAL_HABITAT] = {
        localKeyPrefix: 'projects.environmental_benefits.intertidal_habitat',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
        fieldType: 'radio'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]: 'no'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.WOODLAND.replace(REFERENCE_NUMBER_PARAM, 'TEST-001')
      )
    })

    test('should handle null input values', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          null
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
            null
        })
      )
    })

    test('should handle radio field with non-yes/no value passthrough', async () => {
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'unknown'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS]: 'unknown'
        })
      )
    })

    test('should convert zero string to number for input fields', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          '0'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]: 0
        })
      )
    })
  })

  describe('_getValidationMessageKey', () => {
    test('should return "required" for QUANTITY_REQUIRED error code', () => {
      const controller = new EnvironmentalBenefitsController()
      const result = controller._getValidationMessageKey(
        'ENVIRONMENTAL_BENEFITS_QUANTITY_REQUIRED'
      )
      expect(result).toBe('required')
    })

    test('should return "invalid" for QUANTITY_INVALID error code', () => {
      const controller = new EnvironmentalBenefitsController()
      const result = controller._getValidationMessageKey(
        'ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID'
      )
      expect(result).toBe('invalid')
    })

    test('should return "min" for QUANTITY_MIN error code', () => {
      const controller = new EnvironmentalBenefitsController()
      const result = controller._getValidationMessageKey(
        'ENVIRONMENTAL_BENEFITS_QUANTITY_MIN'
      )
      expect(result).toBe('min')
    })

    test('should return "precision" for QUANTITY_PRECISION error code', () => {
      const controller = new EnvironmentalBenefitsController()
      const result = controller._getValidationMessageKey(
        'ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION'
      )
      expect(result).toBe('precision')
    })

    test('should return "required" as default for unknown error code', () => {
      const controller = new EnvironmentalBenefitsController()
      const result = controller._getValidationMessageKey('UNKNOWN_ERROR')
      expect(result).toBe('required')
    })

    test('should return "required" for null error code', () => {
      const controller = new EnvironmentalBenefitsController()
      const result = controller._getValidationMessageKey(null)
      expect(result).toBe('required')
    })
  })

  describe('_buildErrorViewData', () => {
    let controller

    beforeEach(() => {
      controller = new EnvironmentalBenefitsController()
    })

    test('should add validationMessageKey for input field with required error', () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      buildViewData.mockReturnValue({
        pageTitle: 'Test Page',
        inputValue: 5.25
      })

      const fieldErrors = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          'ENVIRONMENTAL_BENEFITS_QUANTITY_REQUIRED'
      }

      const result = controller._buildErrorViewData(mockRequest, fieldErrors)

      expect(result.fieldErrors).toEqual(fieldErrors)
      expect(result.validationMessageKey).toBe('required')
    })

    test('should add validationMessageKey for input field with invalid error', () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_woodland_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      const fieldErrors = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
          'ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID'
      }

      const result = controller._buildErrorViewData(mockRequest, fieldErrors)

      expect(result.validationMessageKey).toBe('invalid')
    })

    test('should add validationMessageKey for input field with min error', () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_grassland_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      const fieldErrors = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED]:
          'ENVIRONMENTAL_BENEFITS_QUANTITY_MIN'
      }

      const result = controller._buildErrorViewData(mockRequest, fieldErrors)

      expect(result.validationMessageKey).toBe('min')
    })

    test('should add validationMessageKey for input field with precision error', () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_heathland_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      const fieldErrors = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED]:
          'ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION'
      }

      const result = controller._buildErrorViewData(mockRequest, fieldErrors)

      expect(result.validationMessageKey).toBe('precision')
    })

    test('should not add validationMessageKey for radio field errors', () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERTIDAL_HABITAT)

      ENVIRONMENTAL_BENEFITS_CONFIG[PROJECT_STEPS.INTERTIDAL_HABITAT] = {
        localKeyPrefix: 'projects.environmental_benefits.intertidal_habitat',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        fieldName: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
        fieldType: 'radio'
      }

      const fieldErrors = {
        [PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT]:
          'ENVIRONMENTAL_BENEFITS_REQUIRED'
      }

      const result = controller._buildErrorViewData(mockRequest, fieldErrors)

      expect(result.fieldErrors).toEqual(fieldErrors)
      expect(result.validationMessageKey).toBeUndefined()
    })

    test('should not add validationMessageKey when field has no error', () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      const fieldErrors = {}

      const result = controller._buildErrorViewData(mockRequest, fieldErrors)

      expect(result.fieldErrors).toEqual(fieldErrors)
      expect(result.validationMessageKey).toBeUndefined()
    })
  })

  describe('validation error preserves submitted value', () => {
    test('should update session before validation to preserve input value on error', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi
            .fn()
            .mockReturnValue({ error: { details: [{ message: 'Error' }] } })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          '15.755'
      }

      extractJoiErrors.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          'ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION'
      })

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      // Session should be updated with raw value BEFORE validation
      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
            '15.755'
        })
      )

      // View should be called with error data
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS,
        expect.objectContaining({
          fieldErrors: expect.any(Object),
          validationMessageKey: 'precision'
        })
      )
    })

    test('should preserve string value in session when validation fails (not NaN)', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi
            .fn()
            .mockReturnValue({ error: { details: [{ message: 'Error' }] } })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      // User enters invalid string
      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          'abc'
      }

      extractJoiErrors.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
          'ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID'
      })

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      // Session should preserve the original string value, NOT convert to NaN
      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
            'abc'
        })
      )

      // View should be called with error data
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS,
        expect.objectContaining({
          fieldErrors: expect.any(Object),
          validationMessageKey: 'invalid'
        })
      )
    })

    test('should update session with normalized value after successful validation', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
      )

      ENVIRONMENTAL_BENEFITS_CONFIG[
        PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
      ] = {
        localKeyPrefix:
          'projects.environmental_benefits.hectares_of_woodland_habitat_created_or_enhanced',
        backLinkOptions: { targetURL: ROUTES.PROJECT.OVERVIEW },
        schema: {
          validate: vi.fn().mockReturnValue({ error: null })
        },
        fieldName:
          PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
        fieldType: 'input'
      }

      mockRequest.payload = {
        [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
          '10.25'
      }

      await environmentalBenefitsController.postHandler(mockRequest, mockH)

      // Session should be updated twice - first with raw, then with normalized
      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
            '10.25'
        })
      )

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]: 10.25
        })
      )

      expect(updateSessionData).toHaveBeenCalledTimes(2)
    })
  })
})
