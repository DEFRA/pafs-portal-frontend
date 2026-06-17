import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../config/config.js', () => ({
  config: { get: vi.fn() }
}))

const { config } = await import('../../../config/config.js')

const {
  extractToken,
  isValidToken,
  authenticate,
  registerHealthBearerAuth,
  HEALTH_BEARER_SCHEME,
  HEALTH_BEARER_STRATEGY
} = await import('./health-bearer-scheme.js')

describe('health-bearer-scheme', () => {
  describe('extractToken', () => {
    test('returns the token from a valid Bearer header', () => {
      expect(extractToken('Bearer my-secret-token')).toBe('my-secret-token')
    })

    test('is case-insensitive for the Bearer prefix', () => {
      expect(extractToken('BEARER my-token')).toBe('my-token')
      expect(extractToken('bearer my-token')).toBe('my-token')
    })

    test('returns null when the header is undefined', () => {
      expect(extractToken(undefined)).toBeNull()
    })

    test('returns null when the header is null', () => {
      expect(extractToken(null)).toBeNull()
    })

    test('returns null when the header does not use the Bearer scheme', () => {
      expect(extractToken('Basic dXNlcjpwYXNz')).toBeNull()
    })

    test('returns null when the header uses an unrecognised scheme', () => {
      expect(extractToken('Token abc123')).toBeNull()
    })
  })

  describe('isValidToken', () => {
    test('returns true for matching tokens', () => {
      expect(isValidToken('correct-secret', 'correct-secret')).toBe(true)
    })

    test('returns false for non-matching tokens', () => {
      expect(isValidToken('wrong-token', 'correct-secret')).toBe(false)
    })

    test('returns false when the expected token is an empty string', () => {
      expect(isValidToken('any-value', '')).toBe(false)
    })
  })

  describe('authenticate', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      vi.clearAllMocks()
      mockH = {
        unauthenticated: vi.fn().mockReturnValue(Symbol('unauthenticated')),
        authenticated: vi.fn().mockReturnValue(Symbol('authenticated'))
      }
      mockRequest = { headers: {} }
    })

    test('calls unauthenticated when the Authorization header is absent', () => {
      authenticate(mockRequest, mockH)

      expect(mockH.unauthenticated).toHaveBeenCalledTimes(1)
      const boom = mockH.unauthenticated.mock.calls[0][0]
      expect(boom.isBoom).toBe(true)
      expect(boom.output.statusCode).toBe(401)
    })

    test('calls unauthenticated when the token does not match', () => {
      config.get.mockReturnValue('correct-token')
      mockRequest.headers.authorization = 'Bearer wrong-token'

      authenticate(mockRequest, mockH)

      expect(mockH.unauthenticated).toHaveBeenCalledTimes(1)
    })

    test('calls unauthenticated when no expected token is configured', () => {
      config.get.mockReturnValue('')
      mockRequest.headers.authorization = 'Bearer some-token'

      authenticate(mockRequest, mockH)

      expect(mockH.unauthenticated).toHaveBeenCalledTimes(1)
    })

    test('calls authenticated with health credentials when the token is valid', () => {
      config.get.mockReturnValue('correct-token')
      mockRequest.headers.authorization = 'Bearer correct-token'

      authenticate(mockRequest, mockH)

      expect(mockH.authenticated).toHaveBeenCalledWith(
        expect.objectContaining({ credentials: { scope: 'health' } })
      )
    })

    test('does not call authenticated on failure', () => {
      config.get.mockReturnValue('correct-token')
      mockRequest.headers.authorization = 'Bearer wrong-token'

      authenticate(mockRequest, mockH)

      expect(mockH.authenticated).not.toHaveBeenCalled()
    })
  })

  describe('registerHealthBearerAuth', () => {
    test('registers the scheme on the server', () => {
      const mockServer = {
        auth: { scheme: vi.fn(), strategy: vi.fn() }
      }

      registerHealthBearerAuth(mockServer)

      expect(mockServer.auth.scheme).toHaveBeenCalledWith(
        HEALTH_BEARER_SCHEME,
        expect.any(Function)
      )
    })

    test('registers the strategy using the correct scheme', () => {
      const mockServer = {
        auth: { scheme: vi.fn(), strategy: vi.fn() }
      }

      registerHealthBearerAuth(mockServer)

      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        HEALTH_BEARER_STRATEGY,
        HEALTH_BEARER_SCHEME
      )
    })

    test('scheme name and strategy name are distinct', () => {
      expect(HEALTH_BEARER_SCHEME).not.toBe(HEALTH_BEARER_STRATEGY)
    })
  })
})
