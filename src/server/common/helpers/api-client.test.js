import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock fetch and AbortController before importing
global.fetch = vi.fn()
global.AbortController = class {
  constructor() {
    this.signal = {}
    this.abort = vi.fn()
  }
}

const { apiRequest } = await import('./api-client.js')

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllTimers()
  })

  test('makes successful API request', async () => {
    const mockData = { user: { id: 1 } }
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockData
    })

    const result = await apiRequest('/test', { method: 'GET' })

    expect(result).toEqual({
      success: true,
      status: 200,
      data: mockData
    })
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })

  test('handles API error response', async () => {
    const mockError = { error: 'Invalid credentials' }
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => mockError
    })

    const result = await apiRequest('/test', { method: 'POST' })

    expect(result).toEqual({
      success: false,
      status: 401,
      error: mockError
    })
  })

  test('includes custom headers', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    })

    await apiRequest('/test', {
      headers: {
        Authorization: 'Bearer token123'
      }
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer token123'
        }
      })
    )
  })

  test('throws on network error', async () => {
    global.fetch.mockRejectedValue(new Error('Network error'))

    await expect(apiRequest('/test')).rejects.toThrow('Network error')
  })

  test('sets up abort controller for timeout', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    })

    await apiRequest('/test')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        signal: expect.any(Object)
      })
    )
  })

  test('clears timeout on successful response', async () => {
    vi.useFakeTimers()

    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: 'test' })
    })

    await apiRequest('/test')

    // Timeout should be cleared, so advancing time shouldn't cause issues
    vi.advanceTimersByTime(20000)

    vi.useRealTimers()
  })

  test('clears timeout on error', async () => {
    vi.useFakeTimers()

    global.fetch.mockRejectedValue(new Error('Connection failed'))

    await expect(apiRequest('/test')).rejects.toThrow('Connection failed')

    // Timeout should be cleared even on error
    vi.advanceTimersByTime(20000)

    vi.useRealTimers()
  })

  test('handles empty options parameter', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    })

    const result = await apiRequest('/test')

    expect(result.success).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: {
          'Content-Type': 'application/json'
        }
      })
    )
  })

  test('constructs correct URL with base URL', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    })

    await apiRequest('/api/v1/test')

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/http:\/\/localhost:3001\/api\/v1\/test/),
      expect.any(Object)
    )
  })

  test('handles different HTTP methods', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ created: true })
    })

    await apiRequest('/create', {
      method: 'POST',
      body: JSON.stringify({ name: 'test' })
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'test' })
      })
    )
  })

  test('handles 404 not found', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    })

    const result = await apiRequest('/nonexistent')

    expect(result).toEqual({
      success: false,
      status: 404,
      error: { error: 'Not found' }
    })
  })

  test('handles 500 server error', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' })
    })

    const result = await apiRequest('/error')

    expect(result).toEqual({
      success: false,
      status: 500,
      error: { error: 'Internal server error' }
    })
  })

  test('handles network errors', async () => {
    global.fetch.mockRejectedValue(new Error('Network failure'))

    await expect(apiRequest('/test')).rejects.toThrow('Network failure')
  })

  test('handles empty response body', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => null
    })

    const result = await apiRequest('/delete', { method: 'DELETE' })

    expect(result).toEqual({
      success: true,
      status: 204,
      data: null
    })
  })

  test('handles malformed JSON response', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError('Unexpected token')
      }
    })

    await expect(apiRequest('/test')).rejects.toThrow('Unexpected token')
  })

  test('passes custom headers', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    })

    await apiRequest('/test', {
      headers: {
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'value'
      }
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token123',
          'X-Custom-Header': 'value'
        })
      })
    )
  })

  test('handles PUT requests', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ updated: true })
    })

    await apiRequest('/update', {
      method: 'PUT',
      body: JSON.stringify({ name: 'updated' })
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PUT'
      })
    )
  })

  test('handles PATCH requests', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ patched: true })
    })

    await apiRequest('/patch', {
      method: 'PATCH',
      body: JSON.stringify({ field: 'value' })
    })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'PATCH'
      })
    )
  })

  test('handles 401 unauthorized', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ errorCode: 'AUTH_INVALID_CREDENTIALS' })
    })

    const result = await apiRequest('/secure')

    expect(result).toEqual({
      success: false,
      status: 401,
      error: { errorCode: 'AUTH_INVALID_CREDENTIALS' }
    })
  })

  test('handles 403 forbidden', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: 'Forbidden' })
    })

    const result = await apiRequest('/admin')

    expect(result).toEqual({
      success: false,
      status: 403,
      error: { error: 'Forbidden' }
    })
  })

  test('handles 404 not found', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    })

    const result = await apiRequest('/missing')

    expect(result).toEqual({
      success: false,
      status: 404,
      error: { error: 'Not found' }
    })
  })

  test('handles 503 service unavailable', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service unavailable' })
    })

    const result = await apiRequest('/test')

    expect(result).toEqual({
      success: false,
      status: 503,
      error: { error: 'Service unavailable' }
    })
  })
})
