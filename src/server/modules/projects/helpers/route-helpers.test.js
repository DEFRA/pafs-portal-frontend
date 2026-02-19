import { describe, test, expect, vi } from 'vitest'
import { createRoutePair, createEditRoutePair } from './route-helpers.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { requireEditPermission } from './permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from './project-edit-session.js'

vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('./permissions.js')
vi.mock('./project-edit-session.js')

const mockController = {
  getHandler: vi.fn(),
  postHandler: vi.fn()
}

const expectedEditPreHandlers = [
  { method: requireAuth },
  { method: fetchProjectForEdit },
  { method: initializeEditSessionPreHandler },
  { method: requireEditPermission }
]

describe('route-helpers', () => {
  describe('createRoutePair', () => {
    test('should return 4 routes (GET/POST for create and edit)', () => {
      const createPreHandlers = [{ method: requireAuth }]
      const routes = createRoutePair(
        '/create/path',
        '/edit/path',
        createPreHandlers,
        mockController
      )

      expect(routes).toHaveLength(4)
    })

    test('should create GET and POST routes for create path', () => {
      const createPreHandlers = [{ method: requireAuth }]
      const routes = createRoutePair(
        '/create/path',
        '/edit/path',
        createPreHandlers,
        mockController
      )

      const createGet = routes[0]
      const createPost = routes[1]

      expect(createGet.method).toBe('GET')
      expect(createGet.path).toBe('/create/path')
      expect(createGet.options.pre).toBe(createPreHandlers)
      expect(createGet.options.handler).toBe(mockController.getHandler)

      expect(createPost.method).toBe('POST')
      expect(createPost.path).toBe('/create/path')
      expect(createPost.options.pre).toBe(createPreHandlers)
      expect(createPost.options.handler).toBe(mockController.postHandler)
    })

    test('should create GET and POST routes for edit path with edit pre-handlers', () => {
      const createPreHandlers = [{ method: requireAuth }]
      const routes = createRoutePair(
        '/create/path',
        '/edit/path',
        createPreHandlers,
        mockController
      )

      const editGet = routes[2]
      const editPost = routes[3]

      expect(editGet.method).toBe('GET')
      expect(editGet.path).toBe('/edit/path')
      expect(editGet.options.pre).toEqual(expectedEditPreHandlers)
      expect(editGet.options.handler).toBe(mockController.getHandler)

      expect(editPost.method).toBe('POST')
      expect(editPost.path).toBe('/edit/path')
      expect(editPost.options.pre).toEqual(expectedEditPreHandlers)
      expect(editPost.options.handler).toBe(mockController.postHandler)
    })
  })

  describe('createEditRoutePair', () => {
    test('should return 2 routes (GET and POST for edit)', () => {
      const routes = createEditRoutePair('/edit/path', mockController)

      expect(routes).toHaveLength(2)
    })

    test('should create GET route with edit pre-handlers', () => {
      const routes = createEditRoutePair('/edit/path', mockController)
      const getRoute = routes[0]

      expect(getRoute.method).toBe('GET')
      expect(getRoute.path).toBe('/edit/path')
      expect(getRoute.options.pre).toEqual(expectedEditPreHandlers)
      expect(getRoute.options.handler).toBe(mockController.getHandler)
    })

    test('should create POST route with edit pre-handlers', () => {
      const routes = createEditRoutePair('/edit/path', mockController)
      const postRoute = routes[1]

      expect(postRoute.method).toBe('POST')
      expect(postRoute.path).toBe('/edit/path')
      expect(postRoute.options.pre).toEqual(expectedEditPreHandlers)
      expect(postRoute.options.handler).toBe(mockController.postHandler)
    })

    test('should use the correct path for each route', () => {
      const routes = createEditRoutePair(
        '/projects/{referenceNumber}/edit/goals',
        mockController
      )

      expect(routes[0].path).toBe('/projects/{referenceNumber}/edit/goals')
      expect(routes[1].path).toBe('/projects/{referenceNumber}/edit/goals')
    })
  })
})
