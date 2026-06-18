import { describe, test, expect, beforeEach, vi } from 'vitest'

const mockGetTraceId = vi.fn()

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: () => mockGetTraceId()
}))

describe('Logger options', () => {
  let loggerOptions

  beforeEach(async () => {
    mockGetTraceId.mockReset()
    vi.resetModules()
    const module = await import('./logger-options.js')
    loggerOptions = module.loggerOptions
  })

  test('has correct log level set', () => {
    expect(loggerOptions.level).toBeDefined()
  })

  test('has enabled flag defined', () => {
    expect(typeof loggerOptions.enabled).toBe('boolean')
  })

  test('does not use ignorePaths (ignoreFunc takes full control in hapi-pino v13)', () => {
    expect(loggerOptions.ignorePaths).toBeUndefined()
  })

  test('has ignoreFunc defined', () => {
    expect(typeof loggerOptions.ignoreFunc).toBe('function')
  })

  test('has redaction configured', () => {
    expect(loggerOptions.redact).toBeDefined()
    expect(loggerOptions.redact.remove).toBe(true)
  })

  test('redact paths is an array', () => {
    expect(Array.isArray(loggerOptions.redact.paths)).toBe(true)
  })

  test('has nesting enabled', () => {
    expect(loggerOptions.nesting).toBe(true)
  })

  describe('ignoreFunc — health paths and silent-drop suppression', () => {
    test('returns true for /health path', () => {
      const request = { path: '/health', app: {} }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
    })

    test('returns true for /health-detailed path', () => {
      const request = { path: '/health-detailed', app: {} }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
    })

    test('returns false for a non-health path', () => {
      const request = { path: '/projects', app: {} }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
    })

    test('returns true when request.app.silentDrop is true', () => {
      const request = { path: '/some-path', app: { silentDrop: true } }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
    })

    test('returns false when request.app.silentDrop is false', () => {
      const request = { path: '/some-path', app: { silentDrop: false } }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
    })

    test('returns false when silentDrop is absent from request.app', () => {
      const request = { path: '/some-path', app: {} }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
    })

    test('returns false when request.app is undefined', () => {
      const request = { path: '/some-path', app: undefined }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
    })

    test('ignoreFunc is a function', () => {
      expect(typeof loggerOptions.ignoreFunc).toBe('function')
    })
  })

  describe('mixin', () => {
    test('returns empty object when no trace id', () => {
      mockGetTraceId.mockReturnValue(null)

      const result = loggerOptions.mixin()

      expect(result).toEqual({})
    })

    test('includes trace id when available', () => {
      mockGetTraceId.mockReturnValue('test-trace-123')

      const result = loggerOptions.mixin()

      expect(result).toEqual({
        trace: { id: 'test-trace-123' }
      })
    })
  })
})
