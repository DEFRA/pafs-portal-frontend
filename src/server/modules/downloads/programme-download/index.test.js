import { describe, test, expect, beforeEach, vi } from 'vitest'
import { programmeDownload } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'

vi.mock('../../../common/helpers/auth/auth-middleware.js', () => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn()
}))

vi.mock('./controller.js', () => ({
  downloadGetController: { handler: vi.fn() },
  downloadGenerateController: { handler: vi.fn() },
  downloadPollController: { handler: vi.fn() },
  downloadFileController: { handler: vi.fn() }
}))

import {
  requireAuth,
  requireAdmin
} from '../../../common/helpers/auth/auth-middleware.js'

// ── helpers ───────────────────────────────────────────────────────────────────

function buildServer() {
  const registeredRoutes = []
  const mockServer = {
    route: vi.fn((routes) => {
      registeredRoutes.push(...(Array.isArray(routes) ? routes : [routes]))
    })
  }
  programmeDownload.plugin.register(mockServer)
  return { mockServer, registeredRoutes }
}

// ── plugin metadata ───────────────────────────────────────────────────────────

describe('programmeDownload plugin', () => {
  test('has the correct plugin name', () => {
    expect(programmeDownload.plugin.name).toBe('Programme Download')
  })

  test('has a register function', () => {
    expect(typeof programmeDownload.plugin.register).toBe('function')
  })

  // ── route registration ──────────────────────────────────────────────────────

  describe('route registration', () => {
    test('registers exactly 8 routes', () => {
      const { registeredRoutes } = buildServer()
      expect(registeredRoutes).toHaveLength(8)
    })

    test('calls server.route once with an array', () => {
      const { mockServer } = buildServer()
      expect(mockServer.route).toHaveBeenCalledTimes(1)
      expect(Array.isArray(mockServer.route.mock.calls[0][0])).toBe(true)
    })

    // ── programme download routes ─────────────────────────────────────────────

    describe('GET /downloads (route[0])', () => {
      let route

      beforeEach(() => {
        ;({
          registeredRoutes: [route]
        } = buildServer())
        route = buildServer().registeredRoutes[0]
      })

      test('is a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(ROUTES.DOWNLOADS.PROGRAMME)
      })

      test('has requireAuth as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAuth)
      })
    })

    describe('POST /downloads/generate (route[1])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[1]
      })

      test('is a POST route', () => {
        expect(route.method).toBe('POST')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(`${ROUTES.DOWNLOADS.PROGRAMME}/generate`)
      })

      test('has requireAuth as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAuth)
      })
    })

    describe('GET /downloads/poll (route[2])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[2]
      })

      test('is a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(`${ROUTES.DOWNLOADS.PROGRAMME}/poll`)
      })

      test('has requireAuth as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAuth)
      })
    })

    describe('GET /downloads/file/{type} (route[3])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[3]
      })

      test('is a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(`${ROUTES.DOWNLOADS.PROGRAMME}/file/{type}`)
      })

      test('has requireAuth as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAuth)
      })
    })

    // ── admin backwards-compat redirect routes ────────────────────────────────

    describe('GET /admin/downloads (route[4])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[4]
      })

      test('is a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(ROUTES.DOWNLOADS.ADMIN)
      })

      test('has requireAdmin as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAdmin)
      })

      test('handler performs a permanent redirect to the programme route', () => {
        const permanentFn = vi.fn()
        const h = { redirect: vi.fn(() => ({ permanent: permanentFn })) }
        route.handler({}, h)
        expect(h.redirect).toHaveBeenCalledWith(ROUTES.DOWNLOADS.PROGRAMME)
        expect(permanentFn).toHaveBeenCalled()
      })
    })

    describe('POST /admin/downloads/generate (route[5])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[5]
      })

      test('is a POST route', () => {
        expect(route.method).toBe('POST')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(`${ROUTES.DOWNLOADS.ADMIN}/generate`)
      })

      test('has requireAdmin as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAdmin)
      })

      test('handler performs a permanent redirect to the programme route', () => {
        const permanentFn = vi.fn()
        const h = { redirect: vi.fn(() => ({ permanent: permanentFn })) }
        route.handler({}, h)
        expect(h.redirect).toHaveBeenCalledWith(ROUTES.DOWNLOADS.PROGRAMME)
        expect(permanentFn).toHaveBeenCalled()
      })
    })

    describe('GET /admin/downloads/poll (route[6])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[6]
      })

      test('is a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(`${ROUTES.DOWNLOADS.ADMIN}/poll`)
      })

      test('has requireAdmin as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAdmin)
      })

      test('handler performs a permanent redirect to the programme route', () => {
        const permanentFn = vi.fn()
        const h = { redirect: vi.fn(() => ({ permanent: permanentFn })) }
        route.handler({}, h)
        expect(h.redirect).toHaveBeenCalledWith(ROUTES.DOWNLOADS.PROGRAMME)
        expect(permanentFn).toHaveBeenCalled()
      })
    })

    describe('GET /admin/downloads/file (route[7])', () => {
      let route

      beforeEach(() => {
        route = buildServer().registeredRoutes[7]
      })

      test('is a GET route', () => {
        expect(route.method).toBe('GET')
      })

      test('has the correct path', () => {
        expect(route.path).toBe(`${ROUTES.DOWNLOADS.ADMIN}/file`)
      })

      test('has requireAdmin as the only pre-handler', () => {
        expect(route.options.pre).toHaveLength(1)
        expect(route.options.pre[0].method).toBe(requireAdmin)
      })

      test('handler performs a permanent redirect to the programme route', () => {
        const permanentFn = vi.fn()
        const h = { redirect: vi.fn(() => ({ permanent: permanentFn })) }
        route.handler({}, h)
        expect(h.redirect).toHaveBeenCalledWith(ROUTES.DOWNLOADS.PROGRAMME)
        expect(permanentFn).toHaveBeenCalled()
      })
    })
  })
})
