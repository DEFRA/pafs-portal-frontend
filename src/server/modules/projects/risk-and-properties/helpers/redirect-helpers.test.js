import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  handleRiskStepRedirect,
  handleMainRiskStepRedirect,
  handlePropertyAffectedFloodingRedirect,
  handleConditionalRedirect
} from './redirect-helpers.js'
import {
  PROJECT_RISK_TYPES,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'

// Mock dependencies
vi.mock('../../helpers/project-utils.js', () => ({
  updateSessionData: vi.fn(async (_request, data) => data)
}))

vi.mock('../../helpers/project-submission.js', () => ({
  submitProject: vi.fn(async () => ({ success: true }))
}))

const { updateSessionData } = await import('../../helpers/project-utils.js')
const { submitProject } = await import('../../helpers/project-submission.js')

// Test constants
const TEST_REFERENCE_NUMBER = 'TEST123'
const ROUTE_PROPERTY_AFFECTED_FLOODING = 'property-affected-flooding'
const ROUTE_PROPERTY_AFFECTED_COASTAL_EROSION =
  'property-affected-coastal-erosion'

describe('redirect-helpers', () => {
  const createMockH = () => {
    const redirectMock = {
      redirectTo: '',
      takeover: vi.fn(function () {
        return this
      })
    }
    return {
      redirect: vi.fn((url) => {
        redirectMock.redirectTo = url
        return redirectMock
      })
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleRiskStepRedirect', () => {
    it('should auto-select main risk and redirect when only one risk selected', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: TEST_REFERENCE_NUMBER
      }

      const result = await handleRiskStepRedirect(
        mockRequest,
        mockH,
        sessionData,
        TEST_REFERENCE_NUMBER
      )

      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
      expect(result.redirectTo).toContain(TEST_REFERENCE_NUMBER)
      expect(updateSessionData).toHaveBeenCalled()
      expect(submitProject).toHaveBeenCalled()
    })

    it('should auto-select coastal erosion and skip to coastal erosion page', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION],
        referenceNumber: TEST_REFERENCE_NUMBER
      }

      const result = await handleRiskStepRedirect(
        mockRequest,
        mockH,
        sessionData,
        TEST_REFERENCE_NUMBER
      )

      expect(result.redirectTo).toContain(
        ROUTE_PROPERTY_AFFECTED_COASTAL_EROSION
      )
      expect(result.redirectTo).toContain(TEST_REFERENCE_NUMBER)
      expect(updateSessionData).toHaveBeenCalled()
      expect(submitProject).toHaveBeenCalled()
    })

    it(`should redirect to ${ROUTE_PROPERTY_AFFECTED_FLOODING} when single groundwater risk`, async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.GROUNDWATER],
        referenceNumber: TEST_REFERENCE_NUMBER
      }

      submitProject.mockResolvedValueOnce({ success: true })

      const result = await handleRiskStepRedirect(
        mockRequest,
        mockH,
        sessionData,
        TEST_REFERENCE_NUMBER
      )

      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
      expect(result.redirectTo).toContain(TEST_REFERENCE_NUMBER)
    })

    it('should handle submit failure', async () => {
      const mockH = createMockH()
      const mockRequest = {
        logger: {
          error: vi.fn()
        }
      }
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      // Mock submitProject to fail
      submitProject.mockResolvedValueOnce({
        success: false,
        error: 'Test error'
      })

      const result = await handleRiskStepRedirect(
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Failed to save main risk',
        'Test error'
      )
      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
    })

    it('should navigate to main risk step when multiple risks selected', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.TIDAL],
        referenceNumber: TEST_REFERENCE_NUMBER
      }

      const result = await handleRiskStepRedirect(
        mockRequest,
        mockH,
        sessionData,
        TEST_REFERENCE_NUMBER
      )

      expect(result.redirectTo).toContain('main-risk')
      expect(result.redirectTo).toContain(TEST_REFERENCE_NUMBER)
      expect(updateSessionData).not.toHaveBeenCalled()
      expect(submitProject).not.toHaveBeenCalled()
    })
  })

  describe('handleMainRiskStepRedirect', () => {
    it(`should redirect to ${ROUTE_PROPERTY_AFFECTED_FLOODING} when main risk is not coastal erosion`, () => {
      const mockH = createMockH()
      const sessionData = {
        mainRisk: PROJECT_RISK_TYPES.FLUVIAL,
        risks: [],
        referenceNumber: 'TEST123'
      }

      const result = handleMainRiskStepRedirect(mockH, sessionData, 'TEST123')

      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
      expect(result.redirectTo).toContain('TEST123')
    })

    it(`should skip to ${ROUTE_PROPERTY_AFFECTED_COASTAL_EROSION} when main risk is coastal erosion and only risk`, () => {
      const mockH = createMockH()
      const sessionData = {
        mainRisk: PROJECT_RISK_TYPES.COASTAL_EROSION,
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION],
        referenceNumber: 'TEST123'
      }

      const result = handleMainRiskStepRedirect(mockH, sessionData, 'TEST123')

      expect(result.redirectTo).toContain(
        ROUTE_PROPERTY_AFFECTED_COASTAL_EROSION
      )
      expect(result.redirectTo).toContain('TEST123')
    })

    it(`should go to ${ROUTE_PROPERTY_AFFECTED_FLOODING} when coastal erosion with other risks`, () => {
      const mockH = createMockH()
      const sessionData = {
        mainRisk: PROJECT_RISK_TYPES.COASTAL_EROSION,
        risks: [PROJECT_RISK_TYPES.COASTAL_EROSION, PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = handleMainRiskStepRedirect(mockH, sessionData, 'TEST123')

      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
      expect(result.redirectTo).toContain('TEST123')
    })
  })

  describe('handlePropertyAffectedFloodingRedirect', () => {
    it('should redirect to property-affected-coastal-erosion when coastal erosion in risks', () => {
      const mockH = createMockH()
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.COASTAL_EROSION],
        referenceNumber: 'TEST123'
      }

      const result = handlePropertyAffectedFloodingRedirect(
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result.redirectTo).toContain(
        ROUTE_PROPERTY_AFFECTED_COASTAL_EROSION
      )
      expect(result.redirectTo).toContain('TEST123')
    })

    it('should redirect to twenty-percent-deprived when no coastal erosion', () => {
      const mockH = createMockH()
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = handlePropertyAffectedFloodingRedirect(
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result.redirectTo).toContain('twenty-percent-deprived')
      expect(result.redirectTo).toContain('TEST123')
    })
  })

  describe('handleConditionalRedirect', () => {
    it('should handle RISK step and delegate to handleRiskStepRedirect', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.RISK,
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
    })

    it('should handle MAIN_RISK step', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        mainRisk: PROJECT_RISK_TYPES.TIDAL,
        risks: [],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.MAIN_RISK,
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result).not.toBeNull()
      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_FLOODING)
    })

    it('should handle PROPERTY_AFFECTED_FLOODING step', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL, PROJECT_RISK_TYPES.COASTAL_EROSION],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING,
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result).not.toBeNull()
      expect(result.redirectTo).toContain(ROUTE_PROPERTY_AFFECTED_COASTAL_EROSION)
    })

    it('should handle FORTY_PERCENT_DEPRIVED step with fluvial risk', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.FORTY_PERCENT_DEPRIVED,
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result).not.toBeNull()
      expect(result.redirectTo).toContain('current-flood-risk')
    })

    it('should handle CURRENT_FLOOD_RISK step', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.CURRENT_FLOOD_RISK,
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result).not.toBeNull()
      expect(result.redirectTo).toContain('/project/TEST123')
    })

    it('should handle CURRENT_FLOOD_SURFACE_WATER_RISK step', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.CURRENT_FLOOD_SURFACE_WATER_RISK,
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result).not.toBeNull()
      expect(result.redirectTo).toContain('/project/TEST123')
    })

    it('should return null for unknown step', async () => {
      const mockH = createMockH()
      const mockRequest = {}
      const sessionData = {
        risks: [PROJECT_RISK_TYPES.FLUVIAL],
        referenceNumber: 'TEST123'
      }

      const result = await handleConditionalRedirect(
        'UNKNOWN_STEP',
        mockRequest,
        mockH,
        sessionData,
        'TEST123'
      )

      expect(result).toBeNull()
    })
  })
})
