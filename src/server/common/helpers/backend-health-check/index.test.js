import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkBackendHealth, pingBackendHealth } from './index.js'

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      const configValues = {
        'backendApi.url': 'http://localhost:3001',
        'backendApi.timeout': 10000,
        'backendApi.healthCheckRetries': 3,
        'backendApi.healthCheckInterval': 2000
      }
      return configValues[key]
    })
  }
}))

vi.mock('../logging/logger.js', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}))

describe('Backend health check', () => {
  let fetchSpy

  beforeEach(() => {
    vi.useFakeTimers()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('Should return true when backend is healthy', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      status: 200
    })

    const promise = checkBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(true)
    expect(fetchSpy).toHaveBeenCalledWith('http://localhost:3001/health', {
      signal: expect.any(AbortSignal)
    })
  })

  test('Should retry when backend is not responding', async () => {
    fetchSpy.mockRejectedValue(new Error('Connection refused'))

    const promise = checkBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  test('Should return false after all retries fail', async () => {
    fetchSpy.mockRejectedValue(new Error('Network error'))

    const promise = checkBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(false)
  })

  test('Should return true if backend becomes healthy after retry', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('Connection refused'))
      .mockResolvedValueOnce({
        ok: true,
        status: 200
      })

    const promise = checkBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(true)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })

  test('Should handle timeout correctly', async () => {
    fetchSpy.mockImplementation(() => {
      return new Promise((resolve, reject) => {
        // Simulate AbortError when signal is aborted
        const abortError = new Error('The operation was aborted')
        abortError.name = 'AbortError'
        reject(abortError)
      })
    })

    const promise = checkBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  test('Should return false when backend returns error status', async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      status: 500
    })

    const promise = checkBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result).toBe(false)
    expect(fetchSpy).toHaveBeenCalledTimes(3)
  })

  test('Should wait correct interval between retries', async () => {
    fetchSpy.mockRejectedValue(new Error('Connection refused'))

    const promise = checkBackendHealth()

    expect(fetchSpy).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(2000)
    expect(fetchSpy).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(2000)
    expect(fetchSpy).toHaveBeenCalledTimes(3)

    await promise
  })
})

describe('pingBackendHealth', () => {
  let fetchSpy

  beforeEach(() => {
    vi.useFakeTimers()
    fetchSpy = vi.spyOn(globalThis, 'fetch')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  test('Should return healthy result when backend responds ok', async () => {
    fetchSpy.mockResolvedValue({ ok: true, status: 200 })

    const promise = pingBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.healthy).toBe(true)
    expect(result.status).toBe('connected')
    expect(result.responseTime).toBeTypeOf('number')
  })

  test('Should return unhealthy result when backend returns error status', async () => {
    fetchSpy.mockResolvedValue({ ok: false, status: 503 })

    const promise = pingBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.healthy).toBe(false)
    expect(result.status).toBe('unhealthy')
  })

  test('Should return unhealthy result when fetch throws', async () => {
    fetchSpy.mockRejectedValue(new Error('Connection refused'))

    const promise = pingBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.healthy).toBe(false)
    expect(result.status).toBe('error')
    expect(result.error).toBe('Connection refused')
  })

  test('Should return error status on timeout', async () => {
    const abortError = new Error('The operation was aborted')
    abortError.name = 'AbortError'
    fetchSpy.mockRejectedValue(abortError)

    const promise = pingBackendHealth()
    await vi.runAllTimersAsync()
    const result = await promise

    expect(result.healthy).toBe(false)
    expect(result.status).toBe('error')
    expect(result.error).toBe('Request timeout')
  })

  test('Should only make one attempt (no retries)', async () => {
    fetchSpy.mockRejectedValue(new Error('Connection refused'))

    const promise = pingBackendHealth()
    await vi.runAllTimersAsync()
    await promise

    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
