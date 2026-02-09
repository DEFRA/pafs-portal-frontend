import { describe, test, expect, beforeEach, vi } from 'vitest'
import { typeController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { PROJECT_TYPES_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  requiredInterventionTypesForProjectType,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'

// Mock all dependencies
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-config.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')

describe('TypeController', () => {
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
      t: vi.fn((key) => `translated_${key}`)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    // Default mocks
    getSessionData.mockReturnValue({
      projectType: PROJECT_TYPES.DEF,
      projectInterventionTypes: [PROJECT_INTERVENTION_TYPES.NFM]
    })

    getProjectStep.mockReturnValue(PROJECT_STEPS.TYPE)

    PROJECT_TYPES_CONFIG[PROJECT_STEPS.TYPE] = {
      localKeyPrefix: 'projects.type',
      backLinkOptions: { url: '/back' },
      schema: {}
    }

    PROJECT_TYPES_CONFIG[PROJECT_STEPS.INTERVENTION_TYPE] = {
      localKeyPrefix: 'projects.intervention_type',
      backLinkOptions: { url: '/back' },
      schema: {}
    }

    PROJECT_TYPES_CONFIG[PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE] = {
      localKeyPrefix: 'projects.primary_intervention_type',
      backLinkOptions: { url: '/back' },
      schema: {}
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Test Page',
      backLink: '/back'
    })

    validatePayload.mockReturnValue(null)
    saveProjectWithErrorHandling.mockResolvedValue(null)
    requiredInterventionTypesForProjectType.mockReturnValue(true)
  })

  describe('getHandler', () => {
    test('should render TYPE view with project type options', async () => {
      await typeController.getHandler(mockRequest, mockH)

      expect(getProjectStep).toHaveBeenCalledWith(mockRequest)
      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            step: PROJECT_STEPS.TYPE,
            projectTypeOptions: expect.arrayContaining([
              expect.objectContaining({ value: PROJECT_TYPES.DEF }),
              expect.objectContaining({ value: PROJECT_TYPES.REP }),
              expect.objectContaining({ value: PROJECT_TYPES.REF }),
              expect.objectContaining({ value: PROJECT_TYPES.HCR }),
              expect.objectContaining({ value: PROJECT_TYPES.STR }),
              expect.objectContaining({ value: PROJECT_TYPES.STU }),
              expect.objectContaining({ value: PROJECT_TYPES.ELO })
            ])
          })
        })
      )
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.TYPE,
        expect.any(Object)
      )
    })

    test('should include all project type options', async () => {
      await typeController.getHandler(mockRequest, mockH)

      const callArgs = buildViewData.mock.calls[0][1]
      const options = callArgs.additionalData.projectTypeOptions

      expect(options).toHaveLength(7)
      expect(options.map((o) => o.value)).toEqual([
        PROJECT_TYPES.DEF,
        PROJECT_TYPES.REP,
        PROJECT_TYPES.REF,
        PROJECT_TYPES.HCR,
        PROJECT_TYPES.STR,
        PROJECT_TYPES.STU,
        PROJECT_TYPES.ELO
      ])
    })

    test('should render INTERVENTION_TYPE view with intervention type options', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERVENTION_TYPE)

      await typeController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          additionalData: expect.objectContaining({
            step: PROJECT_STEPS.INTERVENTION_TYPE,
            interventionTypeOptions: expect.arrayContaining([
              expect.objectContaining({
                value: PROJECT_INTERVENTION_TYPES.NFM
              }),
              expect.objectContaining({
                value: PROJECT_INTERVENTION_TYPES.SUDS
              })
            ])
          })
        })
      )
    })

    test('should include PFR option for non-REF project types', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERVENTION_TYPE)
      getSessionData.mockReturnValue({
        projectType: PROJECT_TYPES.DEF
      })

      await typeController.getHandler(mockRequest, mockH)

      const callArgs = buildViewData.mock.calls[0][1]
      const options = callArgs.additionalData.interventionTypeOptions

      expect(options.map((o) => o.value)).toContain(
        PROJECT_INTERVENTION_TYPES.PFR
      )
    })

    test('should exclude PFR option for REF project type', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERVENTION_TYPE)
      getSessionData.mockReturnValue({
        projectType: PROJECT_TYPES.REF
      })

      await typeController.getHandler(mockRequest, mockH)

      const callArgs = buildViewData.mock.calls[0][1]
      const options = callArgs.additionalData.interventionTypeOptions

      expect(options.map((o) => o.value)).not.toContain(
        PROJECT_INTERVENTION_TYPES.PFR
      )
    })

    test('should render PRIMARY_INTERVENTION_TYPE view with selected types only', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE)
      getSessionData.mockReturnValue({
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ]
      })

      await typeController.getHandler(mockRequest, mockH)

      const callArgs = buildViewData.mock.calls[0][1]
      const options = callArgs.additionalData.mainInterventionTypeOptions

      expect(options).toHaveLength(2)
      expect(options.map((o) => o.value)).toEqual([
        PROJECT_INTERVENTION_TYPES.NFM,
        PROJECT_INTERVENTION_TYPES.SUDS
      ])
    })
  })

  describe('postHandler - TYPE step', () => {
    beforeEach(() => {
      mockRequest.payload = { projectType: PROJECT_TYPES.DEF }
    })

    test('should update session data with payload', async () => {
      await typeController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({ projectType: PROJECT_TYPES.DEF })
      )
    })

    test('should return validation error if validation fails', async () => {
      const validationError = { error: 'validation failed' }
      validatePayload.mockReturnValue(validationError)

      const result = await typeController.postHandler(mockRequest, mockH)

      expect(result).toBe(validationError)
      expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
    })

    test('should redirect to INTERVENTION_TYPE in create mode when intervention types required', async () => {
      requiredInterventionTypesForProjectType.mockReturnValue(true)

      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.INTERVENTION_TYPE
      )
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should redirect to FINANCIAL_START_YEAR in create mode when intervention types not required', async () => {
      requiredInterventionTypesForProjectType.mockReturnValue(false)
      mockRequest.payload = { projectType: PROJECT_TYPES.STU }

      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_START_YEAR
      )
    })

    test('should clear intervention type fields when not required', async () => {
      requiredInterventionTypesForProjectType.mockReturnValue(false)
      mockRequest.payload = {
        projectType: PROJECT_TYPES.STU,
        projectInterventionTypes: ['NFM'],
        mainInterventionType: 'NFM'
      }

      await typeController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          projectInterventionTypes: [],
          mainInterventionType: ''
        })
      )
    })

    test('should submit and navigate to overview in edit mode when intervention types not required', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: PROJECT_TYPES.STU
      })
      requiredInterventionTypesForProjectType.mockReturnValue(false)
      const overviewRedirect = { type: 'redirect', url: '/overview' }
      navigateToProjectOverview.mockReturnValue(overviewRedirect)

      const result = await typeController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        expect.any(Object),
        PROJECT_VIEWS.TYPE
      )
      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toBe(overviewRedirect)
    })

    test('should redirect to EDIT.INTERVENTION_TYPE in edit mode when intervention types required', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: PROJECT_TYPES.DEF
      })
      requiredInterventionTypesForProjectType.mockReturnValue(true)

      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.INTERVENTION_TYPE.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })
  })

  describe('postHandler - INTERVENTION_TYPE step', () => {
    beforeEach(() => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.INTERVENTION_TYPE)
      mockRequest.payload = {
        projectInterventionTypes: [PROJECT_INTERVENTION_TYPES.NFM]
      }
    })

    test('should normalize single intervention type to array', async () => {
      mockRequest.payload = {
        projectInterventionTypes: PROJECT_INTERVENTION_TYPES.NFM
      }

      await typeController.postHandler(mockRequest, mockH)

      expect(mockRequest.payload.projectInterventionTypes).toEqual([
        PROJECT_INTERVENTION_TYPES.NFM
      ])
    })

    test('should redirect to FINANCIAL_START_YEAR when only 1 intervention type in create mode', async () => {
      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_START_YEAR
      )
    })

    test('should auto-select main intervention type when only 1 intervention type', async () => {
      getSessionData.mockReturnValue({
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [PROJECT_INTERVENTION_TYPES.NFM],
        mainInterventionType: PROJECT_INTERVENTION_TYPES.NFM
      })

      await typeController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          mainInterventionType: PROJECT_INTERVENTION_TYPES.NFM
        })
      )
    })

    test('should redirect to PRIMARY_INTERVENTION_TYPE when multiple intervention types in create mode', async () => {
      mockRequest.payload = {
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ]
      }
      getSessionData.mockReturnValue({
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ]
      })

      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE
      )
    })

    test('should submit and navigate to overview when only 1 intervention type in edit mode', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [PROJECT_INTERVENTION_TYPES.NFM],
        mainInterventionType: PROJECT_INTERVENTION_TYPES.NFM
      })
      const overviewRedirect = { type: 'redirect', url: '/overview' }
      navigateToProjectOverview.mockReturnValue(overviewRedirect)

      const result = await typeController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        expect.any(Object),
        PROJECT_VIEWS.TYPE
      )
      expect(result).toBe(overviewRedirect)
    })

    test('should redirect to EDIT.PRIMARY_INTERVENTION_TYPE when multiple intervention types in edit mode', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      mockRequest.payload = {
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ]
      }
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ]
      })

      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.EDIT.PRIMARY_INTERVENTION_TYPE.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })
  })

  describe('postHandler - PRIMARY_INTERVENTION_TYPE step', () => {
    beforeEach(() => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE)
      mockRequest.payload = {
        mainInterventionType: PROJECT_INTERVENTION_TYPES.NFM
      }
      getSessionData.mockReturnValue({
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ],
        mainInterventionType: PROJECT_INTERVENTION_TYPES.NFM
      })
    })

    test('should redirect to FINANCIAL_START_YEAR in create mode', async () => {
      await typeController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        ROUTES.PROJECT.FINANCIAL_START_YEAR
      )
    })

    test('should submit and navigate to overview in edit mode', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: PROJECT_TYPES.DEF,
        projectInterventionTypes: [
          PROJECT_INTERVENTION_TYPES.NFM,
          PROJECT_INTERVENTION_TYPES.SUDS
        ],
        mainInterventionType: PROJECT_INTERVENTION_TYPES.NFM
      })
      const overviewRedirect = { type: 'redirect', url: '/overview' }
      navigateToProjectOverview.mockReturnValue(overviewRedirect)

      const result = await typeController.postHandler(mockRequest, mockH)

      expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE,
        expect.any(Object),
        PROJECT_VIEWS.TYPE
      )
      expect(result).toBe(overviewRedirect)
    })
  })

  describe('postHandler - error handling', () => {
    test('should return error response if saveProjectWithErrorHandling fails', async () => {
      mockRequest.params.referenceNumber = 'TEST-001'
      getSessionData.mockReturnValue({
        slug: 'TEST-001',
        projectType: PROJECT_TYPES.STU
      })
      requiredInterventionTypesForProjectType.mockReturnValue(false)

      const errorResponse = { error: 'save failed' }
      saveProjectWithErrorHandling.mockResolvedValue(errorResponse)

      const result = await typeController.postHandler(mockRequest, mockH)

      expect(result).toBe(errorResponse)
    })

    test('should handle errors and render view with error message', async () => {
      const error = new Error('Test error')
      validatePayload.mockImplementation(() => {
        throw error
      })
      extractApiError.mockReturnValue({ message: 'API error' })

      await typeController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error project type POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.TYPE,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })
  })
})
