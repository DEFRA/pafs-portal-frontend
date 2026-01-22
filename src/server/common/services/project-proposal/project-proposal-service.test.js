import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkProjectNameExists,
  getProjectProposalOverview
} from './project-proposal-service.js'
import { apiRequest } from '../../helpers/api-client/index.js'

// Mock the api-client module
vi.mock('../../helpers/api-client/index.js', () => ({
  apiRequest: vi.fn()
}))

describe('project-proposal-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkProjectNameExists', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    test('Should include project name in request body', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          body: JSON.stringify({ name: 'Test_Project' })
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project', 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project', null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project', '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response when project exists', async () => {
      const mockResponse = { data: { exists: true } }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await checkProjectNameExists('Existing_Project', 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should return API response when project does not exist', async () => {
      const mockResponse = { data: { exists: false } }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await checkProjectNameExists('New_Project', 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)

      await expect(
        checkProjectNameExists('Test_Project', 'token')
      ).rejects.toThrow('API Error')
    })

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)

      await expect(
        checkProjectNameExists('Test_Project', 'token')
      ).rejects.toThrow('Network connection failed')
    })

    test('Should handle project names with special characters', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test-Project_123', 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/check-name',
        expect.objectContaining({
          body: JSON.stringify({ name: 'Test-Project_123' })
        })
      )
    })

    test('Should stringify the request body correctly', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })

      await checkProjectNameExists('Test_Project', 'token')

      const callArgs = apiRequest.mock.calls[0][1]
      expect(typeof callArgs.body).toBe('string')
      expect(JSON.parse(callArgs.body)).toEqual({ name: 'Test_Project' })
    })
  })

  describe('getProjectProposalOverview', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/proposal-overview/REF123',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123', 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/proposal-overview/REF123',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project-proposal/proposal-overview/REF123',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response', async () => {
      const mockResponse = { data: { id: '123', referenceNumber: 'REF123' } }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await getProjectProposalOverview('REF123', 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)

      await expect(
        getProjectProposalOverview('REF123', 'token')
      ).rejects.toThrow('API Error')
    })
  })
})
