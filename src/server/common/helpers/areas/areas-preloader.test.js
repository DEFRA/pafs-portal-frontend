import { describe, test, expect, beforeEach, vi } from 'vitest'
import { areasPreloader } from './areas-preloader.js'

const mockPreloadAreas = vi.fn()
const mockGetAreasByType = vi.fn()

vi.mock('../../services/areas/areas-service.js', () => ({
  createAreasService: vi.fn(() => ({
    preloadAreas: mockPreloadAreas,
    getAreasByType: mockGetAreasByType
  }))
}))

describe('AreasPreloader Plugin', () => {
  let mockServer
  let mockRequest
  let mockH

  beforeEach(() => {
    mockServer = {
      logger: {
        info: vi.fn(),
        warn: vi.fn()
      },
      decorate: vi.fn(),
      ext: vi.fn()
    }

    mockRequest = {
      server: mockServer
    }

    mockH = {
      continue: Symbol('continue')
    }

    vi.clearAllMocks()
  })

  describe('plugin registration', () => {
    test('has correct plugin name', () => {
      expect(areasPreloader.name).toBe('areas-preloader')
    })

    test('has correct version', () => {
      expect(areasPreloader.version).toBe('1.0.0')
    })

    test('registers successfully', async () => {
      await areasPreloader.register(mockServer, {})

      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Areas preloader plugin registered'
      )
    })
  })

  describe('server decorations', () => {
    test('decorates server with areasService', async () => {
      await areasPreloader.register(mockServer, {})

      expect(mockServer.decorate).toHaveBeenCalledWith(
        'server',
        'areasService',
        expect.any(Object)
      )
    })

    test('decorates request with getAreas method', async () => {
      await areasPreloader.register(mockServer, {})

      expect(mockServer.decorate).toHaveBeenCalledWith(
        'request',
        'getAreas',
        expect.any(Function)
      )
    })

    test('request.getAreas calls areasService.getAreasByType', async () => {
      const mockAreas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }]
      }
      mockGetAreasByType.mockResolvedValue(mockAreas)

      await areasPreloader.register(mockServer, {})

      const getAreasCall = mockServer.decorate.mock.calls.find(
        (call) => call[0] === 'request' && call[1] === 'getAreas'
      )
      const getAreasFunction = getAreasCall[2]

      // Mock request.server.areasService
      const mockRequestWithService = {
        server: {
          ...mockServer,
          areasService: {
            getAreasByType: mockGetAreasByType
          }
        }
      }

      const result = await getAreasFunction.call(mockRequestWithService)

      expect(result).toEqual(mockAreas)
      expect(mockGetAreasByType).toHaveBeenCalled()
    })
  })

  describe('onPreHandler hook', () => {
    test('registers onPreHandler extension', async () => {
      await areasPreloader.register(mockServer, {})

      expect(mockServer.ext).toHaveBeenCalledWith(
        'onPreHandler',
        expect.any(Function)
      )
    })

    test('preloads areas on first request', async () => {
      mockPreloadAreas.mockResolvedValue(undefined)

      await areasPreloader.register(mockServer, {})

      const onPreHandlerCall = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreHandler'
      )
      const onPreHandlerFunction = onPreHandlerCall[1]

      const result = await onPreHandlerFunction(mockRequest, mockH)

      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'First request detected - preloading areas'
      )
      expect(mockPreloadAreas).toHaveBeenCalled()
      expect(result).toBe(mockH.continue)
    })

    test('does not preload on subsequent requests', async () => {
      mockPreloadAreas.mockResolvedValue(undefined)

      await areasPreloader.register(mockServer, {})

      const onPreHandlerCall = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreHandler'
      )
      const onPreHandlerFunction = onPreHandlerCall[1]

      await onPreHandlerFunction(mockRequest, mockH)
      vi.clearAllMocks()

      await onPreHandlerFunction(mockRequest, mockH)

      expect(mockPreloadAreas).not.toHaveBeenCalled()
      expect(mockServer.logger.info).not.toHaveBeenCalled()
    })

    test('handles preload error gracefully', async () => {
      const error = new Error('Preload failed')
      mockPreloadAreas.mockRejectedValue(error)

      await areasPreloader.register(mockServer, {})

      const onPreHandlerCall = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreHandler'
      )
      const onPreHandlerFunction = onPreHandlerCall[1]

      const result = await onPreHandlerFunction(mockRequest, mockH)

      expect(mockServer.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: 'Preload failed'
          })
        }),
        'Failed to preload areas on first request - will retry on next request'
      )
      expect(result).toBe(mockH.continue)
    })

    test('retries preload on next request after failure', async () => {
      const error = new Error('Preload failed')
      mockPreloadAreas
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce(undefined)

      await areasPreloader.register(mockServer, {})

      const onPreHandlerCall = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreHandler'
      )
      const onPreHandlerFunction = onPreHandlerCall[1]

      await onPreHandlerFunction(mockRequest, mockH)
      expect(mockServer.logger.warn).toHaveBeenCalled()

      vi.clearAllMocks()

      await onPreHandlerFunction(mockRequest, mockH)
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'First request detected - preloading areas'
      )
      expect(mockPreloadAreas).toHaveBeenCalledTimes(1)
    })
  })

  describe('real-world usage patterns', () => {
    test('first user request triggers preload', async () => {
      mockPreloadAreas.mockResolvedValue(undefined)

      await areasPreloader.register(mockServer, {})

      const onPreHandlerCall = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreHandler'
      )
      const onPreHandlerFunction = onPreHandlerCall[1]

      await onPreHandlerFunction(mockRequest, mockH)

      expect(mockPreloadAreas).toHaveBeenCalledTimes(1)
      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'First request detected - preloading areas'
      )
    })

    test('subsequent users get cached areas without preload', async () => {
      mockPreloadAreas.mockResolvedValue(undefined)

      await areasPreloader.register(mockServer, {})

      const onPreHandlerCall = mockServer.ext.mock.calls.find(
        (call) => call[0] === 'onPreHandler'
      )
      const onPreHandlerFunction = onPreHandlerCall[1]

      await onPreHandlerFunction(mockRequest, mockH)
      vi.clearAllMocks()

      await onPreHandlerFunction(mockRequest, mockH)
      await onPreHandlerFunction(mockRequest, mockH)
      await onPreHandlerFunction(mockRequest, mockH)

      expect(mockPreloadAreas).not.toHaveBeenCalled()
    })

    test('controller can access areas via request.getAreas', async () => {
      const mockAreas = {
        EA: [{ id: '1', name: 'Wessex', area_type: 'EA' }],
        PSO: [{ id: '2', name: 'PSO West', area_type: 'PSO', parent_id: '1' }]
      }
      mockGetAreasByType.mockResolvedValue(mockAreas)

      await areasPreloader.register(mockServer, {})

      const getAreasCall = mockServer.decorate.mock.calls.find(
        (call) => call[0] === 'request' && call[1] === 'getAreas'
      )
      const getAreasFunction = getAreasCall[2]

      // Mock request.server.areasService
      const mockRequestWithService = {
        server: {
          ...mockServer,
          areasService: {
            getAreasByType: mockGetAreasByType
          }
        }
      }

      const result = await getAreasFunction.call(mockRequestWithService)

      expect(result).toEqual(mockAreas)
    })

    test('server can access areasService directly', async () => {
      await areasPreloader.register(mockServer, {})

      const areasServiceCall = mockServer.decorate.mock.calls.find(
        (call) => call[0] === 'server' && call[1] === 'areasService'
      )

      expect(areasServiceCall).toBeDefined()
      expect(areasServiceCall[2]).toHaveProperty('preloadAreas')
      expect(areasServiceCall[2]).toHaveProperty('getAreasByType')
    })
  })
})
