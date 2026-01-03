import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  validateInvitationToken,
  setPassword,
  validateSession
} from './auth-service.js'

vi.mock('../../helpers/api-client/index.js', () => ({
  apiRequest: vi.fn()
}))

describe('Auth Service', () => {
  let apiRequest

  beforeEach(async () => {
    const apiClient = await import('../../helpers/api-client/index.js')
    apiRequest = apiClient.apiRequest
    vi.clearAllMocks()
  })

  describe('login', () => {
    test('calls API with email and password', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: 1, email: 'test@example.com' },
          accessToken: 'token123',
          refreshToken: 'refresh123'
        }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await login('test@example.com', 'password123')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    test('returns error response', async () => {
      const mockError = {
        success: false,
        error: { error: 'Invalid credentials' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await login('test@example.com', 'wrong')

      expect(result).toEqual(mockError)
    })
  })

  describe('refreshToken', () => {
    test('calls API with refresh token', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-token',
          refreshToken: 'new-refresh'
        }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await refreshToken('refresh123')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'refresh123' })
      })
      expect(result).toEqual(mockResponse)
    })

    test('handles expired token', async () => {
      const mockError = {
        success: false,
        error: { error: 'Token expired' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await refreshToken('expired-token')

      expect(result.success).toBe(false)
    })
  })

  describe('logout', () => {
    test('calls API with access token', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Logged out' }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await logout('token123')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123'
        }
      })
      expect(result).toEqual(mockResponse)
    })

    test('handles logout error', async () => {
      const mockError = {
        success: false,
        error: { error: 'Invalid token' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await logout('invalid-token')

      expect(result.success).toBe(false)
    })
  })

  describe('validateResetToken', () => {
    it('calls API with token', async () => {
      const { validateResetToken } = await import('./auth-service.js')
      const { apiRequest } = await import('../../helpers/api-client/index.js')

      apiRequest.mockResolvedValue({ success: true })

      const result = await validateResetToken('valid-token-123')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/validate-token', {
        method: 'POST',
        body: JSON.stringify({ token: 'valid-token-123', type: 'RESET' })
      })
      expect(result).toEqual({ success: true })
    })

    it('handles invalid token', async () => {
      const { validateResetToken } = await import('./auth-service.js')
      const { apiRequest } = await import('../../helpers/api-client/index.js')

      apiRequest.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_PASSWORD_RESET_INVALID_TOKEN',
          message: 'Invalid token'
        }
      })

      const result = await validateResetToken('invalid-token')

      expect(result.success).toBe(false)
      expect(result.error.errorCode).toBe('AUTH_PASSWORD_RESET_INVALID_TOKEN')
    })

    it('handles expired token', async () => {
      const { validateResetToken } = await import('./auth-service.js')
      const { apiRequest } = await import('../../helpers/api-client/index.js')

      apiRequest.mockResolvedValue({
        success: false,
        error: {
          errorCode: 'AUTH_PASSWORD_RESET_EXPIRED_TOKEN',
          message: 'Token expired'
        }
      })

      const result = await validateResetToken('expired-token')

      expect(result.success).toBe(false)
      expect(result.error.errorCode).toBe('AUTH_PASSWORD_RESET_EXPIRED_TOKEN')
    })
  })

  describe('forgotPassword', () => {
    test('calls API with email', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Reset email sent' }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await forgotPassword('test@example.com')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@example.com' })
      })
      expect(result).toEqual(mockResponse)
    })

    test('handles API error', async () => {
      const mockError = {
        success: false,
        error: { error: 'Service unavailable' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await forgotPassword('test@example.com')

      expect(result.success).toBe(false)
    })
  })

  describe('resetPassword', () => {
    test('calls API with token and passwords', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Password reset successful' }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await resetPassword(
        'token123',
        'NewPass123!',
        'NewPass123!'
      )

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'token123',
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    test('handles invalid token error', async () => {
      const mockError = {
        success: false,
        error: { errorCode: 'AUTH_PASSWORD_RESET_INVALID_TOKEN' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await resetPassword(
        'invalid-token',
        'NewPass123!',
        'NewPass123!'
      )

      expect(result.success).toBe(false)
      expect(result.error.errorCode).toBe('AUTH_PASSWORD_RESET_INVALID_TOKEN')
    })

    test('handles password used previously error', async () => {
      const mockError = {
        success: false,
        error: { errorCode: 'AUTH_PASSWORD_RESET_PASSWORD_WAS_USED_PREVIOUSLY' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await resetPassword(
        'token123',
        'OldPass123!',
        'OldPass123!'
      )

      expect(result.success).toBe(false)
      expect(result.error.errorCode).toBe(
        'AUTH_PASSWORD_RESET_PASSWORD_WAS_USED_PREVIOUSLY'
      )
    })
  })

  describe('validateInvitationToken', () => {
    test('calls API with token and INVITATION type', async () => {
      const mockResponse = {
        success: true,
        data: { email: 'test@example.com' }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await validateInvitationToken('invitation-token-123')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/validate-token', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invitation-token-123',
          type: 'INVITATION'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    test('handles invalid invitation token', async () => {
      const mockError = {
        success: false,
        error: { errorCode: 'AUTH_INVITATION_TOKEN_EXPIRED_INVALID' }
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateInvitationToken('invalid-token')

      expect(result.success).toBe(false)
    })
  })

  describe('setPassword', () => {
    test('calls API with token and passwords', async () => {
      const mockResponse = {
        success: true,
        data: { message: 'Password set successful' }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await setPassword(
        'invitation-token-123',
        'NewPass123!',
        'NewPass123!'
      )

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({
          token: 'invitation-token-123',
          password: 'NewPass123!',
          confirmPassword: 'NewPass123!'
        })
      })
      expect(result).toEqual(mockResponse)
    })

    test('handles invalid invitation token error', async () => {
      const mockError = {
        success: false,
        errors: [{ errorCode: 'AUTH_INVITATION_TOKEN_EXPIRED_INVALID' }]
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await setPassword(
        'invalid-token',
        'NewPass123!',
        'NewPass123!'
      )

      expect(result.success).toBe(false)
    })
  })

  describe('validateSession', () => {
    test('calls API with access token in Authorization header', async () => {
      const mockResponse = {
        success: true,
        data: { valid: true }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await validateSession('access-token-123')

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/auth/validate-session', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer access-token-123'
        }
      })
      expect(result).toEqual(mockResponse)
    })

    test('returns success for valid session', async () => {
      const mockResponse = {
        success: true,
        data: { valid: true }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await validateSession('valid-token')

      expect(result.success).toBe(true)
      expect(result.data.valid).toBe(true)
    })

    test('handles session mismatch error (concurrent login)', async () => {
      const mockError = {
        success: false,
        status: 401,
        errors: [{ errorCode: 'AUTH_SESSION_MISMATCH' }],
        validationErrors: null
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('old-session-token')

      expect(result.success).toBe(false)
      expect(result.errors[0].errorCode).toBe('AUTH_SESSION_MISMATCH')
    })

    test('handles expired token error', async () => {
      const mockError = {
        success: false,
        status: 401,
        errors: [{ errorCode: 'AUTH_TOKEN_EXPIRED_INVALID' }],
        validationErrors: null
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('expired-token')

      expect(result.success).toBe(false)
      expect(result.errors[0].errorCode).toBe('AUTH_TOKEN_EXPIRED_INVALID')
    })

    test('handles account disabled error', async () => {
      const mockError = {
        success: false,
        status: 401,
        errors: [{ errorCode: 'AUTH_ACCOUNT_DISABLED' }],
        validationErrors: null
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('token-for-disabled-account')

      expect(result.success).toBe(false)
      expect(result.errors[0].errorCode).toBe('AUTH_ACCOUNT_DISABLED')
    })

    test('handles account locked error', async () => {
      const mockError = {
        success: false,
        status: 401,
        errors: [{ errorCode: 'AUTH_ACCOUNT_LOCKED' }],
        validationErrors: null
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('token-for-locked-account')

      expect(result.success).toBe(false)
      expect(result.errors[0].errorCode).toBe('AUTH_ACCOUNT_LOCKED')
    })

    test('handles account not found error', async () => {
      const mockError = {
        success: false,
        status: 401,
        errors: [{ errorCode: 'AUTH_ACCOUNT_NOT_FOUND' }],
        validationErrors: null
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('token-for-deleted-user')

      expect(result.success).toBe(false)
      expect(result.errors[0].errorCode).toBe('AUTH_ACCOUNT_NOT_FOUND')
    })

    test('handles network errors', async () => {
      const mockError = {
        success: false,
        status: 0,
        errors: [{ errorCode: 'NETWORK_ERROR', message: 'Network timeout' }]
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('any-token')

      expect(result.success).toBe(false)
      expect(result.errors[0].errorCode).toBe('NETWORK_ERROR')
    })

    test('handles server errors', async () => {
      const mockError = {
        success: false,
        status: 500,
        errors: [{ errorCode: 'UNKNOWN_ERROR' }]
      }
      apiRequest.mockResolvedValue(mockError)

      const result = await validateSession('any-token')

      expect(result.success).toBe(false)
    })
  })
})
