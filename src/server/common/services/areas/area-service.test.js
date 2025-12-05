import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock api-client before importing
vi.mock('../../helpers/api-client.js', () => ({
  apiRequest: vi.fn()
}))

const { getAreas } = await import('./area-service.js')
const { apiRequest } = await import('../../helpers/api-client.js')

describe('#area-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getAreas', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      const mockResponse = {
        success: true,
        data: [{ id: 1, name: 'Area 1' }]
      }

      apiRequest.mockResolvedValue(mockResponse)

      const result = await getAreas()

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/areas', {
        method: 'GET'
      })
      expect(result).toEqual(mockResponse)
    })

    test('Should return successful response', async () => {
      const mockData = [
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 2, name: 'Anglian', area_type: 'EA Area' }
      ]

      apiRequest.mockResolvedValue({
        success: true,
        data: mockData
      })

      const result = await getAreas()

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockData)
    })

    test('Should return error response when API fails', async () => {
      const mockError = {
        success: false,
        error: 'API Error',
        status: 500
      }

      apiRequest.mockResolvedValue(mockError)

      const result = await getAreas()

      expect(result.success).toBe(false)
      expect(result.error).toBe('API Error')
    })

    test('Should handle API request errors', async () => {
      const mockError = new Error('Network error')
      apiRequest.mockRejectedValue(mockError)

      await expect(getAreas()).rejects.toThrow('Network error')
    })
  })
})
