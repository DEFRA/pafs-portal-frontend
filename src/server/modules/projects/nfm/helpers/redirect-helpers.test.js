import { describe, test, expect } from 'vitest'
import { handleConditionalRedirect } from './redirect-helpers.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'

describe('NFM Redirect Helpers', () => {
  const mockRequest = {}
  const mockH = {
    redirect: (path) => ({
      takeover: () => ({ redirected: true, path })
    })
  }

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

    test('should redirect to overview when leaky barriers not selected', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
    })

    test('should redirect to overview when no measures selected', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
    })

    test('should redirect to overview when selected measures is undefined', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
    })
  })

  describe('handleConditionalRedirect - NFM_LEAKY_BARRIERS', () => {
    test('should redirect to overview after leaky barriers', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
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

    test('should redirect to overview when saltmarsh not selected', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
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

    test('should redirect to overview when sand dune not selected', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
    })
  })

  describe('handleConditionalRedirect - NFM_SAND_DUNE', () => {
    test('should redirect to project overview after sand dune', async () => {
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
      expect(result.path).toBe('/project/TEST-001')
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
})
