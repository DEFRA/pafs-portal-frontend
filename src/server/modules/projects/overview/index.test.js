import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectOverview } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'

describe('Project Overview Routes', () => {
  describe('plugin configuration', () => {
    test('should have correct plugin name', () => {
      expect(projectOverview.plugin.name).toBe('Project - Project Overview')
    })

    test('should have register function', () => {
      expect(projectOverview.plugin.register).toBeDefined()
      expect(typeof projectOverview.plugin.register).toBe('function')
    })
  })

  describe('route registration', () => {
    let mockServer
    let registeredRoutes

    beforeEach(() => {
      registeredRoutes = []
      mockServer = {
        route: vi.fn((routes) => {
          if (Array.isArray(routes)) {
            registeredRoutes.push(...routes)
          } else {
            registeredRoutes.push(routes)
          }
        })
      }
    })

    test('should register GET route for project overview', () => {
      projectOverview.plugin.register(mockServer)

      expect(mockServer.route).toHaveBeenCalled()
      expect(registeredRoutes).toHaveLength(1)

      const route = registeredRoutes[0]
      expect(route.method).toBe('GET')
      expect(route.path).toBe(ROUTES.PROJECT.OVERVIEW)
    })

    test('should have correct pre-handlers in order', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      expect(route.options.pre).toBeDefined()
      expect(Array.isArray(route.options.pre)).toBe(true)
      expect(route.options.pre).toHaveLength(4)
    })

    test('should have requireAuth as first pre-handler', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      const firstPre = route.options.pre[0]
      expect(firstPre.method).toBeDefined()
      expect(firstPre.method.name).toBe('requireAuth')
    })

    test('should have fetchProjectForOverview as second pre-handler', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      const secondPre = route.options.pre[1]
      expect(secondPre.method).toBeDefined()
      expect(secondPre.method.name).toBe('fetchProjectForOverview')
    })

    test('should have initializeEditSessionPreHandler as third pre-handler', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      const thirdPre = route.options.pre[2]
      expect(thirdPre.method).toBeDefined()
      // The third pre-handler is now an arrow function that calls initializeEditSessionPreHandler with forceRefresh: true
      expect(typeof thirdPre.method).toBe('function')
    })

    test('should have requireViewPermission as fourth pre-handler', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      const fourthPre = route.options.pre[3]
      expect(fourthPre.method).toBeDefined()
      expect(fourthPre.method.name).toBe('requireViewPermission')
    })

    test('should have handler defined', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      expect(route.options.handler).toBeDefined()
      expect(typeof route.options.handler).toBe('function')
    })

    test('should use overviewController.getHandler', () => {
      projectOverview.plugin.register(mockServer)

      const route = registeredRoutes[0]
      expect(route.options.handler.name).toBe('getHandler')
    })

    test('should only register one route', () => {
      projectOverview.plugin.register(mockServer)

      expect(mockServer.route).toHaveBeenCalledTimes(1)
      expect(registeredRoutes).toHaveLength(1)
    })

    test('should pass array of routes to server.route', () => {
      projectOverview.plugin.register(mockServer)

      const callArg = mockServer.route.mock.calls[0][0]
      expect(Array.isArray(callArg)).toBe(true)
    })
  })

  describe('route configuration structure', () => {
    let mockServer
    let route

    beforeEach(() => {
      mockServer = {
        route: vi.fn((routes) => {
          route = Array.isArray(routes) ? routes[0] : routes
        })
      }
      projectOverview.plugin.register(mockServer)
    })

    test('should have method property', () => {
      expect(route).toHaveProperty('method')
    })

    test('should have path property', () => {
      expect(route).toHaveProperty('path')
    })

    test('should have options property', () => {
      expect(route).toHaveProperty('options')
    })

    test('should have options.pre property', () => {
      expect(route.options).toHaveProperty('pre')
    })

    test('should have options.handler property', () => {
      expect(route.options).toHaveProperty('handler')
    })

    test('should have all pre-handlers with method property', () => {
      route.options.pre.forEach((pre, index) => {
        expect(pre).toHaveProperty('method')
        expect(typeof pre.method).toBe('function')
      })
    })
  })

  describe('pre-handler execution order', () => {
    let mockServer
    let route

    beforeEach(() => {
      mockServer = {
        route: vi.fn((routes) => {
          route = Array.isArray(routes) ? routes[0] : routes
        })
      }
      projectOverview.plugin.register(mockServer)
    })

    test('should execute auth check before fetching project', () => {
      const preHandlers = route.options.pre
      const authIndex = preHandlers.findIndex(
        (p) => p.method.name === 'requireAuth'
      )
      const fetchIndex = preHandlers.findIndex(
        (p) => p.method.name === 'fetchProjectForOverview'
      )

      expect(authIndex).toBeLessThan(fetchIndex)
    })

    test('should fetch project before initializing session', () => {
      const preHandlers = route.options.pre
      const fetchIndex = preHandlers.findIndex(
        (p) => p.method.name === 'fetchProjectForOverview'
      )
      // Third pre-handler is the session initializer (arrow function calling initializeEditSessionPreHandler)
      const initIndex = 2

      expect(fetchIndex).toBeLessThan(initIndex)
    })

    test('should initialize session before checking permissions', () => {
      const preHandlers = route.options.pre
      // Third pre-handler is the session initializer (arrow function calling initializeEditSessionPreHandler)
      const initIndex = 2
      const permIndex = preHandlers.findIndex(
        (p) => p.method.name === 'requireViewPermission'
      )

      expect(initIndex).toBeLessThan(permIndex)
    })

    test('should check permissions last before handler', () => {
      const preHandlers = route.options.pre
      const lastPre = preHandlers[preHandlers.length - 1]

      expect(lastPre.method.name).toBe('requireViewPermission')
    })
  })

  describe('plugin export structure', () => {
    test('should export plugin object', () => {
      expect(projectOverview).toBeDefined()
      expect(typeof projectOverview).toBe('object')
    })

    test('should have plugin property', () => {
      expect(projectOverview).toHaveProperty('plugin')
    })

    test('should have plugin.name', () => {
      expect(projectOverview.plugin).toHaveProperty('name')
      expect(typeof projectOverview.plugin.name).toBe('string')
    })

    test('should have plugin.register', () => {
      expect(projectOverview.plugin).toHaveProperty('register')
      expect(typeof projectOverview.plugin.register).toBe('function')
    })
  })

  describe('route path validation', () => {
    let mockServer
    let route

    beforeEach(() => {
      mockServer = {
        route: vi.fn((routes) => {
          route = Array.isArray(routes) ? routes[0] : routes
        })
      }
      projectOverview.plugin.register(mockServer)
    })

    test('should use correct route path with parameter', () => {
      expect(route.path).toContain('{referenceNumber}')
    })

    test('should match expected route pattern', () => {
      // Path should contain referenceNumber parameter
      expect(route.path).toContain('{referenceNumber}')
      expect(route.path).toContain('/project')
    })
  })

  describe('initializeEditSessionPreHandler arrow function', () => {
    let mockServer
    let route
    let mockRequest
    let mockH
    let initializeEditSessionPreHandlerSpy

    beforeEach(async () => {
      // Import and mock the function
      const projectEditSession =
        await import('../helpers/project-edit-session.js')
      initializeEditSessionPreHandlerSpy = vi.spyOn(
        projectEditSession,
        'initializeEditSessionPreHandler'
      )
      initializeEditSessionPreHandlerSpy.mockResolvedValue(Symbol('continue'))

      mockServer = {
        route: vi.fn((routes) => {
          route = Array.isArray(routes) ? routes[0] : routes
        })
      }

      mockRequest = {
        params: { referenceNumber: 'test-ref' },
        pre: { projectData: { id: 1, name: 'Test Project' } },
        yar: { get: vi.fn(), set: vi.fn() },
        logger: { info: vi.fn() }
      }

      mockH = {
        continue: Symbol('continue'),
        response: vi.fn()
      }

      projectOverview.plugin.register(mockServer)
    })

    afterEach(() => {
      if (initializeEditSessionPreHandlerSpy) {
        initializeEditSessionPreHandlerSpy.mockRestore()
      }
    })

    test('should call initializeEditSessionPreHandler with correct parameters when arrow function is invoked', async () => {
      const thirdPreHandler = route.options.pre[2]

      await thirdPreHandler.method(mockRequest, mockH)

      expect(initializeEditSessionPreHandlerSpy).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        { forceRefresh: true }
      )
    })

    test('should pass forceRefresh: true to initializeEditSessionPreHandler', async () => {
      const thirdPreHandler = route.options.pre[2]

      await thirdPreHandler.method(mockRequest, mockH)

      expect(initializeEditSessionPreHandlerSpy).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({ forceRefresh: true })
      )
    })

    test('should be called with request and h parameters', async () => {
      const thirdPreHandler = route.options.pre[2]

      await thirdPreHandler.method(mockRequest, mockH)

      expect(initializeEditSessionPreHandlerSpy).toHaveBeenCalledWith(
        mockRequest,
        mockH,
        expect.any(Object)
      )
    })

    test('should return result from initializeEditSessionPreHandler', async () => {
      const expectedResult = Symbol('test-result')
      initializeEditSessionPreHandlerSpy.mockResolvedValue(expectedResult)

      const thirdPreHandler = route.options.pre[2]
      const result = await thirdPreHandler.method(mockRequest, mockH)

      expect(result).toBe(expectedResult)
    })

    test('should handle async execution properly', async () => {
      const continueSymbol = Symbol('continue')
      initializeEditSessionPreHandlerSpy.mockResolvedValue(continueSymbol)

      const thirdPreHandler = route.options.pre[2]
      const resultPromise = thirdPreHandler.method(mockRequest, mockH)

      expect(resultPromise).toBeInstanceOf(Promise)
      const result = await resultPromise
      expect(result).toBe(continueSymbol)
    })
  })
})
