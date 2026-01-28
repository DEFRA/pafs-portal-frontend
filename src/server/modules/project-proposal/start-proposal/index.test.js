import { describe, test, expect, beforeEach, vi } from 'vitest'

vi.mock('../../common/helpers/auth/auth-middleware.js', () => ({
  requireAuth: vi.fn()
}))

vi.mock('../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT_PROPOSAL: {
      START_PROPOSAL: '/project-proposal/start'
    }
  }
}))

const { projectProposalStart } = await import('./index.js')

describe('projectProposalStart plugin', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      route: vi.fn()
    }
  })

  test('should have correct plugin name', () => {
    expect(projectProposalStart.plugin.name).toBe('Start Proposal')
  })

  test('should register routes on server', () => {
    projectProposalStart.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    expect(mockServer.route).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          method: 'GET',
          path: '/project-proposal/start'
        })
      ])
    )
  })

  test('should configure route with auth middleware', () => {
    projectProposalStart.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0].options.pre).toBeDefined()
    expect(routes[0].options.pre).toHaveLength(1)
    expect(routes[0].options.pre[0]).toHaveProperty('method')
  })

  test('should include controller handler', () => {
    projectProposalStart.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    expect(routes[0]).toHaveProperty('handler')
  })
})
