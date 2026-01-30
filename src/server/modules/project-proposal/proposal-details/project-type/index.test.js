import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('../../common/helpers/auth/auth-middleware.js', () => ({
  requireAuth: vi.fn()
}))

vi.mock('../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT_PROPOSAL: {
      PROJECT_TYPE: '/project-proposal/project-type',
      EDIT: {
        PROJECT_TYPE: '/project-proposal/project-type/{referenceNumber}/edit'
      }
    }
  }
}))

const { projectType } = await import('./index.js')

describe('projectType plugin', () => {
  let mockServer

  beforeEach(() => {
    mockServer = { route: vi.fn() }
  })

  test('should have correct plugin name', () => {
    expect(projectType.plugin.name).toBe('Project Proposal - Project Type')
  })

  test('should register GET and POST routes for both normal and edit modes', () => {
    projectType.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(4)

    expect(routes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/project-proposal/project-type'
      })
    )
    expect(routes[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/project-proposal/project-type/{referenceNumber}/edit'
      })
    )
    expect(routes[2]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/project-proposal/project-type'
      })
    )
    expect(routes[3]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/project-proposal/project-type/{referenceNumber}/edit'
      })
    )
  })

  test('should configure normal mode routes with requireAuth and requireProjectName', () => {
    projectType.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    // Normal GET route
    expect(routes[0].options.pre).toBeDefined()
    expect(routes[0].options.pre).toHaveLength(2)
    expect(routes[0].options.pre[0]).toHaveProperty('method')

    // Normal POST route
    expect(routes[2].options.pre).toBeDefined()
    expect(routes[2].options.pre).toHaveLength(2)
  })

  test('should configure edit mode routes with requireAuth only', () => {
    projectType.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    // Edit GET route
    expect(routes[1].options.pre).toBeDefined()
    expect(routes[1].options.pre).toHaveLength(1)
    expect(routes[1].options.pre[0]).toHaveProperty('method')

    // Edit POST route
    expect(routes[3].options.pre).toBeDefined()
    expect(routes[3].options.pre).toHaveLength(1)
  })

  test('should include controller handler for all routes', () => {
    projectType.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toHaveProperty('handler')
    expect(routes[1]).toHaveProperty('handler')
    expect(routes[2]).toHaveProperty('handler')
    expect(routes[3]).toHaveProperty('handler')
  })
})
