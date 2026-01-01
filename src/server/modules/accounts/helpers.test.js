import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  getSessionKey,
  requireJourneyStarted,
  requireNotAuthenticated
} from './helpers.js'

vi.mock('../../common/helpers/auth/session-manager.js')

const { getAuthSession } =
  await import('../../common/helpers/auth/session-manager.js')

describe('Account Helpers', () => {
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
})
