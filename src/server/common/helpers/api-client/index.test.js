import { describe, test, expect, beforeEach, vi } from 'vitest'

globalThis.fetch = vi.fn()
globalThis.AbortController = class {
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

const { apiRequest } = await import('./index.js')

describe('apiRequest', () => {
  beforeEach(() => vi.clearAllMocks())

  test('successful request returns data', async () => {
    globalThis.fetch.mockResolvedValue(
      mockResponse({ data: { user: { id: 1 } } })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ user: { id: 1 } })
  })

  test('error response returns errors array', async () => {
    globalThis.fetch.mockResolvedValue(
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
    globalThis.fetch.mockResolvedValue(
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
    globalThis.fetch.mockResolvedValue(
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
    globalThis.fetch.mockResolvedValue(
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
    globalThis.fetch.mockRejectedValue(new Error('fetch failed'))

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.errors[0].errorCode).toBe('NETWORK_ERROR')
  })

  test('merges custom headers', async () => {
    globalThis.fetch.mockResolvedValue(mockResponse({}))

    await apiRequest('/test', {
      headers: { Authorization: 'Bearer xyz' },
      retries: 0
    })

    expect(globalThis.fetch).toHaveBeenCalledWith(
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
    globalThis.fetch
      .mockResolvedValueOnce(
        mockResponse({ ok: false, status: 503, data: { errors: [] } })
      )
      .mockResolvedValueOnce(mockResponse({ data: { ok: true } }))

    const result = await apiRequest('/test', { retries: 1 })

    expect(result.success).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  test('retries on network error then succeeds', async () => {
    globalThis.fetch
      .mockRejectedValueOnce(new TypeError('network'))
      .mockResolvedValueOnce(mockResponse({ data: { ok: true } }))

    const result = await apiRequest('/test', { retries: 1 })

    expect(result.success).toBe(true)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  test('exhausts retries and returns last error', async () => {
    globalThis.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 503,
        data: { errors: [{ errorCode: 'SERVICE_UNAVAILABLE' }] }
      })
    )

    const result = await apiRequest('/test', { retries: 2 })

    expect(result.success).toBe(false)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  test('handles non-JSON response content type', async () => {
    globalThis.fetch.mockResolvedValue({
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
    globalThis.fetch.mockRejectedValue(networkError)

    const result = await apiRequest('/test', { retries: 2 })

    expect(result.success).toBe(false)
    expect(result.status).toBe(0)
    expect(result.errors[0].errorCode).toBe('NETWORK_ERROR')
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  test('returns specific error for 401 with errorCode in response body', async () => {
    globalThis.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 401,
        data: { errorCode: 'AUTH_TOKEN_EXPIRED' }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.status).toBe(401)
    expect(result.errors).toEqual([{ errorCode: 'AUTH_TOKEN_EXPIRED' }])
    expect(result.validationErrors).toBeNull()
  })

  test('falls back to last response when retries exhausted with non-retryable error', async () => {
    globalThis.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 400,
        data: { errors: [{ errorCode: 'BAD_REQUEST' }] }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([{ errorCode: 'BAD_REQUEST' }])
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('returns lastResponse when retries exhausted with retryable error after non-retryable response', async () => {
    // First call: non-retryable 400 → immediately returns
    globalThis.fetch.mockResolvedValue(
      mockResponse({
        ok: false,
        status: 400,
        data: { errors: [{ errorCode: 'VALIDATION_ERROR' }] }
      })
    )

    const result = await apiRequest('/test', { retries: 0 })

    expect(result.success).toBe(false)
    expect(result.errors).toEqual([{ errorCode: 'VALIDATION_ERROR' }])
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })

  test('returns network error when retries exhausted with only errors (no lastResponse)', async () => {
    const error = new TypeError('network failure')
    globalThis.fetch.mockRejectedValueOnce(error).mockRejectedValueOnce(error)

    const result = await apiRequest('/test', { retries: 1 })

    expect(result.success).toBe(false)
    expect(result.status).toBe(0)
    expect(result.errors[0].errorCode).toBe('NETWORK_ERROR')
  })
})
