import { describe, test, expect, beforeEach, vi } from 'vitest'
import { cookiesBannerController } from './controller.js'

describe('Cookies Banner Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      headers: {
        referer: '/test-page'
      },
      state: {}
    }

    mockH = {
      redirect: vi.fn().mockReturnValue({
        state: vi.fn().mockReturnThis()
      })
    }
  })

  describe('Accept handler', () => {
    test('redirects to referer page', () => {
      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/test-page')
    })

    test('redirects to homepage when no referer', () => {
      mockRequest.headers.referer = undefined

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })

    test('sets cookie policy with analytics accepted', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      // Check cookies_policy cookie
      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      expect(policyCall).toBeDefined()
      expect(policyCall[1]).toBe(
        JSON.stringify({ analytics: true, preferencesSet: true })
      )
      expect(policyCall[2]).toMatchObject({
        path: '/',
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
    })

    test('sets cookies preferences set flag', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      // Check cookies_preferences_set cookie
      const prefsCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_preferences_set'
      )
      expect(prefsCall).toBeDefined()
      expect(prefsCall[1]).toBe('true')
    })

    test('sets banner message cookie for confirmation', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      // Check cookie_banner_message cookie
      const messageCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookie_banner_message'
      )
      expect(messageCall).toBeDefined()
      expect(messageCall[1]).toBe('accepted')
      expect(messageCall[2].ttl).toBe(5000) // 5 seconds
    })

    test('uses config for TTL value', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      // TTL should be set (actual value from config)
      expect(policyCall[2].ttl).toBeDefined()
      expect(typeof policyCall[2].ttl).toBe('number')
    })
  })

  describe('Reject handler', () => {
    test('redirects to referer page', () => {
      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/test-page')
    })

    test('redirects to homepage when no referer', () => {
      mockRequest.headers.referer = undefined

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/')
    })

    test('sets cookie policy with analytics rejected', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      // Check cookies_policy cookie
      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      expect(policyCall).toBeDefined()
      expect(policyCall[1]).toBe(
        JSON.stringify({ analytics: false, preferencesSet: true })
      )
      expect(policyCall[2]).toMatchObject({
        path: '/',
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
    })

    test('sets cookies preferences set flag', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      // Check cookies_preferences_set cookie
      const prefsCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_preferences_set'
      )
      expect(prefsCall).toBeDefined()
      expect(prefsCall[1]).toBe('true')
    })

    test('sets banner message cookie for rejection confirmation', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      // Check cookie_banner_message cookie
      const messageCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookie_banner_message'
      )
      expect(messageCall).toBeDefined()
      expect(messageCall[1]).toBe('rejected')
      expect(messageCall[2].ttl).toBe(5000) // 5 seconds
    })

    test('uses config for TTL value', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      // TTL should be set (actual value from config)
      expect(policyCall[2].ttl).toBeDefined()
      expect(typeof policyCall[2].ttl).toBe('number')
    })
  })

  describe('Cookie options', () => {
    test('accept handler sets secure flag from config', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      // isSecure should be set from config
      expect(policyCall[2].isSecure).toBeDefined()
      expect(typeof policyCall[2].isSecure).toBe('boolean')
    })

    test('reject handler sets secure flag from config', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      // isSecure should be set from config
      expect(policyCall[2].isSecure).toBeDefined()
      expect(typeof policyCall[2].isSecure).toBe('boolean')
    })

    test('sets all required cookie options for accept', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      expect(policyCall[2]).toMatchObject({
        path: '/',
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
      expect(policyCall[2].ttl).toBeDefined()
      expect(policyCall[2].isSecure).toBeDefined()
    })

    test('sets all required cookie options for reject', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      cookiesBannerController.handler.REJECT(mockRequest, mockH)

      const policyCall = mockResponse.state.mock.calls.find(
        (call) => call[0] === 'cookies_policy'
      )
      expect(policyCall[2]).toMatchObject({
        path: '/',
        isHttpOnly: true,
        isSameSite: 'Lax'
      })
      expect(policyCall[2].ttl).toBeDefined()
      expect(policyCall[2].isSecure).toBeDefined()
    })
  })

  describe('Return values', () => {
    test('accept handler returns redirect response', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      const result = cookiesBannerController.handler.ACCEPT(mockRequest, mockH)

      expect(result).toBe(mockResponse)
    })

    test('reject handler returns redirect response', () => {
      const mockResponse = {
        state: vi.fn().mockReturnThis()
      }
      mockH.redirect.mockReturnValue(mockResponse)

      const result = cookiesBannerController.handler.REJECT(mockRequest, mockH)

      expect(result).toBe(mockResponse)
    })
  })
})
