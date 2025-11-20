import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  setAuthSession,
  getAuthSession,
  clearAuthSession,
  isSessionExpired,
  shouldRefreshToken,
  refreshAuthSession,
  updateActivity
} from './session-manager.js'

vi.mock('../../services/auth/auth-service.js')

const { refreshToken } = await import('../../services/auth/auth-service.js')

describe('Session Manager', () => {
  let mockRequest

  beforeEach(() => {
    mockRequest = {
      yar: {
        set: vi.fn(),
        get: vi.fn(),
        reset: vi.fn()
      },
      server: {
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }
    }
    vi.clearAllMocks()
  })

  describe('setAuthSession', () => {
    test('stores auth data in session', () => {
      const authData = {
        user: { id: 1, email: 'test@example.com' },
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiresIn: '15m'
      }

      setAuthSession(mockRequest, authData)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'auth',
        expect.objectContaining({
          user: authData.user,
          accessToken: 'access123',
          refreshToken: 'refresh123'
        })
      )
    })
  })

  describe('getAuthSession', () => {
    test('retrieves session from yar', () => {
      const session = { user: { id: 1 } }
      mockRequest.yar.get.mockReturnValue(session)

      const result = getAuthSession(mockRequest)

      expect(result).toBe(session)
      expect(mockRequest.yar.get).toHaveBeenCalledWith('auth')
    })
  })

  describe('clearAuthSession', () => {
    test('resets session', () => {
      clearAuthSession(mockRequest)

      expect(mockRequest.yar.reset).toHaveBeenCalled()
    })
  })

  describe('isSessionExpired', () => {
    test('returns true if no session', () => {
      expect(isSessionExpired(null)).toBe(true)
    })

    test('returns false for active session', () => {
      const session = {
        lastActivity: Date.now()
      }

      expect(isSessionExpired(session)).toBe(false)
    })

    test('returns true for inactive session', () => {
      const session = {
        lastActivity: Date.now() - 31 * 60 * 1000 // 31 minutes ago
      }

      expect(isSessionExpired(session)).toBe(true)
    })
  })

  describe('shouldRefreshToken', () => {
    test('returns false if no session', () => {
      expect(shouldRefreshToken(null)).toBe(false)
    })

    test('returns true when token expires soon', () => {
      const session = {
        expiresAt: Date.now() + 30000 // 30 seconds
      }

      expect(shouldRefreshToken(session)).toBe(true)
    })

    test('returns false when token has time', () => {
      const session = {
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
      }

      expect(shouldRefreshToken(session)).toBe(false)
    })
  })

  describe('refreshAuthSession', () => {
    test('returns error if no session', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      const result = await refreshAuthSession(mockRequest)

      expect(result).toEqual({ success: false, reason: 'SESSION_TIMEOUT' })
    })

    test('refreshes token successfully', async () => {
      const session = {
        user: { id: 1 },
        accessToken: 'old-token',
        refreshToken: 'refresh123',
        expiresAt: Date.now() + 60000,
        lastActivity: Date.now()
      }

      mockRequest.yar.get.mockReturnValue(session)
      refreshToken.mockResolvedValue({
        success: true,
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh',
          expiresIn: '15m'
        }
      })

      const result = await refreshAuthSession(mockRequest)

      expect(result).toEqual({ success: true })
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('handles concurrent session error', async () => {
      const session = {
        refreshToken: 'refresh123',
        lastActivity: Date.now()
      }

      mockRequest.yar.get.mockReturnValue(session)
      refreshToken.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_CONCURRENT_SESSION'
        }
      })

      const result = await refreshAuthSession(mockRequest)

      expect(result).toEqual({ success: false, reason: 'SESSION_TIMEOUT' })
      expect(mockRequest.yar.reset).toHaveBeenCalled()
    })

    test('handles refresh failure', async () => {
      const session = {
        refreshToken: 'refresh123',
        lastActivity: Date.now()
      }

      mockRequest.yar.get.mockReturnValue(session)
      refreshToken.mockRejectedValue(new Error('Network error'))

      const result = await refreshAuthSession(mockRequest)

      expect(result).toEqual({ success: false, reason: 'SESSION_TIMEOUT' })
    })
  })

  describe('updateActivity', () => {
    test('updates last activity timestamp', () => {
      const session = {
        user: { id: 1 },
        lastActivity: Date.now() - 60000
      }

      mockRequest.yar.get.mockReturnValue(session)

      updateActivity(mockRequest)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'auth',
        expect.objectContaining({
          user: { id: 1 }
        })
      )
    })

    test('does nothing if no session', () => {
      mockRequest.yar.get.mockReturnValue(null)

      updateActivity(mockRequest)

      expect(mockRequest.yar.set).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    test('handles session with missing user', () => {
      const session = {
        accessToken: 'token',
        lastActivity: Date.now()
      }

      expect(isSessionExpired(session)).toBe(false)
    })

    test('handles session at exact expiry boundary', () => {
      const session = {
        lastActivity: Date.now() - 30 * 60 * 1000 // Exactly 30 minutes
      }

      expect(isSessionExpired(session)).toBe(false)
    })

    test('handles session just past expiry', () => {
      const session = {
        lastActivity: Date.now() - (30 * 60 * 1000 + 1) // 1ms past 30 minutes
      }

      expect(isSessionExpired(session)).toBe(true)
    })

    test('handles token at exact refresh boundary', () => {
      const session = {
        expiresAt: Date.now() + 60000 // Exactly 1 minute
      }

      expect(shouldRefreshToken(session)).toBe(false)
    })

    test('handles token just before refresh boundary', () => {
      const session = {
        expiresAt: Date.now() + 59999 // 1ms before 1 minute
      }

      expect(shouldRefreshToken(session)).toBe(true)
    })

    test('setAuthSession handles numeric expiresIn', () => {
      const authData = {
        user: { id: 1 },
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: 900000 // 15 minutes in ms
      }

      setAuthSession(mockRequest, authData)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'auth',
        expect.objectContaining({
          accessToken: 'token'
        })
      )
    })

    test('setAuthSession handles string expiresIn', () => {
      const authData = {
        user: { id: 1 },
        accessToken: 'token',
        refreshToken: 'refresh',
        expiresIn: '15m'
      }

      setAuthSession(mockRequest, authData)

      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('refreshAuthSession handles token refresh error', async () => {
      const session = {
        refreshToken: 'refresh123',
        lastActivity: Date.now()
      }

      mockRequest.yar.get.mockReturnValue(session)
      refreshToken.mockResolvedValue({
        success: false,
        error: { errorCode: 'AUTH_TOKEN_INVALID' }
      })

      const result = await refreshAuthSession(mockRequest)

      expect(result).toEqual({ success: false, reason: 'SESSION_TIMEOUT' })
      expect(mockRequest.yar.reset).toHaveBeenCalled()
    })
  })
})
