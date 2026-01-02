import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getSessionKey,
  getAdminSessionKey,
  getSelfRegistrationSessionKey,
  requireJourneyStarted,
  requireNotAuthenticated,
  buildGroupedAreas
} from './helpers.js'

vi.mock('../../common/helpers/auth/session-manager.js')

const { getAuthSession } =
  await import('../../common/helpers/auth/session-manager.js')

describe('Account Helpers', () => {
  describe('getAdminSessionKey', () => {
    test('returns admin session key', () => {
      const result = getAdminSessionKey()
      expect(result).toBe('adminAccountData')
    })
  })

  describe('getSelfRegistrationSessionKey', () => {
    test('returns self-registration session key', () => {
      const result = getSelfRegistrationSessionKey()
      expect(result).toBe('accountData')
    })
  })

  describe('getSessionKey', () => {
    test('returns admin session key for admin context', () => {
      const result = getSessionKey(true)
      expect(result).toBe('adminAccountData')
    })

    test('returns self-registration session key for regular user', () => {
      const result = getSessionKey(false)
      expect(result).toBe('accountData')
    })
  })

  describe('requireJourneyStarted', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = {
        yar: {
          get: vi.fn()
        }
      }

      mockH = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        continue: Symbol('continue')
      }
    })

    test('allows request when journey is started for regular user', () => {
      mockRequest.yar.get.mockReturnValue({
        journeyStarted: true
      })

      const middleware = requireJourneyStarted(false)
      const result = middleware(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('redirects to start when no session data for regular user', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const middleware = requireJourneyStarted(false)
      middleware(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account')
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('redirects to start when journey not started for regular user', () => {
      mockRequest.yar.get.mockReturnValue({
        someData: 'value'
      })

      const middleware = requireJourneyStarted(false)
      middleware(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account')
    })

    test('redirects to admin start when no session data for admin', () => {
      mockRequest.yar.get.mockReturnValue(null)

      const middleware = requireJourneyStarted(true)
      middleware(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/user-account')
    })

    test('allows request when journey is started for admin', () => {
      mockRequest.yar.get.mockReturnValue({
        journeyStarted: true
      })

      const middleware = requireJourneyStarted(true)
      const result = middleware(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })
  })

  describe('requireNotAuthenticated', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = {}

      mockH = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        continue: Symbol('continue')
      }

      vi.clearAllMocks()
    })

    test('allows request when user is not authenticated', () => {
      getAuthSession.mockReturnValue(null)

      const result = requireNotAuthenticated(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('redirects admin user to admin journey selection', () => {
      getAuthSession.mockReturnValue({
        user: {
          id: 1,
          email: 'admin@example.com',
          admin: true
        }
      })

      requireNotAuthenticated(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/journey-selection')
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('redirects regular user to home', () => {
      getAuthSession.mockReturnValue({
        user: {
          id: 1,
          email: 'user@example.com',
          admin: false
        }
      })

      requireNotAuthenticated(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
      expect(mockH.redirect().takeover).toHaveBeenCalled()
    })

    test('handles session without user gracefully', () => {
      getAuthSession.mockReturnValue({})

      const result = requireNotAuthenticated(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })
  })

  describe('buildGroupedAreas', () => {
    const mockMasterAreas = {
      'EA Area': [
        { id: 1, name: 'EA North', area_type: 'EA', parent_id: null },
        { id: 2, name: 'EA South', area_type: 'EA', parent_id: null }
      ],
      'PSO Area': [
        { id: 10, name: 'PSO North 1', area_type: 'PSO', parent_id: 1 },
        { id: 11, name: 'PSO North 2', area_type: 'PSO', parent_id: 1 },
        { id: 12, name: 'PSO South 1', area_type: 'PSO', parent_id: 2 }
      ],
      RMA: [
        { id: 100, name: 'RMA A', area_type: 'RMA', parent_id: 10 },
        { id: 101, name: 'RMA B', area_type: 'RMA', parent_id: 10 },
        { id: 102, name: 'RMA C', area_type: 'RMA', parent_id: 11 },
        { id: 103, name: 'RMA D', area_type: 'RMA', parent_id: 12 }
      ]
    }

    test('returns null for EA responsibility', () => {
      const sessionData = {}
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'Environment Agency',
        null
      )

      expect(result).toBeNull()
    })

    test('returns null for PSO when no EA areas selected', () => {
      const sessionData = { eaAreas: [] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'PSO',
        null
      )

      expect(result).toBeNull()
    })

    test('groups PSO areas by EA parent', () => {
      const sessionData = { eaAreas: [1, 2] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'PSO',
        null
      )

      expect(result).toHaveLength(2)

      // EA North group
      expect(result[0].parent.id).toBe(1)
      expect(result[0].parent.name).toBe('EA North')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].id).toBe(10)
      expect(result[0].children[1].id).toBe(11)

      // EA South group
      expect(result[1].parent.id).toBe(2)
      expect(result[1].parent.name).toBe('EA South')
      expect(result[1].children).toHaveLength(1)
      expect(result[1].children[0].id).toBe(12)
    })

    test('excludes main area from PSO groups', () => {
      const sessionData = { eaAreas: [1] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'PSO',
        10 // Exclude PSO North 1
      )

      expect(result).toHaveLength(1)
      expect(result[0].parent.id).toBe(1)
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].id).toBe(11) // Only PSO North 2
    })

    test('returns null for RMA when no PSO areas selected', () => {
      const sessionData = { psoAreas: [] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'RMA',
        null
      )

      expect(result).toBeNull()
    })

    test('groups RMA areas by EA > PSO hierarchy', () => {
      const sessionData = { psoAreas: [10, 12] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'RMA',
        null
      )

      expect(result).toHaveLength(2)

      // PSO North 1 group (under EA North)
      expect(result[0].parent.id).toBe(10)
      expect(result[0].parent.name).toBe('PSO North 1')
      expect(result[0].eaParent.id).toBe(1)
      expect(result[0].eaParent.name).toBe('EA North')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].id).toBe(100)
      expect(result[0].children[1].id).toBe(101)

      // PSO South 1 group (under EA South)
      expect(result[1].parent.id).toBe(12)
      expect(result[1].parent.name).toBe('PSO South 1')
      expect(result[1].eaParent.id).toBe(2)
      expect(result[1].eaParent.name).toBe('EA South')
      expect(result[1].children).toHaveLength(1)
      expect(result[1].children[0].id).toBe(103)
    })

    test('excludes main area from RMA groups', () => {
      const sessionData = { psoAreas: [10] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'RMA',
        100 // Exclude RMA A
      )

      expect(result).toHaveLength(1)
      expect(result[0].parent.id).toBe(10)
      expect(result[0].children).toHaveLength(1)
      expect(result[0].children[0].id).toBe(101) // Only RMA B
    })

    test('filters out groups with no children', () => {
      const sessionData = { psoAreas: [11] }
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'RMA',
        102 // Exclude only RMA C (which is the only child of PSO North 2)
      )

      expect(result).toHaveLength(0) // Group filtered out because no children remain
    })

    test('returns null for unknown responsibility type', () => {
      const sessionData = {}
      const result = buildGroupedAreas(
        mockMasterAreas,
        sessionData,
        'Unknown',
        null
      )

      expect(result).toBeNull()
    })
  })
})
