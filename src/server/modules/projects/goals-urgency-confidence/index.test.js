import { describe, test, expect, vi } from 'vitest'
import { projectGoalsUrgencyConfidence } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { goalsUrgencyConfidenceController } from './controller.js'

vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('../helpers/permissions.js')
vi.mock('../helpers/project-edit-session.js')
vi.mock('./controller.js')

const EXPECTED_ROUTE_COUNT = 12 // 6 steps x 2 methods (GET and POST)

describe('projectGoalsUrgencyConfidence plugin', () => {
  test('should have correct plugin name', () => {
    expect(projectGoalsUrgencyConfidence.plugin.name).toBe(
      'Project - Goals, Urgency & Confidence'
    )
  })

  test('should register 12 routes (6 steps × 2 methods)', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(EXPECTED_ROUTE_COUNT)
  })

  test('should register GET and POST routes for PROJECT_GOALS', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const getRoute = routes.find(
      (r) => r.method === 'GET' && r.path === ROUTES.PROJECT.EDIT.PROJECT_GOALS
    )
    const postRoute = routes.find(
      (r) => r.method === 'POST' && r.path === ROUTES.PROJECT.EDIT.PROJECT_GOALS
    )

    expect(getRoute).toBeDefined()
    expect(postRoute).toBeDefined()
    expect(getRoute.options.handler).toBe(
      goalsUrgencyConfidenceController.getHandler
    )
    expect(postRoute.options.handler).toBe(
      goalsUrgencyConfidenceController.postHandler
    )
  })

  test('should register GET and POST routes for URGENCY_REASON', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.URGENCY_REASON
    )

    expect(matched).toHaveLength(2)
    expect(matched[0].method).toBe('GET')
    expect(matched[1].method).toBe('POST')
  })

  test('should register GET and POST routes for URGENCY_DETAILS', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.URGENCY_DETAILS
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for CONFIDENCE_HOMES_BETTER_PROTECTED', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for CONFIDENCE_HOMES_BY_GATEWAY_FOUR', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for CONFIDENCE_SECURED_PARTNERSHIP_FUNDING', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) =>
        r.path === ROUTES.PROJECT.EDIT.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
    )

    expect(matched).toHaveLength(2)
  })

  test('should configure all routes with correct pre-handlers', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]

    routes.forEach((route) => {
      expect(route.options.pre).toEqual([
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireEditPermission }
      ])
    })
  })

  test('should use the same controller for all routes', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const getRoutes = routes.filter((r) => r.method === 'GET')
    const postRoutes = routes.filter((r) => r.method === 'POST')

    getRoutes.forEach((route) => {
      expect(route.options.handler).toBe(
        goalsUrgencyConfidenceController.getHandler
      )
    })

    postRoutes.forEach((route) => {
      expect(route.options.handler).toBe(
        goalsUrgencyConfidenceController.postHandler
      )
    })
  })

  test('should register routes in correct order', () => {
    const mockServer = { route: vi.fn() }

    projectGoalsUrgencyConfidence.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const routePaths = routes
      .filter((r) => r.method === 'GET')
      .map((r) => r.path)

    expect(routePaths).toEqual([
      ROUTES.PROJECT.EDIT.PROJECT_GOALS,
      ROUTES.PROJECT.EDIT.URGENCY_REASON,
      ROUTES.PROJECT.EDIT.URGENCY_DETAILS,
      ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BETTER_PROTECTED,
      ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
      ROUTES.PROJECT.EDIT.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
    ])
  })
})
