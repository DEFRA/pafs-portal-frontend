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

  test('ignores health check path', () => {
    expect(loggerOptions.ignorePaths).toContain('/health')
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

  describe('ignoreFunc — silent-drop suppression', () => {
    test('returns true when request.app.silentDrop is true', () => {
      const request = { app: { silentDrop: true } }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
    })

    test('returns false when request.app.silentDrop is false', () => {
      const request = { app: { silentDrop: false } }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
    })

    test('returns false when silentDrop is absent from request.app', () => {
      const request = { app: {} }
      expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
    })

    test('returns false when request.app is undefined', () => {
      const request = { app: undefined }
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
