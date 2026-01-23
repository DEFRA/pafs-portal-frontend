import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  needsCookiePolicyReacceptance,
  hasCookiePreferencesSet,
  getCookiePolicyStatus
} from './cookie-policy-helper.js'
import { config } from '../../../../config/config.js'

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

describe('cookie-policy-helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.get.mockReturnValue(1) // Default policy version
  })

  describe('needsCookiePolicyReacceptance', () => {
    test('returns false when no cookie is set', () => {
      const request = {
        state: {}
      }

      const result = needsCookiePolicyReacceptance(request)

      expect(result).toBe(false)
    })

    test('returns true when cookie has no version field (old format)', () => {
      const request = {
        state: {
          cookies_policy: JSON.stringify({ analytics: 'yes' })
        }
      }

      const result = needsCookiePolicyReacceptance(request)

      expect(result).toBe(true)
    })

    test('returns false when cookie version matches current version', () => {
      config.get.mockReturnValue(2)
      const request = {
        state: {
          cookies_policy: JSON.stringify({
            analytics: 'yes',
            policyVersion: 2
          })
        }
      }

      const result = needsCookiePolicyReacceptance(request)

      expect(result).toBe(false)
    })

    test('returns true when cookie version is less than current version', () => {
      config.get.mockReturnValue(3)
      const request = {
        state: {
          cookies_policy: JSON.stringify({
            analytics: 'yes',
            policyVersion: 2
          })
        }
      }

      const result = needsCookiePolicyReacceptance(request)

      expect(result).toBe(true)
    })

    test('returns true when cookie parsing fails', () => {
      const request = {
        state: {
          cookies_policy: 'invalid-json'
        }
      }

      const result = needsCookiePolicyReacceptance(request)

      expect(result).toBe(true)
    })
  })

  describe('hasCookiePreferencesSet', () => {
    test('returns true when preferences cookie is set', () => {
      const request = {
        state: {
          cookies_preferences_set: 'true'
        }
      }

      const result = hasCookiePreferencesSet(request)

      expect(result).toBe(true)
    })

    test('returns false when preferences cookie is not set', () => {
      const request = {
        state: {}
      }

      const result = hasCookiePreferencesSet(request)

      expect(result).toBe(false)
    })
  })

  describe('getCookiePolicyStatus', () => {
    test('returns correct status when user has not accepted before', () => {
      const request = {
        state: {}
      }

      const result = getCookiePolicyStatus(request)

      expect(result).toEqual({
        hasAcceptedBefore: false,
        needsReacceptance: false,
        shouldShowBanner: true
      })
    })

    test('returns correct status when user accepted old version', () => {
      config.get.mockReturnValue(2)
      const request = {
        state: {
          cookies_preferences_set: 'true',
          cookies_policy: JSON.stringify({
            analytics: 'yes',
            policyVersion: 1
          })
        }
      }

      const result = getCookiePolicyStatus(request)

      expect(result).toEqual({
        hasAcceptedBefore: true,
        needsReacceptance: true,
        shouldShowBanner: true
      })
    })

    test('returns correct status when user accepted current version', () => {
      config.get.mockReturnValue(2)
      const request = {
        state: {
          cookies_preferences_set: 'true',
          cookies_policy: JSON.stringify({
            analytics: 'yes',
            policyVersion: 2
          })
        }
      }

      const result = getCookiePolicyStatus(request)

      expect(result).toEqual({
        hasAcceptedBefore: true,
        needsReacceptance: false,
        shouldShowBanner: false
      })
    })
  })
})
