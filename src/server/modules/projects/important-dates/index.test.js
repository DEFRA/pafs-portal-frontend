import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectImportantDates } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { importantDatesController } from './controller.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('../helpers/permissions.js')
vi.mock('../helpers/project-edit-session.js')
vi.mock('./controller.js')

describe('projectImportantDates plugin', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      route: vi.fn()
    }
  })

  test('should have correct plugin name', () => {
    expect(projectImportantDates.plugin.name).toBe('Project - Important Dates')
  })

  test('should register 14 routes (7 steps × 2 methods)', () => {
    projectImportantDates.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const registeredRoutes = mockServer.route.mock.calls[0][0]
    expect(registeredRoutes).toHaveLength(14) // 7 steps × (GET + POST)
  })

  test('should register GET and POST routes for START_OUTLINE_BUSINESS_CASE', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const getRoute = registeredRoutes.find(
      (r) =>
        r.method === 'GET' &&
        r.path === ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE
    )
    const postRoute = registeredRoutes.find(
      (r) =>
        r.method === 'POST' &&
        r.path === ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE
    )

    expect(getRoute).toBeDefined()
    expect(postRoute).toBeDefined()
    expect(getRoute.options.handler).toBe(importantDatesController.getHandler)
    expect(postRoute.options.handler).toBe(importantDatesController.postHandler)
  })

  test('should register GET and POST routes for COMPLETE_OUTLINE_BUSINESS_CASE', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const getRoute = registeredRoutes.find(
      (r) =>
        r.method === 'GET' &&
        r.path === ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE
    )
    const postRoute = registeredRoutes.find(
      (r) =>
        r.method === 'POST' &&
        r.path === ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE
    )

    expect(getRoute).toBeDefined()
    expect(postRoute).toBeDefined()
  })

  test('should register GET and POST routes for AWARD_MAIN_CONTRACT', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const routes = registeredRoutes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT
    )

    expect(routes).toHaveLength(2)
    expect(routes[0].method).toBe('GET')
    expect(routes[1].method).toBe('POST')
  })

  test('should register GET and POST routes for START_WORK', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const routes = registeredRoutes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.START_WORK
    )

    expect(routes).toHaveLength(2)
  })

  test('should register GET and POST routes for START_BENEFITS', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const routes = registeredRoutes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.START_BENEFITS
    )

    expect(routes).toHaveLength(2)
  })

  test('should register GET and POST routes for COULD_START_EARLY', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const routes = registeredRoutes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.COULD_START_EARLY
    )

    expect(routes).toHaveLength(2)
  })

  test('should register GET and POST routes for EARLIEST_START_DATE', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const routes = registeredRoutes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.EARLIEST_START_DATE
    )

    expect(routes).toHaveLength(2)
  })

  test('should configure all routes with correct pre-handlers', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]

    registeredRoutes.forEach((route) => {
      expect(route.options.pre).toEqual([
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireEditPermission }
      ])
    })
  })

  test('should use the same controller for all routes', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const getRoutes = registeredRoutes.filter((r) => r.method === 'GET')
    const postRoutes = registeredRoutes.filter((r) => r.method === 'POST')

    getRoutes.forEach((route) => {
      expect(route.options.handler).toBe(importantDatesController.getHandler)
    })

    postRoutes.forEach((route) => {
      expect(route.options.handler).toBe(importantDatesController.postHandler)
    })
  })

  test('should register routes in correct order', () => {
    projectImportantDates.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const routePaths = registeredRoutes
      .filter((r) => r.method === 'GET')
      .map((r) => r.path)

    expect(routePaths).toEqual([
      ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
      ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE,
      ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT,
      ROUTES.PROJECT.EDIT.START_WORK,
      ROUTES.PROJECT.EDIT.START_BENEFITS,
      ROUTES.PROJECT.EDIT.COULD_START_EARLY,
      ROUTES.PROJECT.EDIT.EARLIEST_START_DATE
    ])
  })
})
