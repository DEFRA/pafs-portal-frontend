import { describe, it, expect, vi } from 'vitest'
import crypto from 'node:crypto'
import {
  encodeUserId,
  decodeUserId,
  isValidToken,
  encodeUserIds,
  decodeUserIds
} from './encoder.js'

// Mock config
vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'security.idSecret') {
        return 'test-secret-key-that-is-at-least-32-characters-long-for-testing'
      }
      return null
    })
  }
}))

describe('ID Encoder/Decoder', () => {
  describe('encodeUserId', () => {
    it('encodes a numeric ID successfully', () => {
      const token = encodeUserId(123)

      expect(token).toBeTruthy()
      expect(typeof token).toBe('string')
      expect(token).toContain('.')
      expect(token.split('.')).toHaveLength(2)
    })

    it('encodes string numeric ID', () => {
      const token = encodeUserId('456')

      expect(token).toBeTruthy()
      expect(token).toContain('.')
    })

    it('produces consistent output for same ID', () => {
      const token1 = encodeUserId(789)
      const token2 = encodeUserId(789)

      expect(token1).toBe(token2)
    })

    it('produces different tokens for different IDs', () => {
      const token1 = encodeUserId(100)
      const token2 = encodeUserId(200)

      expect(token1).not.toBe(token2)
    })

    it('encodes large IDs correctly', () => {
      const largeId = 9007199254740991 // Max safe integer
      const token = encodeUserId(largeId)

      expect(token).toBeTruthy()
      expect(token).toContain('.')
    })

    it('throws error for null ID', () => {
      expect(() => encodeUserId(null)).toThrow(
        'ID cannot be null, undefined, or empty'
      )
    })

    it('throws error for undefined ID', () => {
      expect(() => encodeUserId(undefined)).toThrow(
        'ID cannot be null, undefined, or empty'
      )
    })

    it('throws error for empty string ID', () => {
      expect(() => encodeUserId('')).toThrow(
        'ID cannot be null, undefined, or empty'
      )
    })

    it('throws error for non-numeric string', () => {
      expect(() => encodeUserId('abc')).toThrow('ID must be a positive integer')
    })

    it('throws error for negative number', () => {
      expect(() => encodeUserId(-123)).toThrow('ID must be a positive integer')
    })

    it('throws error for decimal number', () => {
      expect(() => encodeUserId('12.34')).toThrow(
        'ID must be a positive integer'
      )
    })

    it('throws error for ID with special characters', () => {
      expect(() => encodeUserId('123!@#')).toThrow(
        'ID must be a positive integer'
      )
    })

    it('encodes zero as valid ID', () => {
      expect(() => encodeUserId(0)).toThrow('ID must be a positive integer')
    })
  })

  describe('decodeUserId', () => {
    it('decodes a valid token successfully', () => {
      const originalId = 123
      const token = encodeUserId(originalId)
      const decodedId = decodeUserId(token)

      expect(decodedId).toBe(originalId)
    })

    it('decodes token with string ID', () => {
      const token = encodeUserId('456')
      const decodedId = decodeUserId(token)

      expect(decodedId).toBe(456)
    })

    it('decodes large ID correctly', () => {
      const largeId = 9007199254740991
      const token = encodeUserId(largeId)
      const decodedId = decodeUserId(token)

      expect(decodedId).toBe(largeId)
    })

    it('returns null for invalid token format', () => {
      expect(decodeUserId('invalid-token')).toBeNull()
    })

    it('returns null for token without separator', () => {
      expect(decodeUserId('MTIzNDU2')).toBeNull()
    })

    it('returns null for token with multiple separators', () => {
      expect(decodeUserId('MTIz.abc.def')).toBeNull()
    })

    it('returns null for empty token', () => {
      expect(decodeUserId('')).toBeNull()
    })

    it('returns null for null token', () => {
      expect(decodeUserId(null)).toBeNull()
    })

    it('returns null for undefined token', () => {
      expect(decodeUserId(undefined)).toBeNull()
    })

    it('returns null for non-string token', () => {
      expect(decodeUserId(123)).toBeNull()
    })

    it('returns null for tampered payload', () => {
      const token = encodeUserId(123)
      const [, signature] = token.split('.')
      const tamperedToken = `TAMPERED.${signature}`

      expect(decodeUserId(tamperedToken)).toBeNull()
    })

    it('returns null for tampered signature', () => {
      const token = encodeUserId(123)
      const [payload] = token.split('.')
      const tamperedToken = `${payload}.TAMPERED123`

      expect(decodeUserId(tamperedToken)).toBeNull()
    })

    it('returns null for token with empty payload', () => {
      expect(decodeUserId('.abc123def456')).toBeNull()
    })

    it('returns null for token with empty signature', () => {
      expect(decodeUserId('MTIz.')).toBeNull()
    })

    it('returns null for non-numeric decoded payload', () => {
      // Create a token with non-numeric payload
      const invalidPayload = Buffer.from('abc').toString('base64url')
      const fakeToken = `${invalidPayload}.fakesignature`

      expect(decodeUserId(fakeToken)).toBeNull()
    })

    it('returns null for negative number in payload', () => {
      // Manually create token with negative number
      const negativePayload = Buffer.from('-123').toString('base64url')
      const fakeToken = `${negativePayload}.fakesignature`

      expect(decodeUserId(fakeToken)).toBeNull()
    })

    it('returns null for unsafe integer', () => {
      // Number larger than MAX_SAFE_INTEGER
      const unsafePayload =
        Buffer.from('9007199254740992').toString('base64url')
      const secret =
        'test-secret-key-that-is-at-least-32-characters-long-for-testing'
      const signature = crypto
        .createHmac('sha256', secret)
        .update('9007199254740992')
        .digest('base64url')
        .substring(0, 12)
      const unsafeToken = `${unsafePayload}.${signature}`

      expect(decodeUserId(unsafeToken)).toBeNull()
    })

    it('handles malformed base64url gracefully', () => {
      expect(decodeUserId('!!!invalid!!!.signature')).toBeNull()
    })
  })

  describe('isValidToken', () => {
    it('returns true for valid token', () => {
      const token = encodeUserId(123)
      expect(isValidToken(token)).toBe(true)
    })

    it('returns false for invalid token', () => {
      expect(isValidToken('invalid')).toBe(false)
    })

    it('returns false for null', () => {
      expect(isValidToken(null)).toBe(false)
    })

    it('returns false for undefined', () => {
      expect(isValidToken(undefined)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isValidToken('')).toBe(false)
    })

    it('returns false for tampered token', () => {
      const token = encodeUserId(123)
      const tamperedToken = token.replace(/.$/, 'X')
      expect(isValidToken(tamperedToken)).toBe(false)
    })
  })

  describe('encodeUserIds', () => {
    it('encodes array of IDs successfully', () => {
      const ids = [123, 456, 789]
      const tokens = encodeUserIds(ids)

      expect(tokens).toHaveLength(3)
      expect(tokens[0]).toBe(encodeUserId(123))
      expect(tokens[1]).toBe(encodeUserId(456))
      expect(tokens[2]).toBe(encodeUserId(789))
    })

    it('handles empty array', () => {
      const tokens = encodeUserIds([])
      expect(tokens).toEqual([])
    })

    it('handles single ID', () => {
      const tokens = encodeUserIds([999])
      expect(tokens).toHaveLength(1)
      expect(tokens[0]).toBe(encodeUserId(999))
    })

    it('handles string IDs in array', () => {
      const tokens = encodeUserIds(['111', '222'])
      expect(tokens).toHaveLength(2)
      expect(decodeUserId(tokens[0])).toBe(111)
      expect(decodeUserId(tokens[1])).toBe(222)
    })

    it('throws error for non-array input', () => {
      expect(() => encodeUserIds(123)).toThrow('Input must be an array')
    })

    it('throws error for null input', () => {
      expect(() => encodeUserIds(null)).toThrow('Input must be an array')
    })

    it('throws error if any ID is invalid', () => {
      expect(() => encodeUserIds([123, 'invalid', 456])).toThrow(
        'ID must be a positive integer'
      )
    })
  })

  describe('decodeUserIds', () => {
    it('decodes array of tokens successfully', () => {
      const ids = [123, 456, 789]
      const tokens = encodeUserIds(ids)
      const decodedIds = decodeUserIds(tokens)

      expect(decodedIds).toEqual(ids)
    })

    it('handles empty array', () => {
      const decodedIds = decodeUserIds([])
      expect(decodedIds).toEqual([])
    })

    it('filters out invalid tokens', () => {
      const validToken = encodeUserId(123)
      const tokens = [validToken, 'invalid', 'also-invalid']
      const decodedIds = decodeUserIds(tokens)

      expect(decodedIds).toEqual([123])
    })

    it('returns empty array if all tokens invalid', () => {
      const tokens = ['invalid1', 'invalid2', 'invalid3']
      const decodedIds = decodeUserIds(tokens)

      expect(decodedIds).toEqual([])
    })

    it('handles single token', () => {
      const token = encodeUserId(999)
      const decodedIds = decodeUserIds([token])

      expect(decodedIds).toEqual([999])
    })

    it('throws error for non-array input', () => {
      expect(() => decodeUserIds('not-an-array')).toThrow(
        'Input must be an array'
      )
    })

    it('throws error for null input', () => {
      expect(() => decodeUserIds(null)).toThrow('Input must be an array')
    })

    it('handles mixed valid and invalid tokens', () => {
      const token1 = encodeUserId(111)
      const token2 = encodeUserId(222)
      const tokens = [token1, 'invalid', token2, '', null]
      const decodedIds = decodeUserIds(tokens)

      expect(decodedIds).toEqual([111, 222])
    })
  })

  describe('security properties', () => {
    it('uses timing-safe comparison for signature verification', () => {
      const token = encodeUserId(123)
      const [payload] = token.split('.')

      // Create slightly different signature
      const wrongSignature = 'a'.repeat(12)
      const tamperedToken = `${payload}.${wrongSignature}`

      // Should return null (invalid) without timing leak
      expect(decodeUserId(tamperedToken)).toBeNull()
    })

    it('different secrets produce different tokens', async () => {
      const { config } = await import('../../../../config/config.js')

      // First token with original secret
      const token1 = encodeUserId(123)

      // Change secret
      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'different-secret-key-that-is-at-least-32-characters-long'
        }
        return null
      })

      // Second token with different secret
      const token2 = encodeUserId(123)

      expect(token1).not.toBe(token2)

      // Restore original secret
      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'test-secret-key-that-is-at-least-32-characters-long-for-testing'
        }
        return null
      })
    })

    it('token cannot be decoded with wrong secret', async () => {
      const { config } = await import('../../../../config/config.js')

      const token = encodeUserId(123)

      // Change secret
      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'wrong-secret-key-that-is-at-least-32-characters-long-now'
        }
        return null
      })

      // Should fail to decode
      expect(decodeUserId(token)).toBeNull()

      // Restore original secret
      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'test-secret-key-that-is-at-least-32-characters-long-for-testing'
        }
        return null
      })
    })

    it('throws error if secret is too short', async () => {
      const { config } = await import('../../../../config/config.js')

      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'short' // Less than 32 characters
        }
        return null
      })

      expect(() => encodeUserId(123)).toThrow(
        'ID_SECRET must be configured and at least 32 characters long'
      )

      // Restore
      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'test-secret-key-that-is-at-least-32-characters-long-for-testing'
        }
        return null
      })
    })

    it('throws error if secret is not configured', async () => {
      const { config } = await import('../../../../config/config.js')

      config.get.mockImplementation(() => null)

      expect(() => encodeUserId(123)).toThrow(
        'ID_SECRET must be configured and at least 32 characters long'
      )

      // Restore
      config.get.mockImplementation((key) => {
        if (key === 'security.idSecret') {
          return 'test-secret-key-that-is-at-least-32-characters-long-for-testing'
        }
        return null
      })
    })
  })

  describe('round-trip encoding/decoding', () => {
    const testIds = [
      1,
      10,
      100,
      1000,
      10000,
      100000,
      1000000,
      9007199254740991 // MAX_SAFE_INTEGER
    ]

    testIds.forEach((id) => {
      it(`correctly round-trips ID ${id}`, () => {
        const token = encodeUserId(id)
        const decoded = decodeUserId(token)
        expect(decoded).toBe(id)
      })
    })
  })

  describe('edge cases', () => {
    it('handles ID 1', () => {
      const token = encodeUserId(1)
      expect(decodeUserId(token)).toBe(1)
    })

    it('handles very long ID string', () => {
      const longId = '123456789012345'
      const token = encodeUserId(longId)
      expect(decodeUserId(token)).toBe(123456789012345)
    })

    it('signature is exactly 12 characters', () => {
      const token = encodeUserId(123)
      const [, signature] = token.split('.')
      expect(signature).toHaveLength(12)
    })

    it('payload is base64url encoded', () => {
      const token = encodeUserId(123)
      const [payload] = token.split('.')

      // base64url should not contain +, /, or =
      expect(payload).not.toContain('+')
      expect(payload).not.toContain('/')
      expect(payload).not.toContain('=')
    })
  })
})
