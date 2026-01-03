import { describe, test, expect, beforeEach, vi } from 'vitest'
import { AreasService, createAreasService } from './areas-service.js'

vi.mock('./areas-cache.js')
vi.mock('../../helpers/api-client/index.js')

const { createAreasCacheService } = await import('./areas-cache.js')
const { apiRequest } = await import('../../helpers/api-client/index.js')

const mockGetAreasByType = vi.fn()
const mockSetAreasByType = vi.fn()
const mockInvalidateAreas = vi.fn()
const mockApiRequest = vi.fn()

createAreasCacheService.mockReturnValue({
  getAreasByType: mockGetAreasByType,
  setAreasByType: mockSetAreasByType,
  invalidateAreas: mockInvalidateAreas
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

      expect(mockInvalidateAreas).toHaveBeenCalled()
      expect(mockApiRequest).toHaveBeenCalledWith('/api/v1/areas-by-type', {
        method: 'GET'
      })
      expect(result).toEqual(freshAreas)
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Refreshing areas cache'
      )
    })

    test('handles refresh error', async () => {
      const error = new Error('Refresh failed')
      mockInvalidateAreas.mockResolvedValue(undefined)
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

      expect(mockInvalidateAreas).toHaveBeenCalled()
      expect(mockApiRequest).toHaveBeenCalled()
    })
  })
})
