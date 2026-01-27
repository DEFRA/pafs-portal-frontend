import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AreasService, createAreasService } from './areas-service.js'

vi.mock('./areas-cache.js')
vi.mock('../../helpers/api-client/index.js')

const { createAreasCacheService } = await import('./areas-cache.js')
const { apiRequest } = await import('../../helpers/api-client/index.js')

const mockGetAreasByType = vi.fn()
const mockSetAreasByType = vi.fn()
const mockInvalidateAreas = vi.fn()
const mockGetAreasByList = vi.fn()
const mockSetAreasByList = vi.fn()
const mockInvalidateAreasByList = vi.fn()
const mockGetAreaFromCachedList = vi.fn()
const mockSetAreaInCache = vi.fn()
const mockInvalidateIndividualAreas = vi.fn()
const mockInvalidateAllAreasCache = vi.fn()
const mockApiRequest = vi.fn()

createAreasCacheService.mockReturnValue({
  getAreasByType: mockGetAreasByType,
  setAreasByType: mockSetAreasByType,
  invalidateAreasByType: mockInvalidateAreas,
  getAreasByList: mockGetAreasByList,
  setAreasByList: mockSetAreasByList,
  invalidateAreasByList: mockInvalidateAreasByList,
  getAreaFromCachedList: mockGetAreaFromCachedList,
  setAreaInCache: mockSetAreaInCache,
  invalidateIndividualAreas: mockInvalidateIndividualAreas,
  invalidateAllAreasCache: mockInvalidateAllAreasCache
})

apiRequest.mockImplementation(mockApiRequest)

describe('AreasService', () => {
  let mockServer
  let areasService

  beforeEach(() => {
    mockServer = {
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    }

    areasService = new AreasService(mockServer)
    vi.clearAllMocks()
  })

  describe('getAreasByType', () => {
    test('returns cached areas when cache hit', async () => {
      const cachedAreas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }],
        PSO: [{ id: '2', name: 'PSO West', area_type: 'PSO', parent_id: '1' }]
      }
      mockGetAreasByType.mockResolvedValue(cachedAreas)

      const result = await areasService.getAreasByType()

      expect(result).toEqual(cachedAreas)
      expect(mockGetAreasByType).toHaveBeenCalled()
      expect(mockApiRequest).not.toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas retrieved from cache'
      )
    })

    test('fetches from API and caches when cache miss', async () => {
      const apiAreas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }],
        PSO: [{ id: '2', name: 'PSO West', area_type: 'PSO', parent_id: '1' }],
        RMA: [{ id: '3', name: 'Bristol', area_type: 'RMA', parent_id: '2' }]
      }
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: apiAreas })

      const result = await areasService.getAreasByType()

      expect(result).toEqual(apiAreas)
      expect(mockGetAreasByType).toHaveBeenCalled()
      expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/areas-by-type', {
        method: 'GET'
      })
      expect(mockSetAreasByType).toHaveBeenCalledWith(apiAreas)
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Cache miss - fetching areas from backend API'
      )
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas cached successfully'
      )
    })

    test('throws error when API returns invalid response', async () => {
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: false })

      await expect(areasService.getAreasByType()).rejects.toThrow(
        'Invalid response from areas API'
      )
      expect(mockServer.logger.error).toHaveBeenCalled()
    })

    test('throws error when API returns non-object', async () => {
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: null })

      await expect(areasService.getAreasByType()).rejects.toThrow(
        'Invalid response from areas API'
      )
    })

    test('handles API error gracefully', async () => {
      const apiError = new Error('API connection failed')
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockRejectedValue(apiError)

      await expect(areasService.getAreasByType()).rejects.toThrow(
        'API connection failed'
      )
      expect(mockServer.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'API connection failed'
          })
        }),
        'Failed to fetch areas'
      )
    })

    test('handles empty areas object from API', async () => {
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: {} })

      const result = await areasService.getAreasByType()

      expect(result).toEqual({})
      expect(mockSetAreasByType).toHaveBeenCalledWith({})
    })
  })

  describe('refreshAreas', () => {
    test('invalidates cache and fetches fresh data', async () => {
      const freshAreas = {
        EA: [{ id: '1', name: 'Updated Wessex', area_type: 'EA' }]
      }
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: freshAreas })

      const result = await areasService.refreshAreas()

      expect(mockInvalidateAllAreasCache).toHaveBeenCalled()
      expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/areas-by-type', {
        method: 'GET'
      })
      expect(result).toEqual(freshAreas)
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Refreshing ALL areas cache - starting invalidation'
      )
    })

    test('handles refresh error', async () => {
      const error = new Error('Refresh failed')
      mockInvalidateAllAreasCache.mockResolvedValue(undefined)
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockRejectedValue(error)

      await expect(areasService.refreshAreas()).rejects.toThrow(
        'Refresh failed'
      )
      expect(mockServer.logger.error).toHaveBeenCalled()
    })
  })

  describe('preloadAreas', () => {
    test('preloads areas successfully', async () => {
      const areas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
      }
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: areas })

      await areasService.preloadAreas()

      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Preloading areas into cache'
      )
      expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/areas-by-type', {
        method: 'GET'
      })
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas preloaded successfully'
      )
    })

    test('handles preload failure gracefully', async () => {
      const error = new Error('Preload failed')
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockRejectedValue(error)

      await areasService.preloadAreas()

      expect(mockServer.logger.warn).toHaveBeenCalledWith(
        { error },
        'Failed to preload areas - will retry on first request'
      )
    })

    test('uses cached areas if already available', async () => {
      const cachedAreas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
      }
      mockGetAreasByType.mockResolvedValue(cachedAreas)

      await areasService.preloadAreas()

      expect(mockApiRequest).not.toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas preloaded successfully'
      )
    })
  })

  describe('createAreasService', () => {
    test('creates service instance', () => {
      const service = createAreasService(mockServer)

      expect(service).toBeInstanceOf(AreasService)
      expect(service.server).toBe(mockServer)
      expect(service.logger).toBe(mockServer.logger)
    })
  })

  describe('real-world usage patterns', () => {
    test('account request flow: first user loads EA areas', async () => {
      const areas = {
        EA: [
          { id: '1', name: 'Wessex', area_type: 'EA', parent_id: null },
          { id: '2', name: 'Thames', area_type: 'EA', parent_id: null },
          { id: '3', name: 'Anglian', area_type: 'EA', parent_id: null }
        ],
        PSO: [],
        RMA: []
      }
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: areas })

      const result = await areasService.getAreasByType()

      expect(result.EA).toHaveLength(3)
      expect(result.EA[0].area_type).toBe('EA')
      expect(mockSetAreasByType).toHaveBeenCalledWith(areas)
    })

    test('account request flow: subsequent user gets cached areas', async () => {
      const cachedAreas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }],
        PSO: [{ id: '2', name: 'PSO West', area_type: 'PSO', parent_id: '1' }],
        RMA: [{ id: '3', name: 'Bristol', area_type: 'RMA', parent_id: '2' }]
      }
      mockGetAreasByType.mockResolvedValue(cachedAreas)

      const result = await areasService.getAreasByType()

      expect(result).toEqual(cachedAreas)
      expect(mockApiRequest).not.toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas retrieved from cache'
      )
    })

    test('admin updates areas: refresh cache', async () => {
      const updatedAreas = {
        EA: [
          { id: '1', name: 'Wessex', area_type: 'EA' },
          { id: '4', name: 'New EA Area', area_type: 'EA' }
        ]
      }
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: updatedAreas })

      await areasService.refreshAreas()

      expect(mockInvalidateAllAreasCache).toHaveBeenCalled()
      expect(mockApiRequest).toHaveBeenCalled()
    })
  })

  describe('getAreasByList', () => {
    test('returns cached list when cache hit', async () => {
      const params = { search: 'Bristol', type: 'RMA', page: 1, pageSize: 10 }
      const cachedList = {
        areas: [{ id: '1', name: 'Bristol Council', area_type: 'RMA' }],
        total: 1,
        page: 1,
        pagination: 10
      }
      mockGetAreasByList.mockResolvedValue(cachedList)

      const result = await areasService.getAreasByList(params)

      expect(result).toEqual(cachedList)
      expect(mockGetAreasByList).toHaveBeenCalledWith({
        search: 'Bristol',
        type: 'RMA',
        page: 1,
        pageSize: 10
      })
      expect(mockApiRequest).not.toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ queryParams: params }),
        'Areas list retrieved from cache'
      )
    })

    test('fetches from API and caches when cache miss', async () => {
      const params = { search: 'Thames', type: 'EA', page: 2, pageSize: 20 }
      const apiList = {
        areas: [
          { id: '1', name: 'Thames', area_type: 'EA' },
          { id: '2', name: 'Thames Valley', area_type: 'EA' }
        ],
        total: 2,
        page: 2,
        pagination: 20
      }
      mockGetAreasByList.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: apiList })

      const result = await areasService.getAreasByList(params)

      expect(result).toEqual(apiList)
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/v1/areas-by-list?search=Thames&type=EA&page=2&pageSize=20',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer undefined' }
        }
      )
      expect(mockSetAreasByList).toHaveBeenCalledWith(params, apiList)
    })

    test('uses default parameters when not provided', async () => {
      const apiList = {
        areas: [],
        total: 0,
        page: 1,
        pagination: 10
      }
      mockGetAreasByList.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: apiList })

      await areasService.getAreasByList()

      expect(mockGetAreasByList).toHaveBeenCalledWith({
        search: '',
        type: '',
        page: 1,
        pageSize: 20
      })
      expect(mockApiRequest).toHaveBeenCalledWith(
        '/api/v1/areas-by-list?search=&type=&page=1&pageSize=20',
        {
          method: 'GET',
          headers: { Authorization: 'Bearer undefined' }
        }
      )
    })

    test('handles partial parameters', async () => {
      const params = { search: 'Bristol' }
      const apiList = {
        areas: [{ id: '1', name: 'Bristol Council' }],
        total: 1
      }
      mockGetAreasByList.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: apiList })

      await areasService.getAreasByList(params)

      expect(mockGetAreasByList).toHaveBeenCalledWith({
        search: 'Bristol',
        type: '',
        page: 1,
        pageSize: 20
      })
    })

    test('throws error when API returns invalid response', async () => {
      mockGetAreasByList.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: false })

      await expect(areasService.getAreasByList({})).rejects.toThrow(
        'Invalid response from areas list API'
      )
      expect(mockServer.logger.error).toHaveBeenCalled()
    })

    test('handles API error gracefully', async () => {
      const apiError = new Error('Network timeout')
      mockGetAreasByList.mockResolvedValue(null)
      mockApiRequest.mockRejectedValue(apiError)

      await expect(areasService.getAreasByList({})).rejects.toThrow(
        'Network timeout'
      )
    })
  })

  describe('getAreaById', () => {
    test('returns area from cached list when available', async () => {
      const areaId = '123'
      const cachedArea = {
        id: '123',
        name: 'Bristol Council',
        area_type: 'RMA'
      }
      mockGetAreaFromCachedList.mockResolvedValue(cachedArea)

      const result = await areasService.getAreaById(areaId)

      expect(result).toEqual(cachedArea)
      expect(mockGetAreaFromCachedList).toHaveBeenCalledWith(areaId)
      expect(mockApiRequest).not.toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        { areaId },
        'Area retrieved from cache'
      )
    })

    test('fetches from API when not in cache', async () => {
      const areaId = '456'
      const apiArea = { id: '456', name: 'Thames', area_type: 'EA' }
      mockGetAreaFromCachedList.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: apiArea })

      const result = await areasService.getAreaById(areaId)

      expect(result).toEqual(apiArea)
      expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/area-by-id/456', {
        method: 'GET',
        headers: { Authorization: 'Bearer undefined' }
      })
      expect(mockSetAreaInCache).toHaveBeenCalledWith(areaId, apiArea)
    })

    test('throws error when API returns invalid response', async () => {
      mockGetAreaFromCachedList.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: false })

      await expect(areasService.getAreaById('123')).rejects.toThrow(
        'Invalid response from area API'
      )
    })

    test('handles API error gracefully', async () => {
      const apiError = new Error('Area not found')
      mockGetAreaFromCachedList.mockResolvedValue(null)
      mockApiRequest.mockRejectedValue(apiError)

      await expect(areasService.getAreaById('999')).rejects.toThrow(
        'Area not found'
      )
    })
  })

  describe('upsertArea', () => {
    const accessToken = 'test-token-123'
    const areaData = {
      name: 'Test Area',
      areaType: 'Authority',
      identifier: 'AUTH001'
    }

    test('successfully creates area and invalidates cache', async () => {
      const responseData = {
        id: '100',
        name: 'Test Area',
        areaType: 'Authority',
        identifier: 'AUTH001'
      }
      mockApiRequest.mockResolvedValue({ success: true, data: responseData })

      const result = await areasService.upsertArea({
        data: areaData,
        accessToken
      })

      expect(result).toEqual(responseData)
      expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/areas/upsert', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(areaData)
      })
      expect(mockInvalidateAllAreasCache).toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Area upserted successfully - invalidating cache'
      )
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Cache invalidated successfully'
      )
    })

    test('successfully updates area and invalidates cache', async () => {
      const updateData = { ...areaData, id: '50' }
      const responseData = { ...updateData, updatedAt: new Date() }
      mockApiRequest.mockResolvedValue({ success: true, data: responseData })

      const result = await areasService.upsertArea({
        data: updateData,
        accessToken
      })

      expect(result).toEqual(responseData)
      expect(mockInvalidateAllAreasCache).toHaveBeenCalled()
    })

    test('throws error when API returns invalid response', async () => {
      mockApiRequest.mockResolvedValue({ success: false })

      await expect(
        areasService.upsertArea({ data: areaData, accessToken })
      ).rejects.toThrow('Invalid response from upsert API')

      // Cache should NOT be invalidated on error
      expect(mockInvalidateAllAreasCache).not.toHaveBeenCalled()
    })

    test('throws error with custom error code from API', async () => {
      mockApiRequest.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'DUPLICATE_AREA' }]
      })

      await expect(
        areasService.upsertArea({ data: areaData, accessToken })
      ).rejects.toThrow('DUPLICATE_AREA')

      expect(mockInvalidateAllAreasCache).not.toHaveBeenCalled()
    })

    test('handles API error and does not invalidate cache', async () => {
      const apiError = new Error('Network error')
      mockApiRequest.mockRejectedValue(apiError)

      await expect(
        areasService.upsertArea({ data: areaData, accessToken })
      ).rejects.toThrow('Network error')

      expect(mockInvalidateAllAreasCache).not.toHaveBeenCalled()
      expect(mockServer.logger.error).toHaveBeenCalled()
    })
  })

  describe('invalidateAreasListCache', () => {
    test('calls cache service to invalidate list', async () => {
      await areasService.invalidateAreasListCache()

      expect(mockInvalidateAreasByList).toHaveBeenCalled()
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Invalidating areas list cache'
      )
    })
  })

  describe('refreshAreas', () => {
    test('invalidates all cache and fetches fresh data', async () => {
      const freshData = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
      }
      mockGetAreasByType.mockResolvedValue(null)
      mockApiRequest.mockResolvedValue({ success: true, data: freshData })

      const result = await areasService.refreshAreas()

      expect(mockInvalidateAllAreasCache).toHaveBeenCalled()
      expect(result).toEqual(freshData)
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Refreshing ALL areas cache - starting invalidation'
      )
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Fresh areas data fetched and cached'
      )
    })
  })
})
