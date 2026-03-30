import { describe, test, expect, beforeEach, vi } from 'vitest'
import { flushNfmSection } from './flush-nfm.js'

// Mock the api-client
vi.mock('../../../common/helpers/api-client/index.js', () => ({
  apiRequest: vi.fn()
}))

import { apiRequest } from '../../../common/helpers/api-client/index.js'

describe('flushNfmSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should call apiRequest with correct endpoint and method', async () => {
    apiRequest.mockResolvedValue({ success: true })

    await flushNfmSection('REF-001', 'test-token')

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/project/flush-section', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      body: JSON.stringify({ referenceNumber: 'REF-001', section: 'nfm' })
    })
  })

  test('should handle missing access token by omitting Authorization header', async () => {
    apiRequest.mockResolvedValue({ success: true })

    await flushNfmSection('REF-001', null)

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/project/flush-section', {
      method: 'POST',
      headers: {},
      body: JSON.stringify({ referenceNumber: 'REF-001', section: 'nfm' })
    })
  })

  test('should handle missing access token (undefined) by omitting Authorization header', async () => {
    apiRequest.mockResolvedValue({ success: true })

    await flushNfmSection('REF-001', undefined)

    expect(apiRequest).toHaveBeenCalledWith('/api/v1/project/flush-section', {
      method: 'POST',
      headers: {},
      body: JSON.stringify({ referenceNumber: 'REF-001', section: 'nfm' })
    })
  })

  test('should return API response', async () => {
    const mockResponse = { success: true, message: 'Flushed successfully' }
    apiRequest.mockResolvedValue(mockResponse)

    const result = await flushNfmSection('REF-001', 'test-token')

    expect(result).toEqual(mockResponse)
  })

  test('should handle API errors by throwing', async () => {
    const error = new Error('Network error')
    apiRequest.mockRejectedValue(error)

    await expect(flushNfmSection('REF-001', 'test-token')).rejects.toThrow(
      'Network error'
    )
  })
})
