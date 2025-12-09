import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock config before importing
vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'session.cache.name') {
        return 'test-cache'
      }
      return null
    })
  }
}))

// Import after mocks
let getCachedAreas

describe('#areas-cache', () => {
  let mockServer
  let mockCache
  let mockFetchFunction

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // Re-import after reset to get fresh module state
    const module = await import('./areas-cache.js')
    getCachedAreas = module.getCachedAreas

    mockCache = {
      get: vi.fn(),
      set: vi.fn()
    }

    mockServer = {
      cache: vi.fn(() => mockCache),
      logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
      }
    }

    mockFetchFunction = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('getCachedAreas', () => {
    test('Should return data from cache when available (standard Catbox format)', async () => {
      const mockCachedData = {
        item: [{ id: 1, name: 'Cached Area' }],
        stored: Date.now()
      }

      mockCache.get.mockResolvedValue(mockCachedData)

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(mockCache.get).toHaveBeenCalledWith('areas')
      expect(mockFetchFunction).not.toHaveBeenCalled()
      expect(result).toEqual([{ id: 1, name: 'Cached Area' }])
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas retrieved from cache'
      )
    })

    test('Should return data from cache when cached is already an array', async () => {
      const mockCachedData = [{ id: 1, name: 'Cached Area' }]

      mockCache.get.mockResolvedValue(mockCachedData)

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(result).toEqual(mockCachedData)
      expect(mockFetchFunction).not.toHaveBeenCalled()
    })

    test('Should return data from cache when cached is array-like object', async () => {
      const mockCachedData = {
        0: { id: 1, name: 'Area 1' },
        1: { id: 2, name: 'Area 2' }
      }

      mockCache.get.mockResolvedValue(mockCachedData)

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(mockFetchFunction).not.toHaveBeenCalled()
    })

    test('Should fetch from API when cache miss', async () => {
      const mockApiData = [{ id: 1, name: 'Fetched Area' }]

      mockCache.get.mockResolvedValue(null)
      mockFetchFunction.mockResolvedValue({
        success: true,
        data: mockApiData
      })
      mockCache.set.mockResolvedValue(undefined)

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(mockCache.get).toHaveBeenCalledWith('areas')
      expect(mockFetchFunction).toHaveBeenCalled()
      expect(mockCache.set).toHaveBeenCalledWith('areas', mockApiData)
      expect(result).toEqual(mockApiData)
    })

    test('Should return null when API response is not successful', async () => {
      mockCache.get.mockResolvedValue(null)
      mockFetchFunction.mockResolvedValue({
        success: false,
        error: 'API Error'
      })

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(result).toBeNull()
      expect(mockCache.set).not.toHaveBeenCalled()
    })

    test('Should fetch from API when cache is not available', async () => {
      // Mock server without cache
      const serverWithoutCache = {
        cache: vi.fn(() => null),
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }

      const mockApiData = [{ id: 1, name: 'Fetched Area' }]

      mockFetchFunction.mockResolvedValue({
        success: true,
        data: mockApiData
      })

      const result = await getCachedAreas(serverWithoutCache, mockFetchFunction)

      expect(mockFetchFunction).toHaveBeenCalled()
      expect(result).toEqual(mockApiData)
    })

    test('Should return null when cache is not available and API fails', async () => {
      const serverWithoutCache = {
        cache: vi.fn(() => null),
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }

      mockFetchFunction.mockResolvedValue({
        success: false,
        error: 'API Error'
      })

      const result = await getCachedAreas(serverWithoutCache, mockFetchFunction)

      expect(result).toBeNull()
    })

    test('Should handle cache get errors and fallback to API', async () => {
      const mockApiData = [{ id: 1, name: 'Fetched Area' }]

      mockCache.get.mockRejectedValue(new Error('Cache error'))
      mockFetchFunction.mockResolvedValue({
        success: true,
        data: mockApiData
      })

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(mockServer.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Cache error'
        }),
        'Error accessing areas cache'
      )
      expect(mockFetchFunction).toHaveBeenCalled()
      expect(result).toEqual(mockApiData)
    })

    test('Should handle both cache and API errors gracefully', async () => {
      mockCache.get.mockRejectedValue(new Error('Cache error'))
      mockFetchFunction.mockRejectedValue(new Error('API error'))

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(mockServer.logger.error).toHaveBeenCalledTimes(2)
      expect(result).toBeNull()
    })

    test('Should handle cache set errors gracefully', async () => {
      const mockApiData = [{ id: 1, name: 'Fetched Area' }]

      mockCache.get.mockResolvedValue(null)
      mockFetchFunction.mockResolvedValue({
        success: true,
        data: mockApiData
      })
      mockCache.set.mockRejectedValue(new Error('Cache set error'))

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      // Should still return data even if cache set fails
      expect(result).toEqual(mockApiData)
    })

    test('Should handle primitive cached values', async () => {
      mockCache.get.mockResolvedValue('primitive-value')

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(result).toBe('primitive-value')
      expect(mockFetchFunction).not.toHaveBeenCalled()
    })

    test('Should handle plain object cached values', async () => {
      const mockCachedData = {
        id: 1,
        name: 'Plain Object',
        stored: undefined,
        item: undefined
      }

      mockCache.get.mockResolvedValue(mockCachedData)

      const result = await getCachedAreas(mockServer, mockFetchFunction)

      expect(result).toEqual(mockCachedData)
      expect(mockFetchFunction).not.toHaveBeenCalled()
    })

    test('Should handle cache segment creation error', async () => {
      // Reset modules to get fresh state
      vi.resetModules()
      const module = await import('./areas-cache.js')
      const freshGetCachedAreas = module.getCachedAreas

      const serverWithError = {
        cache: vi.fn(() => {
          throw new Error('Cannot provision the same cache segment')
        }),
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }

      const mockApiData = [{ id: 1, name: 'Fetched Area' }]

      mockFetchFunction.mockResolvedValue({
        success: true,
        data: mockApiData
      })

      const result = await freshGetCachedAreas(
        serverWithError,
        mockFetchFunction
      )

      expect(serverWithError.logger.warn).toHaveBeenCalledWith(
        'Cache segment already exists - caching will be disabled. This may happen if the server was restarted.'
      )
      expect(result).toEqual(mockApiData)
    })

    test('Should handle other cache creation errors', async () => {
      // Reset modules to get fresh state
      vi.resetModules()
      const module = await import('./areas-cache.js')
      const freshGetCachedAreas = module.getCachedAreas

      const serverWithError = {
        cache: vi.fn(() => {
          throw new Error('Other cache error')
        }),
        logger: {
          info: vi.fn(),
          warn: vi.fn(),
          error: vi.fn()
        }
      }

      const mockApiData = [{ id: 1, name: 'Fetched Area' }]

      mockFetchFunction.mockResolvedValue({
        success: true,
        data: mockApiData
      })

      const result = await freshGetCachedAreas(
        serverWithError,
        mockFetchFunction
      )

      expect(serverWithError.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Other cache error'
        }),
        'Error creating cache segment - caching disabled'
      )
      expect(result).toEqual(mockApiData)
    })
  })
})
