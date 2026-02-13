import { describe, test, expect, vi } from 'vitest'
import { projectRiskAndProperties } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { riskAndPropertiesController } from './controller.js'

vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('../helpers/permissions.js')
vi.mock('../helpers/project-edit-session.js')
vi.mock('./controller.js')

// Test constants
const EXPECTED_ROUTE_COUNT = 18 // 9 steps x 2 methods (GET and POST)
const PRE_HANDLER_INDEX_REQUIRE_EDIT = 3

describe('projectRiskAndProperties plugin', () => {
  test('should have correct plugin name', () => {
    expect(projectRiskAndProperties.plugin.name).toBe(
      'Project - Risk and Properties Benefitting'
    )
  })

  test('should register all risk and properties routes', () => {
    const mockServer = {
      route: vi.fn()
    }

    projectRiskAndProperties.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)

    const routes = mockServer.route.mock.calls[0][0]

    // Should have 18 routes (9 steps x 2 methods each - GET and POST)
    expect(routes).toHaveLength(EXPECTED_ROUTE_COUNT)
  })

  test('should register GET and POST routes for RISK step', () => {
    const mockServer = {
      route: vi.fn()
    }

    projectRiskAndProperties.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]

    const riskGetRoute = routes.find(
      (r) => r.path === ROUTES.PROJECT.EDIT.RISK && r.method === 'GET'
    )
    const riskPostRoute = routes.find(
      (r) => r.path === ROUTES.PROJECT.EDIT.RISK && r.method === 'POST'
    )

    expect(riskGetRoute).toBeDefined()
    expect(riskPostRoute).toBeDefined()
    expect(riskGetRoute.options.handler).toBe(
      riskAndPropertiesController.getHandler
    )
    expect(riskPostRoute.options.handler).toBe(
      riskAndPropertiesController.postHandler
    )
  })

  test('should register GET and POST routes for MAIN_RISK step', () => {
    const mockServer = {
      route: vi.fn()
    }

    projectRiskAndProperties.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]

    const mainRiskGetRoute = routes.find(
      (r) => r.path === ROUTES.PROJECT.EDIT.MAIN_RISK && r.method === 'GET'
    )
    const mainRiskPostRoute = routes.find(
      (r) => r.path === ROUTES.PROJECT.EDIT.MAIN_RISK && r.method === 'POST'
    )

    expect(mainRiskGetRoute).toBeDefined()
    expect(mainRiskPostRoute).toBeDefined()
  })

  test('should register GET and POST routes for PROPERTY_AFFECTED_FLOODING step', () => {
    const mockServer = {
      route: vi.fn()
    }

    projectRiskAndProperties.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]

    const floodingGetRoute = routes.find(
      (r) =>
        r.path === ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING &&
        r.method === 'GET'
    )
    const floodingPostRoute = routes.find(
      (r) =>
        r.path === ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING &&
        r.method === 'POST'
    )

    expect(floodingGetRoute).toBeDefined()
    expect(floodingPostRoute).toBeDefined()
  })

  test('should register GET and POST routes for PROPERTY_AFFECTED_COASTAL_EROSION step', () => {
    const mockServer = {
      route: vi.fn()
    }

    projectRiskAndProperties.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]

    const coastalGetRoute = routes.find(
      (r) =>
        r.path === ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION &&
        r.method === 'GET'
    )
    const coastalPostRoute = routes.find(
      (r) =>
        r.path === ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION &&
        r.method === 'POST'
    )

    expect(coastalGetRoute).toBeDefined()
    expect(coastalPostRoute).toBeDefined()
  })

  test('should configure pre-handlers for all routes', () => {
    const mockServer = {
      route: vi.fn()
    }

    projectRiskAndProperties.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]

    routes.forEach((route) => {
      expect(route.options.pre).toBeDefined()
      expect(route.options.pre).toHaveLength(4)
      expect(route.options.pre[0].method).toBe(requireAuth)
      expect(route.options.pre[1].method).toBe(fetchProjectForEdit)
      expect(route.options.pre[2].method).toBe(initializeEditSessionPreHandler)
      expect(route.options.pre[PRE_HANDLER_INDEX_REQUIRE_EDIT].method).toBe(
        requireEditPermission
      )
    })
  })
})
