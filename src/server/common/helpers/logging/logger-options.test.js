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

  test('ignores health check path', () => {
    expect(loggerOptions.ignorePaths).toContain('/health')
  })

  test('has redaction configured', () => {
    expect(loggerOptions.redact).toBeDefined()
    expect(loggerOptions.redact.remove).toBe(true)
  })

  test('has nesting enabled', () => {
    expect(loggerOptions.nesting).toBe(true)
  })

  test('mixin returns empty object when no trace id', () => {
    mockGetTraceId.mockReturnValue(null)

    const result = loggerOptions.mixin()

    expect(result).toEqual({})
  })

  test('mixin includes trace id when available', () => {
    mockGetTraceId.mockReturnValue('test-trace-123')

    const result = loggerOptions.mixin()

    expect(result).toEqual({
      trace: { id: 'test-trace-123' }
    })
  })
})
