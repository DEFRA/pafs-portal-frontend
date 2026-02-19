import { describe, test, expect, vi } from 'vitest'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../helpers/permissions.js', () => ({
  createConditionalPreHandler: vi.fn(() => vi.fn()),
  requireEditPermission: vi.fn()
}))

vi.mock('../helpers/route-helpers.js', async (importOriginal) => {
  const original = await importOriginal()
  return {
    ...original,
    createEditRoutePair: original.createEditRoutePair
  }
})

vi.mock('../../../common/helpers/auth/auth-middleware.js', () => ({
  requireAuth: vi.fn()
}))

vi.mock('../helpers/project-edit-session.js', () => ({
  fetchProjectForEdit: vi.fn(),
  initializeEditSessionPreHandler: vi.fn()
}))

vi.mock('./controller.js', () => ({
  environmentalBenefitsController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  }
}))

const { projectEnvironmentalBenefits } = await import('./index.js')
const { environmentalBenefitsController } = await import('./controller.js')
const { createConditionalPreHandler } =
  await import('../helpers/permissions.js')

const EXPECTED_ROUTE_COUNT = 46 // 23 steps x 2 methods (GET and POST)

describe('projectEnvironmentalBenefits plugin', () => {
  test('should have correct plugin name', () => {
    expect(projectEnvironmentalBenefits.plugin.name).toBe(
      'Project - Environmental Benefits'
    )
  })

  test('should register correct number of routes', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(EXPECTED_ROUTE_COUNT)
  })

  test('should register GET and POST routes for ENVIRONMENTAL_BENEFITS', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS
    )

    expect(matched).toHaveLength(2)
    expect(matched[0].method).toBe('GET')
    expect(matched[1].method).toBe('POST')
  })

  test('should register GET and POST routes for INTERTIDAL_HABITAT', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) =>
        r.path ===
        ROUTES.PROJECT.EDIT.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for WOODLAND', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.WOODLAND
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for COMPREHENSIVE_RESTORATION', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.COMPREHENSIVE_RESTORATION
    )

    expect(matched).toHaveLength(2)
  })

  test('should register GET and POST routes for CREATE_HABITAT_WATERCOURSE', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const matched = routes.filter(
      (r) => r.path === ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE
    )

    expect(matched).toHaveLength(2)
  })

  test('should call createConditionalPreHandler for each gate field', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    // Should be called 12 times: 1 for environmental benefits enabled
    // + 11 for each habitat/restoration type
    expect(createConditionalPreHandler).toHaveBeenCalledTimes(12)
  })

  test('should register 23 route pairs via createEditRoutePair', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    // 23 route pairs: 1 main gate + 11 gate questions + 11 quantity questions
    // = 46 total routes (GET + POST each)
    const routes = mockServer.route.mock.calls[0][0]
    expect(routes).toHaveLength(EXPECTED_ROUTE_COUNT)
    expect(routes.filter((r) => r.method === 'GET')).toHaveLength(23)
    expect(routes.filter((r) => r.method === 'POST')).toHaveLength(23)
  })

  test('should use the same controller for all routes', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const getRoutes = routes.filter((r) => r.method === 'GET')
    const postRoutes = routes.filter((r) => r.method === 'POST')

    getRoutes.forEach((route) => {
      expect(route.options.handler).toBe(
        environmentalBenefitsController.getHandler
      )
    })

    postRoutes.forEach((route) => {
      expect(route.options.handler).toBe(
        environmentalBenefitsController.postHandler
      )
    })
  })

  test('should register routes in correct order', () => {
    const mockServer = { route: vi.fn() }

    projectEnvironmentalBenefits.plugin.register(mockServer)

    const routes = mockServer.route.mock.calls[0][0]
    const routePaths = routes
      .filter((r) => r.method === 'GET')
      .map((r) => r.path)

    expect(routePaths).toEqual([
      ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS,
      ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT,
      ROUTES.PROJECT.EDIT.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.WOODLAND,
      ROUTES.PROJECT.EDIT.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.WET_WOODLAND,
      ROUTES.PROJECT.EDIT.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.WETLAND_OR_WET_GRASSLAND,
      ROUTES.PROJECT.EDIT
        .HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.GRASSLAND,
      ROUTES.PROJECT.EDIT.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.HEATHLAND,
      ROUTES.PROJECT.EDIT.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.PONDS_LAKES,
      ROUTES.PROJECT.EDIT.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.ARABLE_LAND,
      ROUTES.PROJECT.EDIT
        .HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
      ROUTES.PROJECT.EDIT.COMPREHENSIVE_RESTORATION,
      ROUTES.PROJECT.EDIT
        .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
      ROUTES.PROJECT.EDIT.PARTIAL_RESTORATION,
      ROUTES.PROJECT.EDIT.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
      ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE,
      ROUTES.PROJECT.EDIT.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE
    ])
  })
})
