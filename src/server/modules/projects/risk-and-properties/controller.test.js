import { describe, test, expect, beforeEach, vi } from 'vitest'
import { riskAndPropertiesController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { RISK_AND_PROPERTIES_CONFIG } from '../helpers/project-config.js'
import {
  saveProjectWithErrorHandling,
  submitProject
} from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'

// Mock all dependencies
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-config.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')

describe('RiskAndPropertiesController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: { referenceNumber: 'TEST-001A-002A' },
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

    // Mock session data object that can be updated
    const sessionDataMock = {
      slug: 'TEST-001A-002A',
      risks: [PROJECT_RISK_TYPES.FLUVIAL],
      mainRisk: PROJECT_RISK_TYPES.FLUVIAL
    }

    // Default mocks
    getSessionData.mockReturnValue(sessionDataMock)

    // Mock updateSessionData to actually update the session mock
    updateSessionData.mockImplementation((request, updates) => {
      Object.assign(sessionDataMock, updates)
    })

    getProjectStep.mockReturnValue(PROJECT_STEPS.RISK)

    RISK_AND_PROPERTIES_CONFIG[PROJECT_STEPS.RISK] = {
      localKeyPrefix: 'projects.risk_and_properties.risk',
      backLinkOptions: { url: '/overview' },
      schema: {},
      fieldType: 'checkbox'
    }

    RISK_AND_PROPERTIES_CONFIG[PROJECT_STEPS.MAIN_RISK] = {
      localKeyPrefix: 'projects.risk_and_properties.main_risk',
      backLinkOptions: { url: '/risk' },
      schema: {},
      fieldType: 'radio'
    }

    RISK_AND_PROPERTIES_CONFIG[PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING] = {
      localKeyPrefix: 'projects.risk_and_properties.property_affected_flooding',
      backLinkOptions: { url: '/main-risk' },
      schema: {},
      fieldType: 'table'
    }

    RISK_AND_PROPERTIES_CONFIG[
      PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION
    ] = {
      localKeyPrefix:
        'projects.risk_and_properties.property_affected_coastal_erosion',
      backLinkOptions: { url: '/property-affected-flooding' },
      schema: {},
      fieldType: 'table'
    }

    buildViewData.mockImplementation((request, options) => {
      // Merge additionalData like the real buildViewData does
      return {
        pageTitle: 'Test Page',
        backLink: '/back',
        ...options.additionalData
      }
    })

    validatePayload.mockReturnValue(null)
    saveProjectWithErrorHandling.mockResolvedValue(null)
    navigateToProjectOverview.mockReturnValue(Symbol('navigate'))
    submitProject.mockResolvedValue({ success: true })
  })

  describe('getHandler', () => {
    test('should render RISK step with risk options', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.RISK)

      await riskAndPropertiesController.getHandler(mockRequest, mockH)

      expect(getProjectStep).toHaveBeenCalledWith(mockRequest)
      expect(buildViewData).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.RISK_AND_PROPERTIES,
        expect.objectContaining({
          step: PROJECT_STEPS.RISK,
          riskOptions: expect.arrayContaining([
            expect.objectContaining({ value: PROJECT_RISK_TYPES.FLUVIAL }),
            expect.objectContaining({
              value: PROJECT_RISK_TYPES.COASTAL_EROSION
            })
          ])
        })
      )
    })

    test('should render MAIN_RISK step with main risk options from session', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.MAIN_RISK)
      getSessionData.mockReturnValue({
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.TIDAL]
      })

      await riskAndPropertiesController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.RISK_AND_PROPERTIES,
        expect.objectContaining({
          step: PROJECT_STEPS.MAIN_RISK,
          mainRiskOptions: expect.arrayContaining([
            expect.objectContaining({ value: PROJECT_RISK_TYPES.FLUVIAL }),
            expect.objectContaining({ value: PROJECT_RISK_TYPES.TIDAL })
          ])
        })
      )
    })

    test('should handle comma-separated string in main risk options', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.MAIN_RISK)
      getSessionData.mockReturnValue({
        risks: 'fluvial_flooding,tidal_flooding'
      })

      await riskAndPropertiesController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.RISK_AND_PROPERTIES,
        expect.objectContaining({
          mainRiskOptions: expect.arrayContaining([
            expect.objectContaining({ value: 'fluvial_flooding' }),
            expect.objectContaining({ value: 'tidal_flooding' })
          ])
        })
      )
    })
  })

  describe('postHandler - RISK step', () => {
    beforeEach(() => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.RISK)
    })

    test('should normalize single risk to array', async () => {
      mockRequest.payload = {
        risks: PROJECT_RISK_TYPES.FLUVIAL
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          risks: [PROJECT_RISK_TYPES.FLUVIAL]
        })
      )
    })

    test('should normalize comma-separated string to array', async () => {
      mockRequest.payload = {
        risks: 'fluvial_flooding,tidal_flooding'
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          risks: ['fluvial_flooding', 'tidal_flooding']
        })
      )
    })

    test('should clear coastal erosion fields when coastal erosion is deselected', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION],
        noPropertiesAtCoastalErosionRisk: true
      })

      mockRequest.payload = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL]
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          noPropertiesAtCoastalErosionRisk: null,
          propertiesBenefitMaintainingAssetsCoastal: null,
          propertiesBenefitInvestmentCoastalErosion: null
        })
      )
    })

    test('should clear flooding fields when only coastal erosion is selected', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        noPropertiesAtRisk: false,
        maintainingExistingAssets: 10
      })

      mockRequest.payload = {
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION]
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          noPropertiesAtRisk: null,
          maintainingExistingAssets: null,
          reducingFloodRisk50Plus: null,
          reducingFloodRiskLess50: null,
          increasingFloodResilience: null
        })
      )
    })

    test('should auto-save main risk and navigate to coastal erosion when only coastal erosion selected', async () => {
      mockRequest.payload = {
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION]
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(submitProject).toHaveBeenCalledWith(
        mockRequest,
        PROJECT_PAYLOAD_LEVELS.MAIN_RISK
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('property-affected-coastal-erosion')
      )
    })

    test('should navigate to main risk when multiple risks selected', async () => {
      mockRequest.payload = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.TIDAL]
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('main-risk')
      )
    })
  })

  describe('postHandler - MAIN_RISK step', () => {
    beforeEach(() => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.MAIN_RISK)
    })

    test('should navigate to flooding properties when main risk is not coastal erosion', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.TIDAL]
      })

      mockRequest.payload = {
        mainRisk: PROJECT_RISK_TYPES.FLUVIAL
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('property-affected-flooding')
      )
    })

    test('should navigate to flooding page when main risk is coastal erosion but multiple risks selected', async () => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.MAIN_RISK)

      const sessionData = {
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.COASTAL_EROSION]
      }
      getSessionData.mockReturnValue(sessionData)
      updateSessionData.mockImplementation((request, updates) => {
        Object.assign(sessionData, updates)
      })

      mockRequest.payload = {
        mainRisk: PROJECT_RISK_TYPES.COASTAL_EROSION
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('property-affected-flooding')
      )
    })

    test('should navigate to overview when main risk is coastal erosion but not in risks', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.FLUVIAL]
      })

      mockRequest.payload = {
        mainRisk: PROJECT_RISK_TYPES.FLUVIAL
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })
  })

  describe('postHandler - PROPERTY_AFFECTED_FLOODING step', () => {
    beforeEach(() => {
      getProjectStep.mockReturnValue(PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING)
    })

    test('should normalize checkbox to boolean when checked', async () => {
      mockRequest.payload = {
        noPropertiesAtRisk: 'on'
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          noPropertiesAtRisk: true,
          maintainingExistingAssets: null,
          reducingFloodRisk50Plus: null,
          reducingFloodRiskLess50: null,
          increasingFloodResilience: null
        })
      )
    })

    test('should set checkbox to false when unchecked', async () => {
      mockRequest.payload = {
        maintainingExistingAssets: 10
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          noPropertiesAtRisk: false
        })
      )
    })

    test('should navigate to coastal erosion page when coastal erosion in risks', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.COASTAL_EROSION]
      })

      mockRequest.payload = {
        noPropertiesAtRisk: false,
        maintainingExistingAssets: 10
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('property-affected-coastal-erosion')
      )
    })

    test('should navigate to overview when no coastal erosion in risks', async () => {
      getSessionData.mockReturnValue({
        slug: 'TEST-001A-002A',
        risks: [PROJECT_RISK_TYPES.FLUVIAL]
      })

      mockRequest.payload = {
        noPropertiesAtRisk: false,
        maintainingExistingAssets: 10
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        expect.stringContaining('twenty-percent-deprived')
      )
    })
  })

  describe('postHandler - PROPERTY_AFFECTED_COASTAL_EROSION step', () => {
    beforeEach(() => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION
      )
    })

    test('should normalize checkbox to boolean when checked', async () => {
      mockRequest.payload = {
        noPropertiesAtCoastalErosionRisk: 'on'
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          noPropertiesAtCoastalErosionRisk: true,
          propertiesBenefitMaintainingAssetsCoastal: null,
          propertiesBenefitInvestmentCoastalErosion: null
        })
      )
    })

    test('should set checkbox to false when unchecked', async () => {
      mockRequest.payload = {
        propertiesBenefitMaintainingAssetsCoastal: 5
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          noPropertiesAtCoastalErosionRisk: false
        })
      )
    })

    test('should navigate to overview after coastal erosion page', async () => {
      getProjectStep.mockReturnValue(
        PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION
      )
      mockRequest.payload = {
        noPropertiesAtCoastalErosionRisk: false,
        propertiesBenefitMaintainingAssetsCoastal: 5,
        propertiesBenefitInvestmentCoastalErosion: 3
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      // PROPERTY_AFFECTED_COASTAL_EROSION is the last step, so it navigates to overview via redirect
      expect(mockH.redirect).toHaveBeenCalled()
    })
  })

  describe('Error handling', () => {
    test('should return validation error if validation fails', async () => {
      const validationError = Symbol('validation-error')
      validatePayload.mockReturnValue(validationError)

      mockRequest.payload = {
        risks: []
      }

      const result = await riskAndPropertiesController.postHandler(
        mockRequest,
        mockH
      )

      expect(result).toBe(validationError)
    })

    test('should handle submission errors', async () => {
      const error = new Error('Submission failed')
      saveProjectWithErrorHandling.mockRejectedValue(error)
      extractApiError.mockReturnValue({ message: 'API Error' })

      mockRequest.payload = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL]
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error risk and properties POST',
        error
      )
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.RISK_AND_PROPERTIES,
        expect.objectContaining({
          error: { message: 'API Error' }
        })
      )
    })

    test('should log error but continue when auto-save main risk fails', async () => {
      submitProject.mockResolvedValue({
        success: false,
        error: new Error('Save failed')
      })

      mockRequest.payload = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL]
      }

      await riskAndPropertiesController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Failed to save main risk',
        expect.any(Error)
      )
      expect(mockH.redirect).toHaveBeenCalled() // Should still redirect
    })
  })
})
