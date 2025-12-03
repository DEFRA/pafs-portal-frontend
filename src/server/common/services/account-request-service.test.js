import { describe, test, expect, vi, beforeEach } from 'vitest'

// Mock api-client before importing
vi.mock('../helpers/api-client.js', () => ({
  apiRequest: vi.fn()
}))

const { submitAccountRequest } = await import('./account-request-service.js')
const { apiRequest } = await import('../helpers/api-client.js')

describe('#account-request-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('submitAccountRequest', () => {
    test('Should call apiRequest with correct endpoint, method, and body', async () => {
      const mockPayload = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com'
        },
        areas: [
          { area_id: 1, primary: true },
          { area_id: 2, primary: false }
        ]
      }

      const mockResponse = {
        success: true,
        status: 200,
        data: { id: 123 }
      }

      apiRequest.mockResolvedValue(mockResponse)

      const result = await submitAccountRequest(mockPayload)

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/account-request', {
        method: 'POST',
        body: JSON.stringify(mockPayload)
      })
      expect(result).toEqual(mockResponse)
    })

    test('Should return successful response', async () => {
      const mockPayload = {
        user: {
          firstName: 'Jane',
          lastName: 'Smith',
          emailAddress: 'jane@example.com'
        },
        areas: [{ area_id: 1, primary: true }]
      }

      const mockData = {
        id: 456,
        status: 'pending'
      }

      apiRequest.mockResolvedValue({
        success: true,
        status: 201,
        data: mockData
      })

      const result = await submitAccountRequest(mockPayload)

      expect(result.success).toBe(true)
      expect(result.status).toBe(201)
      expect(result.data).toEqual(mockData)
    })

    test('Should return error response when API fails', async () => {
      const mockPayload = {
        user: {
          firstName: 'Test',
          lastName: 'User'
        },
        areas: []
      }

      const mockError = {
        success: false,
        status: 400,
        validationErrors: [
          { field: 'emailAddress', message: 'Email is required' }
        ]
      }

      apiRequest.mockResolvedValue(mockError)

      const result = await submitAccountRequest(mockPayload)

      expect(result.success).toBe(false)
      expect(result.status).toBe(400)
      expect(result.validationErrors).toEqual([
        { field: 'emailAddress', message: 'Email is required' }
      ])
    })

    test('Should handle API request errors', async () => {
      const mockPayload = {
        user: { firstName: 'Test' },
        areas: []
      }

      const mockError = new Error('Network error')
      apiRequest.mockRejectedValue(mockError)

      await expect(submitAccountRequest(mockPayload)).rejects.toThrow(
        'Network error'
      )
    })

    test('Should stringify payload correctly', async () => {
      const mockPayload = {
        user: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'EA'
        },
        areas: [
          { area_id: 1, primary: true },
          { area_id: 2, primary: false }
        ]
      }

      apiRequest.mockResolvedValue({
        success: true,
        status: 200,
        data: {}
      })

      await submitAccountRequest(mockPayload)

      const callArgs = apiRequest.mock.calls[0]
      expect(callArgs[0]).toBe('/api/v1/account-request')
      expect(callArgs[1].method).toBe('POST')
      expect(callArgs[1].body).toBe(JSON.stringify(mockPayload))
      expect(() => JSON.parse(callArgs[1].body)).not.toThrow()
    })

    test('Should handle empty payload', async () => {
      const mockPayload = {
        user: {},
        areas: []
      }

      apiRequest.mockResolvedValue({
        success: true,
        status: 200,
        data: {}
      })

      const result = await submitAccountRequest(mockPayload)

      expect(apiRequest).toHaveBeenCalledWith('/api/v1/account-request', {
        method: 'POST',
        body: JSON.stringify(mockPayload)
      })
      expect(result.success).toBe(true)
    })
  })
})
