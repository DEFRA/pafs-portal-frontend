import { describe, test, expect, beforeEach, vi } from 'vitest'
import { noCacheHeaders } from './no-cache-headers.js'

describe('noCacheHeaders', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockH = {
      continue: Symbol('continue')
    }
  })

  describe('excluded paths — no header added', () => {
    test('should skip /public asset paths', () => {
      mockRequest = {
        path: '/public/assets/application.js',
        response: { isBoom: false, header: vi.fn() }
      }

      const result = noCacheHeaders(mockRequest, mockH)

      expect(mockRequest.response.header).not.toHaveBeenCalled()
      expect(result).toBe(mockH.continue)
    })

    test('should skip /public/assets/images paths', () => {
      mockRequest = {
        path: '/public/assets/images/govuk-crest.svg',
        response: { isBoom: false, header: vi.fn() }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(mockRequest.response.header).not.toHaveBeenCalled()
    })

    test('should skip /favicon.ico', () => {
      mockRequest = {
        path: '/favicon.ico',
        response: { isBoom: false, header: vi.fn() }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(mockRequest.response.header).not.toHaveBeenCalled()
    })

    test('should skip /health', () => {
      mockRequest = {
        path: '/health',
        response: { isBoom: false, header: vi.fn() }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(mockRequest.response.header).not.toHaveBeenCalled()
    })

    test('should skip /downloads/poll', () => {
      mockRequest = {
        path: '/downloads/poll',
        response: { isBoom: false, header: vi.fn() }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(mockRequest.response.header).not.toHaveBeenCalled()
    })

    test('should skip /admin/downloads/poll', () => {
      mockRequest = {
        path: '/admin/downloads/poll',
        response: { isBoom: false, header: vi.fn() }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(mockRequest.response.header).not.toHaveBeenCalled()
    })
  })

  describe('HTML page responses — Cache-Control: no-store added', () => {
    test('should add Cache-Control: no-store to a normal view response', () => {
      const headerFn = vi.fn()
      mockRequest = {
        path: '/admin/submissions',
        response: { isBoom: false, header: headerFn }
      }

      const result = noCacheHeaders(mockRequest, mockH)

      expect(headerFn).toHaveBeenCalledWith('Cache-Control', 'no-store')
      expect(result).toBe(mockH.continue)
    })

    test('should add Cache-Control: no-store to the home page', () => {
      const headerFn = vi.fn()
      mockRequest = {
        path: '/',
        response: { isBoom: false, header: headerFn }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(headerFn).toHaveBeenCalledWith('Cache-Control', 'no-store')
    })

    test('should add Cache-Control: no-store to a project route', () => {
      const headerFn = vi.fn()
      mockRequest = {
        path: '/project/THC501E-000A-017A',
        response: { isBoom: false, header: headerFn }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(headerFn).toHaveBeenCalledWith('Cache-Control', 'no-store')
    })

    test('should add Cache-Control: no-store to redirect responses', () => {
      const headerFn = vi.fn()
      mockRequest = {
        path: '/login',
        response: { isBoom: false, header: headerFn }
      }

      noCacheHeaders(mockRequest, mockH)

      expect(headerFn).toHaveBeenCalledWith('Cache-Control', 'no-store')
    })
  })

  describe('Boom error responses — output headers set', () => {
    test('should set Cache-Control: no-store on Boom error output headers', () => {
      const boomResponse = {
        isBoom: true,
        output: { headers: {} }
      }
      mockRequest = {
        path: '/some-page',
        response: boomResponse
      }

      const result = noCacheHeaders(mockRequest, mockH)

      expect(boomResponse.output.headers['Cache-Control']).toBe('no-store')
      expect(result).toBe(mockH.continue)
    })

    test('should not call .header() on a Boom error response', () => {
      const headerFn = vi.fn()
      const boomResponse = {
        isBoom: true,
        header: headerFn,
        output: { headers: {} }
      }
      mockRequest = {
        path: '/some-page',
        response: boomResponse
      }

      noCacheHeaders(mockRequest, mockH)

      expect(headerFn).not.toHaveBeenCalled()
    })

    test('should not set Boom output headers for static asset Boom errors', () => {
      const boomResponse = {
        isBoom: true,
        output: { headers: {} }
      }
      mockRequest = {
        path: '/public/missing-asset.js',
        response: boomResponse
      }

      noCacheHeaders(mockRequest, mockH)

      expect(boomResponse.output.headers['Cache-Control']).toBeUndefined()
    })
  })

  describe('return value', () => {
    test('always returns h.continue', () => {
      mockRequest = {
        path: '/any-page',
        response: { isBoom: false, header: vi.fn() }
      }

      expect(noCacheHeaders(mockRequest, mockH)).toBe(mockH.continue)
    })
  })
})
