import { describe, test, expect, beforeEach, vi } from 'vitest'
import { requireAuth, requireAdmin, redirectIfAuth } from './auth-middleware.js'

vi.mock('./session-manager.js')

const {
  getAuthSession,
  isSessionExpired,
  shouldRefreshToken,
  refreshAuthSession,
  updateActivity,
  clearAuthSession
} = await import('./session-manager.js')

describe('Auth Middleware', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {}
    mockH = {
      redirect: vi.fn((url) => ({
        redirect: url,
        takeover: vi.fn(function () {
          return this
        })
      })),
      continue: Symbol('continue')
    }
    vi.clearAllMocks()
  })

  describe('requireAuth', () => {
    test('redirects to login if no session', async () => {
      getAuthSession.mockReturnValue(null)

      const result = await requireAuth(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
      expect(result.takeover).toHaveBeenCalled()
    })

    test('redirects if session expired', async () => {
      getAuthSession.mockReturnValue({ user: { id: 1 } })
      isSessionExpired.mockReturnValue(true)

      await requireAuth(mockRequest, mockH)

      expect(clearAuthSession).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/login?error=session-timeout'
      )
    })

    test('refreshes token if needed', async () => {
      const session = { user: { id: 1 } }
      getAuthSession.mockReturnValue(session)
      isSessionExpired.mockReturnValue(false)
      shouldRefreshToken.mockReturnValue(true)
      refreshAuthSession.mockResolvedValue({ success: true })

      const result = await requireAuth(mockRequest, mockH)

      expect(refreshAuthSession).toHaveBeenCalled()
      expect(updateActivity).toHaveBeenCalled()
      expect(result).toBe(mockH.continue)
    })

    test('redirects if refresh fails', async () => {
      getAuthSession.mockReturnValue({ user: { id: 1 } })
      isSessionExpired.mockReturnValue(false)
      shouldRefreshToken.mockReturnValue(true)
      refreshAuthSession.mockResolvedValue({
        success: false,
        reason: 'SESSION_TIMEOUT'
      })

      await requireAuth(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/login?error=session-timeout'
      )
    })

    test('handles concurrent session', async () => {
      getAuthSession.mockReturnValue({ user: { id: 1 } })
      isSessionExpired.mockReturnValue(false)
      shouldRefreshToken.mockReturnValue(true)
      refreshAuthSession.mockResolvedValue({
        success: false,
        reason: 'SESSION_TIMEOUT'
      })

      await requireAuth(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/login?error=session-timeout'
      )
    })

    test('allows access for valid session', async () => {
      getAuthSession.mockReturnValue({ user: { id: 1 } })
      isSessionExpired.mockReturnValue(false)
      shouldRefreshToken.mockReturnValue(false)

      const result = await requireAuth(mockRequest, mockH)

      expect(updateActivity).toHaveBeenCalled()
      expect(result).toBe(mockH.continue)
    })
  })

  describe('requireAdmin', () => {
    test('redirects if not authenticated', async () => {
      getAuthSession.mockReturnValue(null)

      await requireAdmin(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/login')
    })

    test('redirects non-admin to home', async () => {
      getAuthSession.mockReturnValue({
        user: { id: 1, admin: false }
      })
      isSessionExpired.mockReturnValue(false)
      shouldRefreshToken.mockReturnValue(false)

      await requireAdmin(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })

    test('allows admin access', async () => {
      getAuthSession.mockReturnValue({
        user: { id: 1, admin: true }
      })
      isSessionExpired.mockReturnValue(false)
      shouldRefreshToken.mockReturnValue(false)

      const result = await requireAdmin(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })
  })

  describe('redirectIfAuth', () => {
    test('allows access if no session', () => {
      getAuthSession.mockReturnValue(null)

      const result = redirectIfAuth(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('allows access if session expired', () => {
      getAuthSession.mockReturnValue({ user: { id: 1 } })
      isSessionExpired.mockReturnValue(true)

      const result = redirectIfAuth(mockRequest, mockH)

      expect(result).toBe(mockH.continue)
    })

    test('redirects admin to admin page', () => {
      getAuthSession.mockReturnValue({
        user: { id: 1, admin: true }
      })
      isSessionExpired.mockReturnValue(false)

      redirectIfAuth(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/users')
    })

    test('redirects user to home', () => {
      getAuthSession.mockReturnValue({
        user: { id: 1, admin: false }
      })
      isSessionExpired.mockReturnValue(false)

      redirectIfAuth(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })
  })
})
