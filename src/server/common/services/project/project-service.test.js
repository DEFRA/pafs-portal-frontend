import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  checkProjectNameExists,
  getProjectProposalOverview,
  upsertProjectProposal,
  getProjectBenefitAreaDownloadUrl,
  deleteProject,
  getProjects,
  updateProjectStatus
} from './project-service.js'
import { apiRequest } from '../../helpers/api-client/index.js'

vi.mock('../../helpers/api-client/index.js', () => ({
  apiRequest: vi.fn()
}))

vi.mock('../../helpers/pagination/index.js', () => ({
  getDefaultPageSize: vi.fn(() => 10)
}))

describe('project-service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProjects', () => {
    test('Should call apiRequest with correct endpoint and default parameters', async () => {
      const mockResponse = {
        success: true,
        data: {
          data: [],
          pagination: { page: 1, totalPages: 1, total: 0 }
        }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/projects?'),
        expect.objectContaining({
          method: 'GET',
          headers: { Authorization: 'Bearer test-token' }
        })
      )
    })

    test('Should include search parameter in query string', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ search: 'flood', accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('search=flood'),
        expect.any(Object)
      )
    })

    test('Should trim search parameter before adding to query', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ search: '  flood  ', accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('search=flood'),
        expect.any(Object)
      )
    })

    test('Should not include search parameter when empty', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ search: '', accessToken: 'test-token' })

      const callArgs = apiRequest.mock.calls[0][0]
      expect(callArgs).not.toContain('search=')
    })

    test('Should include areaId parameter in query string', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ areaId: 5, accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('areaId=5'),
        expect.any(Object)
      )
    })

    test('Should include status parameter in query string', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ status: 'submitted', accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('status=submitted'),
        expect.any(Object)
      )
    })

    test('Should include page parameter in query string', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ page: 2, accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      )
    })

    test('Should use default page when not provided', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('page=1'),
        expect.any(Object)
      )
    })

    test('Should include pageSize parameter in query string', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ pageSize: 25, accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=25'),
        expect.any(Object)
      )
    })

    test('Should use default pageSize when not provided', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({ accessToken: 'test-token' })

      expect(apiRequest).toHaveBeenCalledWith(
        expect.stringContaining('pageSize=10'),
        expect.any(Object)
      )
    })

    test('Should include all parameters in query string', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({
        search: 'coastal',
        areaId: 3,
        status: 'draft',
        page: 2,
        pageSize: 20,
        accessToken: 'test-token'
      })

      const callArgs = apiRequest.mock.calls[0][0]
      expect(callArgs).toContain('search=coastal')
      expect(callArgs).toContain('areaId=3')
      expect(callArgs).toContain('status=draft')
      expect(callArgs).toContain('page=2')
      expect(callArgs).toContain('pageSize=20')
    })

    test('Should not include Authorization header when no accessToken', async () => {
      const mockResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }
      apiRequest.mockResolvedValue(mockResponse)

      await getProjects({})

      expect(apiRequest).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return data from cache when available', async () => {
      const mockCachedProjects = [
        { id: 1, name: 'Cached Project 1' },
        { id: 2, name: 'Cached Project 2' }
      ]
      const mockMetadata = {
        projectIds: [1, 2],
        pagination: { page: 1, totalPages: 1, total: 2 }
      }

      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue(mockMetadata),
        getProjectsByIds: vi.fn().mockResolvedValue(mockCachedProjects)
      }

      const result = await getProjects({
        page: 1,
        accessToken: 'test-token',
        cacheService: mockCacheService
      })

      expect(result.success).toBe(true)
      expect(result.data.data).toEqual(mockCachedProjects)
      expect(result.data.pagination).toEqual(mockMetadata.pagination)
      expect(apiRequest).not.toHaveBeenCalled()
    })

    test('Should fetch from API when cache misses', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          data: [{ id: 1, name: 'API Project' }],
          pagination: { page: 1, totalPages: 1, total: 1 }
        }
      }

      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue(null),
        setProjects: vi.fn(),
        setListMetadata: vi.fn()
      }

      apiRequest.mockResolvedValue(mockApiResponse)

      const result = await getProjects({
        page: 1,
        accessToken: 'test-token',
        cacheService: mockCacheService
      })

      expect(apiRequest).toHaveBeenCalled()
      expect(result.success).toBe(true)
      expect(result.data.data).toEqual(mockApiResponse.data.data)
    })

    test('Should cache API response when data is returned', async () => {
      const mockProjects = [
        { id: 1, name: 'Project 1' },
        { id: 2, name: 'Project 2' }
      ]
      const mockPagination = { page: 1, totalPages: 1, total: 2 }
      const mockApiResponse = {
        success: true,
        data: { data: mockProjects, pagination: mockPagination }
      }

      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue(null),
        setProjects: vi.fn(),
        setListMetadata: vi.fn()
      }

      apiRequest.mockResolvedValue(mockApiResponse)

      await getProjects({
        page: 1,
        accessToken: 'test-token',
        cacheService: mockCacheService
      })

      expect(mockCacheService.setProjects).toHaveBeenCalledWith(mockProjects)
      expect(mockCacheService.setListMetadata).toHaveBeenCalledWith(
        expect.any(Object),
        [1, 2],
        mockPagination
      )
    })

    test('Should not cache when no data returned', async () => {
      const mockApiResponse = {
        success: true,
        data: { data: [], pagination: {} }
      }

      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue(null),
        setProjects: vi.fn(),
        setListMetadata: vi.fn()
      }

      apiRequest.mockResolvedValue(mockApiResponse)

      await getProjects({
        page: 1,
        accessToken: 'test-token',
        cacheService: mockCacheService
      })

      expect(mockCacheService.setProjects).not.toHaveBeenCalled()
      expect(mockCacheService.setListMetadata).not.toHaveBeenCalled()
    })

    test('Should return API error response', async () => {
      const mockErrorResponse = {
        success: false,
        errors: [{ errorCode: 'FETCH_FAILED' }]
      }

      apiRequest.mockResolvedValue(mockErrorResponse)

      const result = await getProjects({ accessToken: 'test-token' })

      expect(result.success).toBe(false)
      expect(result.errors).toBeDefined()
    })

    test('Should handle API request failure', async () => {
      apiRequest.mockRejectedValue(new Error('Network error'))

      await expect(getProjects({ accessToken: 'test-token' })).rejects.toThrow(
        'Network error'
      )
    })

    test('Should work without cache service', async () => {
      const mockApiResponse = {
        success: true,
        data: {
          data: [{ id: 1, name: 'Project 1' }],
          pagination: { page: 1, totalPages: 1, total: 1 }
        }
      }

      apiRequest.mockResolvedValue(mockApiResponse)

      const result = await getProjects({
        page: 1,
        accessToken: 'test-token'
      })

      expect(result.success).toBe(true)
      expect(apiRequest).toHaveBeenCalled()
    })

    test('Should fetch from API when some cached projects are missing', async () => {
      const mockMetadata = {
        projectIds: [1, 2, 3],
        pagination: { page: 1, totalPages: 1, total: 3 }
      }
      const mockCachedProjects = [
        { id: 1, name: 'Project 1' },
        null, // Missing project
        { id: 3, name: 'Project 3' }
      ]

      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue(mockMetadata),
        getProjectsByIds: vi.fn().mockResolvedValue(mockCachedProjects),
        setProjects: vi.fn(),
        setListMetadata: vi.fn()
      }

      const mockApiResponse = {
        success: true,
        data: {
          data: [
            { id: 1, name: 'Project 1' },
            { id: 2, name: 'Project 2' },
            { id: 3, name: 'Project 3' }
          ],
          pagination: mockMetadata.pagination
        }
      }

      apiRequest.mockResolvedValue(mockApiResponse)

      const result = await getProjects({
        page: 1,
        accessToken: 'test-token',
        cacheService: mockCacheService
      })

      expect(apiRequest).toHaveBeenCalled()
      expect(result.success).toBe(true)
    })

    test('Should use referenceNumber as fallback for projectId in cache', async () => {
      const mockProjects = [
        { referenceNumber: 'RMS12345/ABC001', name: 'Project 1' },
        { id: 2, name: 'Project 2' }
      ]
      const mockApiResponse = {
        success: true,
        data: { data: mockProjects, pagination: {} }
      }

      const mockCacheService = {
        getListMetadata: vi.fn().mockResolvedValue(null),
        setProjects: vi.fn(),
        setListMetadata: vi.fn()
      }

      apiRequest.mockResolvedValue(mockApiResponse)

      await getProjects({
        page: 1,
        accessToken: 'test-token',
        cacheService: mockCacheService
      })

      expect(mockCacheService.setListMetadata).toHaveBeenCalledWith(
        expect.any(Object),
        ['RMS12345/ABC001', 2],
        expect.any(Object)
      )
    })
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

  describe('updateProjectStatus', () => {
    test('Should call apiRequest with correct endpoint and method', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF123', 'archived', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/status',
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })

    test('Should send status in JSON body', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF123', 'archived', 'mock-token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/status',
        expect.objectContaining({
          body: JSON.stringify({ status: 'archived' })
        })
      )
    })

    test('Should include Authorization header when accessToken is provided', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF456', 'draft', 'test-token-123')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF456/status',
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token-123'
          }
        })
      )
    })

    test('Should not include Authorization header when accessToken is not provided', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF123', 'draft')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/status',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is null', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF123', 'archived', null)

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/status',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should not include Authorization header when accessToken is empty string', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF123', 'draft', '')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/status',
        expect.objectContaining({
          headers: {}
        })
      )
    })

    test('Should return API response', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { referenceNumber: 'REF123', status: 'archived' }
        }
      }
      apiRequest.mockResolvedValue(mockResponse)

      const result = await updateProjectStatus('REF123', 'archived', 'token')

      expect(result).toEqual(mockResponse)
    })

    test('Should handle API errors', async () => {
      const mockError = new Error('API Error')
      apiRequest.mockRejectedValue(mockError)

      await expect(
        updateProjectStatus('REF123', 'archived', 'token')
      ).rejects.toThrow('API Error')
    })

    test('Should handle network errors', async () => {
      const networkError = new Error('Network connection failed')
      apiRequest.mockRejectedValue(networkError)

      await expect(
        updateProjectStatus('REF123', 'draft', 'token')
      ).rejects.toThrow('Network connection failed')
    })

    test('Should handle different status values', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('REF123', 'submitted', 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/REF123/status',
        expect.objectContaining({
          body: JSON.stringify({ status: 'submitted' })
        })
      )
    })

    test('Should handle different reference number formats', async () => {
      apiRequest.mockResolvedValue({ data: { success: true } })

      await updateProjectStatus('PROJ-2024-001', 'archived', 'token')

      expect(apiRequest).toHaveBeenCalledWith(
        '/api/v1/project/PROJ-2024-001/status',
        expect.objectContaining({
          method: 'PUT'
        })
      )
    })
  })
})
