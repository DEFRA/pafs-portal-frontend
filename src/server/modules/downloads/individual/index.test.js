import { describe, test, expect, beforeEach, vi } from 'vitest'
import { individualDownloads } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../../../common/helpers/auth/auth-middleware.js', () => ({
  requireAuth: vi.fn()
}))

vi.mock('../../projects/helpers/project-edit-session.js', () => ({
  fetchProjectForOverview: vi.fn(),
  initializeEditSessionPreHandler: vi.fn()
}))

vi.mock('../../projects/helpers/permissions.js', () => ({
  requireViewPermission: vi.fn()
}))

vi.mock('./controller.js', () => ({
  individualDownloadsController: {
    getHandler: vi.fn(),
    downloadModerationHandler: vi.fn()
  }
}))

import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForOverview,
  initializeEditSessionPreHandler
} from '../../projects/helpers/project-edit-session.js'
import { requireViewPermission } from '../../projects/helpers/permissions.js'

describe('individualDownloads plugin', () => {
  describe('plugin configuration', () => {
    test('should have correct plugin name', () => {
      expect(individualDownloads.plugin.name).toBe(
        'Downloads - Individual Project'
      )
    })

    test('should have a register function', () => {
      expect(individualDownloads.plugin.register).toBeDefined()
      expect(typeof individualDownloads.plugin.register).toBe('function')
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

    test('should register exactly two routes', () => {
      individualDownloads.plugin.register(mockServer)

      expect(mockServer.route).toHaveBeenCalledTimes(1)
      expect(registeredRoutes).toHaveLength(2)
    })

    test('should pass an array of routes to server.route', () => {
      individualDownloads.plugin.register(mockServer)

      expect(Array.isArray(mockServer.route.mock.calls[0][0])).toBe(true)
    })

    describe('individual downloads route (route[0])', () => {
      let route

      beforeEach(() => {
        individualDownloads.plugin.register(mockServer)
        route = registeredRoutes[0]
      })

      test('should be a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('should have the correct path', () => {
        expect(route.path).toBe(ROUTES.DOWNLOADS.INDIVIDUAL)
      })

      test('should have exactly 4 pre-handlers', () => {
        expect(route.options.pre).toHaveLength(4)
      })

      test('should have requireAuth as first pre-handler', () => {
        expect(route.options.pre[0].method).toBe(requireAuth)
      })

      test('should have fetchProjectForOverview as second pre-handler', () => {
        expect(route.options.pre[1].method).toBe(fetchProjectForOverview)
      })

      test('should have an arrow function wrapping initializeEditSessionPreHandler as third pre-handler', () => {
        expect(typeof route.options.pre[2].method).toBe('function')
      })

      test('third pre-handler should call initializeEditSessionPreHandler with forceRefresh: true', async () => {
        const mockRequest = {}
        const mockH = {}
        await route.options.pre[2].method(mockRequest, mockH)

        expect(initializeEditSessionPreHandler).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          { forceRefresh: true }
        )
      })

      test('should have requireViewPermission as fourth pre-handler', () => {
        expect(route.options.pre[3].method).toBe(requireViewPermission)
      })

      test('should have a handler function defined', () => {
        expect(typeof route.options.handler).toBe('function')
      })

      test('all pre-handlers should have a method property', () => {
        route.options.pre.forEach((pre) => {
          expect(pre).toHaveProperty('method')
          expect(typeof pre.method).toBe('function')
        })
      })
    })

    describe('moderation download route (route[1])', () => {
      let route

      beforeEach(() => {
        individualDownloads.plugin.register(mockServer)
        route = registeredRoutes[1]
      })

      test('should be a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('should have the correct path', () => {
        expect(route.path).toBe(ROUTES.DOWNLOADS.MODERATION)
      })

      test('should have exactly 4 pre-handlers', () => {
        expect(route.options.pre).toHaveLength(4)
      })

      test('should have requireAuth as first pre-handler', () => {
        expect(route.options.pre[0].method).toBe(requireAuth)
      })

      test('should have fetchProjectForOverview as second pre-handler', () => {
        expect(route.options.pre[1].method).toBe(fetchProjectForOverview)
      })

      test('should have an arrow function wrapping initializeEditSessionPreHandler as third pre-handler', () => {
        expect(typeof route.options.pre[2].method).toBe('function')
      })

      test('third pre-handler should call initializeEditSessionPreHandler with forceRefresh: true', async () => {
        const mockRequest = {}
        const mockH = {}
        await route.options.pre[2].method(mockRequest, mockH)

        expect(initializeEditSessionPreHandler).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          { forceRefresh: true }
        )
      })

      test('should have requireViewPermission as fourth pre-handler', () => {
        expect(route.options.pre[3].method).toBe(requireViewPermission)
      })

      test('should have a handler function defined', () => {
        expect(typeof route.options.handler).toBe('function')
      })

      test('all pre-handlers should have a method property', () => {
        route.options.pre.forEach((pre) => {
          expect(pre).toHaveProperty('method')
          expect(typeof pre.method).toBe('function')
        })
      })
    })
  })
})
