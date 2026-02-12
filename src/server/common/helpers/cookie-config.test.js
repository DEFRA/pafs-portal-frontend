import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  COOKIE_NAMES,
  COOKIE_STATE_CONFIG,
  getCookieOptions,
  registerCookieStates,
  createCookiePolicyValue
} from './cookie-config.js'
import { config } from '../../../config/config.js'

vi.mock('../../../config/config.js', () => ({ config: { get: vi.fn() } }))

describe('cookie-config', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('COOKIE_NAMES', () => {
    it('exports correct cookie name constants', () => {
      expect(COOKIE_NAMES.POLICY).toBe('cookies_policy')
      expect(COOKIE_NAMES.PREFERENCES_SET).toBe('cookies_preferences_set')
      expect(COOKIE_NAMES.SHOW_CONFIRMATION).toBe('show_cookie_confirmation')
    })
  })

  describe('COOKIE_STATE_CONFIG', () => {
    it('has correct server state configuration', () => {
      expect(COOKIE_STATE_CONFIG).toEqual({
        encoding: 'base64json',
        clearInvalid: true,
        strictHeader: false
      })
    })
  })

  describe('getCookieOptions', () => {
    it('returns default cookie options with config values', () => {
      config.get.mockImplementation((key) => {
        if (key === 'cookie.preferences.ttl') return 31536000000
        if (key === 'session.cookie.secure') return true
        return null
      })

      const options = getCookieOptions()

      expect(options).toEqual({
        path: '/',
        ttl: 31536000000,
        isSecure: true,
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
      expect(config.get).toHaveBeenCalledWith('cookie.preferences.ttl')
      expect(config.get).toHaveBeenCalledWith('session.cookie.secure')
    })

    it('allows overriding path', () => {
      config.get.mockImplementation((key) => {
        if (key === 'cookie.preferences.ttl') return 1000
        if (key === 'session.cookie.secure') return false
        return null
      })

      const options = getCookieOptions({ path: '/custom' })

      expect(options.path).toBe('/custom')
    })

    it('allows overriding ttl', () => {
      config.get.mockReturnValue(false)

      const options = getCookieOptions({ ttl: 5000 })

      expect(options.ttl).toBe(5000)
    })

    it('allows ttl to be null', () => {
      config.get.mockReturnValue(false)

      const options = getCookieOptions({ ttl: null })

      expect(options.ttl).toBeNull()
    })

    it('allows overriding isHttpOnly', () => {
      config.get.mockImplementation((key) => {
        if (key === 'cookie.preferences.ttl') return 1000
        if (key === 'session.cookie.secure') return true
        return null
      })

      const options = getCookieOptions({ isHttpOnly: false })

      expect(options.isHttpOnly).toBe(false)
    })

    it('allows overriding isSameSite', () => {
      config.get.mockImplementation((key) => {
        if (key === 'cookie.preferences.ttl') return 1000
        if (key === 'session.cookie.secure') return true
        return null
      })

      const options = getCookieOptions({ isSameSite: 'Strict' })

      expect(options.isSameSite).toBe('Strict')
    })

    it('allows multiple overrides at once', () => {
      config.get.mockImplementation((key) => {
        if (key === 'cookie.preferences.ttl') return 31536000000
        if (key === 'session.cookie.secure') return true
        return null
      })

      const options = getCookieOptions({
        path: '/api',
        ttl: null,
        isHttpOnly: false,
        isSameSite: 'None'
      })

      expect(options).toEqual({
        path: '/api',
        ttl: null,
        isSecure: true,
        isHttpOnly: false,
        isSameSite: 'None'
      })
    })
  })

  describe('registerCookieStates', () => {
    it('registers all cookie names with state configuration', () => {
      const stateSpy = vi.fn()
      const mockServer = { state: stateSpy }

      registerCookieStates(mockServer)

      expect(stateSpy).toHaveBeenCalledTimes(3)
      expect(stateSpy).toHaveBeenCalledWith(
        'cookies_policy',
        COOKIE_STATE_CONFIG
      )
      expect(stateSpy).toHaveBeenCalledWith(
        'cookies_preferences_set',
        COOKIE_STATE_CONFIG
      )
      expect(stateSpy).toHaveBeenCalledWith(
        'show_cookie_confirmation',
        COOKIE_STATE_CONFIG
      )
    })
  })

  describe('createCookiePolicyValue', () => {
    it('creates policy object with yes consent', () => {
      config.get.mockReturnValue(2)

      const policyValue = createCookiePolicyValue('yes')

      expect(policyValue).toBe(
        JSON.stringify({
          analytics: 'yes',
          policyVersion: 2
        })
      )
      expect(config.get).toHaveBeenCalledWith('cookie.policy.version')
    })

    it('creates policy object with no consent', () => {
      config.get.mockReturnValue(1)

      const policyValue = createCookiePolicyValue('no')

      expect(policyValue).toBe(
        JSON.stringify({
          analytics: 'no',
          policyVersion: 1
        })
      )
    })

    it('uses current policy version from config', () => {
      config.get.mockReturnValue(5)

      const policyValue = createCookiePolicyValue('yes')
      const parsed = JSON.parse(policyValue)

      expect(parsed.policyVersion).toBe(5)
    })
  })
})
