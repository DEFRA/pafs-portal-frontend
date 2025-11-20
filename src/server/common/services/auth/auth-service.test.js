import { describe, test, expect, beforeEach, vi } from 'vitest'
import { login, refreshToken, logout } from './auth-service.js'

vi.mock('../../helpers/api-client.js', () => ({
  apiRequest: vi.fn()
}))

const { apiRequest } = await import('../../helpers/api-client.js')

describe('Auth Service', () => {
  beforeEach(() => {
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
})
