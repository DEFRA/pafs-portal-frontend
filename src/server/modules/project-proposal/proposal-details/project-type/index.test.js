import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('../../common/helpers/auth/auth-middleware.js', () => ({
  requireAuth: vi.fn()
}))

vi.mock('../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT_PROPOSAL: {
      PROJECT_TYPE: '/project-proposal/project-type'
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

  test('should register GET and POST routes on server', () => {
    projectType.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(2)

    expect(routes[0]).toEqual(
      expect.objectContaining({
        method: 'GET',
        path: '/project-proposal/project-type'
      })
    )
    expect(routes[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        path: '/project-proposal/project-type'
      })
    )
  })

  test('should configure routes with auth middleware', () => {
    projectType.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0].options.pre).toBeDefined()
    expect(routes[0].options.pre).toHaveLength(2)
    expect(routes[0].options.pre[0]).toHaveProperty('method')
    expect(routes[1].options.pre).toBeDefined()
  })

  test('should include controller handler', () => {
    projectType.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toHaveProperty('handler')
    expect(routes[1]).toHaveProperty('handler')
  })
})
