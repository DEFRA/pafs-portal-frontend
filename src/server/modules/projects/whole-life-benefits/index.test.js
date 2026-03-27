import { describe, expect, test, vi } from 'vitest'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../helpers/route-helpers.js', () => ({
  createEditRoutePair: vi.fn(() => [
    { method: 'GET', path: '/mock/get', options: {} },
    { method: 'POST', path: '/mock/post', options: {} }
  ])
}))

vi.mock('./controller.js', () => ({
  wholeLifeBenefitsController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  }
}))

const { createEditRoutePair } = await import('../helpers/route-helpers.js')
const { wholeLifeBenefitsController } = await import('./controller.js')
const { projectWholeLifeBenefits } = await import('./index.js')

describe('projectWholeLifeBenefits plugin', () => {
  test('has the correct plugin name', () => {
    expect(projectWholeLifeBenefits.plugin.name).toBe(
      'Project - Whole Life Benefits'
    )
  })

  test('registers routes from createEditRoutePair', () => {
    const mockServer = { route: vi.fn() }

    projectWholeLifeBenefits.plugin.register(mockServer)

    expect(createEditRoutePair).toHaveBeenCalledWith(
      ROUTES.PROJECT.EDIT.WHOLE_LIFE_BENEFITS,
      wholeLifeBenefitsController
    )
    expect(mockServer.route).toHaveBeenCalledWith([
      { method: 'GET', path: '/mock/get', options: {} },
      { method: 'POST', path: '/mock/post', options: {} }
    ])
  })

  test('calls server.route exactly once', () => {
    const mockServer = { route: vi.fn() }

    projectWholeLifeBenefits.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
  })
})
