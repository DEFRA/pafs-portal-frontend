import { describe, test, expect, beforeEach, vi } from 'vitest'
import { handleConditionalRedirect } from './redirect-helpers.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS,
  NFM_LAND_TYPES
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { navigateToProjectOverview } from '../../helpers/project-utils.js'

vi.mock('../../helpers/project-utils.js', () => ({
  navigateToProjectOverview: vi.fn(() => ({
    redirected: true,
    path: '/overview'
  }))
}))

describe('NFM Redirect Helpers', () => {
  const mockRequest = {}
  const mockH = {
    redirect: (path) => ({
      takeover: () => ({ redirected: true, path })
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleConditionalRedirect - NFM_RIVER_RESTORATION', () => {
    test('should redirect to leaky barriers when selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration,leaky_barriers'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_RIVER_RESTORATION,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toContain('leaky-barriers')
      expect(result.path).toContain('TEST-001')
    })

    test('should redirect to land use change when leaky barriers not selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_RIVER_RESTORATION,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })

    test('should redirect to land use change when no measures selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: ''
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_RIVER_RESTORATION,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })

    test('should redirect to land use change when selected measures is undefined', async () => {
      const sessionData = {}

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_RIVER_RESTORATION,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })
  })

  describe('handleConditionalRedirect - NFM_LEAKY_BARRIERS', () => {
    test('should redirect to land use change after leaky barriers', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration,leaky_barriers'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_LEAKY_BARRIERS,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })
  })

  describe('handleConditionalRedirect - NFM_SELECTED_MEASURES', () => {
    test('should redirect to first selected measure (river restoration)', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_SELECTED_MEASURES,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toEqual({
        redirected: true,
        path: '/project/TEST-001/nfm-river-restoration'
      })
    })
  })

  describe('handleConditionalRedirect - NFM_RUNOFF_MANAGEMENT', () => {
    test('should redirect to saltmarsh when selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'leaky_barriers,runoff_management,saltmarsh_management'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toContain('saltmarsh')
      expect(result.path).toContain('TEST-001')
    })

    test('should redirect to land use change when saltmarsh not selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'leaky_barriers,runoff_management'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })
  })

  describe('handleConditionalRedirect - NFM_SALTMARSH', () => {
    test('should redirect to sand dune when selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'saltmarsh_management,sand_dune_management'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_SALTMARSH,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toContain('sand-dune')
      expect(result.path).toContain('TEST-001')
    })

    test('should redirect to land use change when sand dune not selected', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'saltmarsh_management'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_SALTMARSH,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })
  })

  describe('handleConditionalRedirect - NFM_SAND_DUNE', () => {
    test('should redirect to land use change after sand dune', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'saltmarsh_management,sand_dune_management'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_SAND_DUNE,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBeDefined()
      expect(result.redirected).toBe(true)
      expect(result.path).toBe('/project/TEST-001/nfm-land-use-change')
    })
  })

  describe('handleConditionalRedirect - Unknown step', () => {
    test('should return null for unknown step', async () => {
      const sessionData = {}

      const result = await handleConditionalRedirect(
        'UNKNOWN_STEP',
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toBe(null)
    })
  })

  describe('handleConditionalRedirect - additional branch coverage', () => {
    test('should handle selected measures provided as array', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: [
          'river_floodplain_restoration',
          'offline_storage'
        ]
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_SELECTED_MEASURES,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result).toEqual({
        redirected: true,
        path: '/project/TEST-001/nfm-river-restoration'
      })
    })

    test('should redirect to first selected land type after land-use-change step', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]:
          'woodland,enclosed_livestock_farmland'
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_LAND_USE_CHANGE,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result.path).toBe(
        ROUTES.PROJECT.EDIT.NFM.LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should navigate to overview when no land types selected on land-use-change', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: ''
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_LAND_USE_CHANGE,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toEqual({ redirected: true, path: '/overview' })
    })

    test('should redirect from land-use detail step to next selected land type', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: [
          NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND,
          NFM_LAND_TYPES.WOODLAND
        ]
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(result.path).toBe(
        ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      )
    })

    test('should navigate to overview from last selected land-use detail step', async () => {
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: [NFM_LAND_TYPES.WOODLAND]
      }

      const result = await handleConditionalRedirect(
        PROJECT_STEPS.NFM_LAND_USE_WOODLAND,
        mockRequest,
        mockH,
        sessionData,
        'TEST-001'
      )

      expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', mockH)
      expect(result).toEqual({ redirected: true, path: '/overview' })
    })
  })
})
