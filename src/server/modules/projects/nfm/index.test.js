import { describe, test, expect, vi } from 'vitest'
import { projectNfm } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'

describe('projectNfm plugin', () => {
  test('registers the new NFM land-use routes', () => {
    const server = {
      route: vi.fn()
    }

    projectNfm.plugin.register(server)

    const registeredRoutes = server.route.mock.calls[0][0]
    const registeredPaths = registeredRoutes.map((route) => route.path)

    expect(registeredPaths).toContain(
      ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND_FOR_TIMBER_HARVESTING
    )
    expect(registeredPaths).toContain(
      ROUTES.PROJECT.EDIT.NFM.LAND_USE_PEATLAND_DEGRADED
    )

    const timberRoutes = registeredRoutes.filter(
      (route) =>
        route.path ===
        ROUTES.PROJECT.EDIT.NFM.LAND_USE_WOODLAND_FOR_TIMBER_HARVESTING
    )
    const degradedRoutes = registeredRoutes.filter(
      (route) =>
        route.path === ROUTES.PROJECT.EDIT.NFM.LAND_USE_PEATLAND_DEGRADED
    )

    expect(timberRoutes.map((route) => route.method)).toEqual(['GET', 'POST'])
    expect(degradedRoutes.map((route) => route.method)).toEqual(['GET', 'POST'])
  })
})
