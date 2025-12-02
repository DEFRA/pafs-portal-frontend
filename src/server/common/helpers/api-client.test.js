import { describe, test, expect, beforeEach, vi } from 'vitest'

global.fetch = vi.fn()
global.AbortController = class {
  constructor() {
    this.signal = {}
    this.abort = vi.fn()
  }
}

function mockResponse(options) {
  return {
    ok: options.ok ?? true,
    status: options.status ?? 200,
    headers: { get: () => options.contentType ?? 'application/json' },
    json: async () => options.data ?? {}
  }
}

const { apiRequest } = await import('./api-client.js')

describe('apiRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  test('successful request returns data', async () => {
    global.fetch.mockResolvedValue(mockResponse({ data: { user: { id: 1 } } }))

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ user: { id: 1 } })
  })

  test('error response returns errors array', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 401,
        data: { errors: [{ errorCode: 'AUTH_INVALID_CREDENTIALS' }] }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([{ errorCode: 'AUTH_INVALID_CREDENTIALS' }])
    expect(result.validationErrors).toBeNull()
  })

  test('validation error response returns validationErrors array', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 400,
        data: {
          validationErrors: [
            { field: 'email', errorCode: 'VALIDATION_EMAIL_REQUIRED' }
          ]
        }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.validationErrors).toEqual([
      { field: 'email', errorCode: 'VALIDATION_EMAIL_REQUIRED' }
    ])
    expect(result.errors).toBeNull()
  })

  test('preserves warning and support codes', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 401,
        data: {
          errors: [
            {
              errorCode: 'AUTH_INVALID_CREDENTIALS',
              warningCode: 'AUTH_LAST_ATTEMPT',
              supportCode: 'CONTACT_SUPPORT'
            }
          ]
        }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.errors[0].warningCode).toBe('AUTH_LAST_ATTEMPT')
    expect(result.errors[0].supportCode).toBe('CONTACT_SUPPORT')
  })

  test('missing both errors returns UNKNOWN_ERROR', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 400,
        data: { message: 'bad request' }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.errors).toEqual([{ errorCode: 'UNKNOWN_ERROR' }])
  })

  test('network error returns NETWORK_ERROR', async () => {
    global.fetch.mockRejectedValue(new Error('fetch failed'))

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.errors[0].errorCode).toBe('NETWORK_ERROR')
  })

  test('merges custom headers', async () => {
    global.fetch.mockResolvedValue(mockResponse({}))

    await apiRequest('/test', {
      headers: { Authorization: 'Bearer xyz' },
      retries: 0
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer xyz'
        }
      })
    )
  })

  test('retries on 503 then succeeds', async () => {
    global.fetch
      .mockResolvedValueOnce(
        mockResponse({ ok: false, status: 503, data: { errors: [] } })
      )
      .mockResolvedValueOnce(mockResponse({ data: { ok: true } }))

    const result = await apiRequest('/test', { retries: 1 })

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('retries on network error then succeeds', async () => {
    global.fetch
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(mockResponse({ data: { ok: true } }))

    const result = await apiRequest('/test', { retries: 1 })

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  test('exhausts retries and returns last error', async () => {
    global.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 503,
        data: { errors: [{ errorCode: 'SERVICE_UNAVAILABLE' }] }
      })
    )

    const result = await apiRequest('/test', { retries: 2 })

    expect(result.success).toBe(false)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  test('handles non-JSON response content type', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => 'text/html' },
      json: vi.fn()
    })

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(true)
    expect(result.data).toBeNull()
  })

  test('exhausts retries on network error and returns network error response', async () => {
    const networkError = new TypeError('Failed to fetch')
    global.fetch.mockRejectedValue(networkError)

    const result = await apiRequest('/test', { retries: 2 })

    expect(result.success).toBe(false)
    expect(result.status).toBe(0)
    expect(result.errors[0].errorCode).toBe('NETWORK_ERROR')
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})
