import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkProjectNameExists,
  getProjectProposalOverview,
  upsertProjectProposal,
  getProjectBenefitAreaDownloadUrl,
  deleteProject
} from './project-service.js'
import { apiRequest } from '../../helpers/api-client/index.js'

vi.mock('../../helpers/api-client/index.js', () => ({
  apiRequest: vi.fn()
}))

describe('project-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('checkProjectNameExists', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload, 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    test('Should include project name in request body', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload, 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          body: JSON.stringify(payload)
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload, 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload, null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload, '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response when project exists', async () => {
      const mockResponse = { data: { exists: true } }
      apiRequest.mockResolvedValue(mockResponse)
      const payload = { name: 'Existing_Project' }

      const result = await checkProjectNameExists(payload, 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should return API response when project does not exist', async () => {
      const mockResponse = { data: { exists: false } }
      apiRequest.mockResolvedValue(mockResponse)
      const payload = { name: 'New_Project' }

      const result = await checkProjectNameExists(payload, 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)
      const payload = { name: 'Test_Project' }

      await expect(checkProjectNameExists(payload, 'token')).rejects.toThrow(
        'API Error'
      )
    })

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)
      const payload = { name: 'Test_Project' }

      await expect(checkProjectNameExists(payload, 'token')).rejects.toThrow(
        'Network connection failed'
      )
    })

    test('Should handle project names with special characters', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test-Project_123' }

      await checkProjectNameExists(payload, 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          body: JSON.stringify(payload)
        })
      )
    })

    test('Should stringify the request body correctly', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project' }

      await checkProjectNameExists(payload, 'token')

      const callArgs = apiRequest.mock.calls[0][1]
      expect(typeof callArgs.body).toBe('string')
      expect(JSON.parse(callArgs.body)).toEqual(payload)
    })

    test('Should handle payload with referenceNumber', async () => {
      apiRequest.mockResolvedValue({ data: { exists: false } })
      const payload = { name: 'Test_Project', referenceNumber: 'REF123' }

      await checkProjectNameExists(payload, 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/check-name',
        expect.objectContaining({
          body: JSON.stringify(payload)
        })
      )
    })
  })

  describe('getProjectProposalOverview', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123', 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123',
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
        '/api/v1/project/REF123',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123', null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({ data: {} })

      await getProjectProposalOverview('REF123', '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response', async () => {
      const mockResponse = {
        data: { referenceNumber: 'REF123', name: 'Test Project' }
      }
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

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)

      await expect(
        getProjectProposalOverview('REF123', 'token')
      ).rejects.toThrow('Network connection failed')
    })
  })

  describe('upsertProjectProposal', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: { referenceNumber: 'REF123' } })
      const proposalData = { level: 'initial', payload: { name: 'Test' } }

      await upsertProjectProposal(proposalData, 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    test('Should include proposal data in request body', async () => {
      apiRequest.mockResolvedValue({ data: { referenceNumber: 'REF123' } })
      const proposalData = {
        level: 'initial',
        payload: { name: 'Test Project' }
      }

      await upsertProjectProposal(proposalData, 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          body: JSON.stringify(proposalData)
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: {} })
      const proposalData = { level: 'initial', payload: {} }

      await upsertProjectProposal(proposalData, 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({ data: {} })
      const proposalData = { level: 'initial', payload: {} }

      await upsertProjectProposal(proposalData)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({ data: {} })
      const proposalData = { level: 'initial', payload: {} }

      await upsertProjectProposal(proposalData, null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({ data: {} })
      const proposalData = { level: 'initial', payload: {} }

      await upsertProjectProposal(proposalData, '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response with reference number', async () => {
      const mockResponse = {
        data: { referenceNumber: 'REF123', success: true }
      }
      apiRequest.mockResolvedValue(mockResponse)
      const proposalData = { level: 'initial', payload: { name: 'Test' } }

      const result = await upsertProjectProposal(proposalData, 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)
      const proposalData = { level: 'initial', payload: {} }

      await expect(
        upsertProjectProposal(proposalData, 'token')
      ).rejects.toThrow('API Error')
    })

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)
      const proposalData = { level: 'initial', payload: {} }

      await expect(
        upsertProjectProposal(proposalData, 'token')
      ).rejects.toThrow('Network connection failed')
    })

    test('Should stringify the request body correctly', async () => {
      apiRequest.mockResolvedValue({ data: {} })
      const proposalData = {
        level: 'project_name',
        payload: { name: 'Test', referenceNumber: 'REF123' }
      }

      await upsertProjectProposal(proposalData, 'token')

      const callArgs = apiRequest.mock.calls[0][1]
      expect(typeof callArgs.body).toBe('string')
      expect(JSON.parse(callArgs.body)).toEqual(proposalData)
    })

    test('Should handle complex proposal data', async () => {
      apiRequest.mockResolvedValue({ data: { referenceNumber: 'REF123' } })
      const proposalData = {
        level: 'financial_start_year',
        payload: {
          name: 'Complex Project',
          referenceNumber: 'REF123',
          projectType: 'new',
          startYear: 2024
        }
      }

      await upsertProjectProposal(proposalData, 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/upsert',
        expect.objectContaining({
          body: JSON.stringify(proposalData)
        })
      )
    })
  })

  describe('getProjectBenefitAreaDownloadUrl', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({
        data: { url: 'https://example.com/file' }
      })

      await getProjectBenefitAreaDownloadUrl('REF123', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file/download',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({
        data: { url: 'https://example.com/file' }
      })

      await getProjectBenefitAreaDownloadUrl('REF456', 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF456/benefit-area-file/download',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({
        data: { url: 'https://example.com/file' }
      })

      await getProjectBenefitAreaDownloadUrl('REF123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file/download',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({
        data: { url: 'https://example.com/file' }
      })

      await getProjectBenefitAreaDownloadUrl('REF123', null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file/download',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({
        data: { url: 'https://example.com/file' }
      })

      await getProjectBenefitAreaDownloadUrl('REF123', '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file/download',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response with download URL', async () => {
      const mockResponse = {
        data: { url: 'https://example.com/download/benefit-area.zip' }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await getProjectBenefitAreaDownloadUrl('REF123', 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)

      await expect(
        getProjectBenefitAreaDownloadUrl('REF123', 'token')
      ).rejects.toThrow('API Error')
    })

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)

      await expect(
        getProjectBenefitAreaDownloadUrl('REF123', 'token')
      ).rejects.toThrow('Network connection failed')
    })

    test('Should handle different reference number formats', async () => {
      apiRequest.mockResolvedValue({
        data: { url: 'https://example.com/file' }
      })

      await getProjectBenefitAreaDownloadUrl('PROJ-2024-001', 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/PROJ-2024-001/benefit-area-file/download',
        expect.objectContaining({
          method: 'GET'
        })
      )
    })
  })

  describe('deleteProject', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await deleteProject('REF123', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await deleteProject('REF456', 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF456/benefit-area-file',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await deleteProject('REF123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await deleteProject('REF123', null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await deleteProject('REF123', '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/benefit-area-file',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response', async () => {
      const mockResponse = { data: { success: true, message: 'Deleted' } }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await deleteProject('REF123', 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)

      await expect(deleteProject('REF123', 'token')).rejects.toThrow(
        'API Error'
      )
    })

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)

      await expect(deleteProject('REF123', 'token')).rejects.toThrow(
        'Network connection failed'
      )
    })

    test('Should handle 404 not found errors', async () => {
      const notFoundError = new Error('File not found')
      apiRequest.mockRejectedValue(notFoundError)

      await expect(deleteProject('NONEXISTENT', 'token')).rejects.toThrow(
        'File not found'
      )
    })

    test('Should handle different reference number formats', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await deleteProject('PROJ-2024-001', 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/PROJ-2024-001/benefit-area-file',
        expect.objectContaining({
          method: 'DELETE'
        })
      )
    })
  })
})
