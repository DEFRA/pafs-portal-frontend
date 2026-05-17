import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectImportantDates } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  requireEditPermission,
  requireEditableStatus
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { importantDatesController } from './controller.js'
import { requireFinancialYears } from '../helpers/require-financial-years.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('../helpers/permissions.js')
vi.mock('../helpers/project-edit-session.js')
vi.mock('./controller.js')
vi.mock('../helpers/require-financial-years.js', () => ({
  requireFinancialYears: vi.fn()
}))

const ROUTE_STEPS = 7
const METHODS_PER_STEP = 2
const STEP_ROUTE_KEYS = [
  'START_OUTLINE_BUSINESS_CASE',
  'COMPLETE_OUTLINE_BUSINESS_CASE',
  'AWARD_MAIN_CONTRACT',
  'START_WORK',
  'START_BENEFITS',
  'COULD_START_EARLY',
  'EARLIEST_START_DATE'
]
const EXPECTED_PRE_HANDLERS = [
  { method: requireAuth },
  { method: fetchProjectForEdit },
  { method: initializeEditSessionPreHandler },
  { method: requireEditableStatus },
  { method: requireEditPermission },
  { method: requireFinancialYears }
]

describe('projectImportantDates plugin', () => {
  test('plugin has the correct name', () => {
    expect(projectImportantDates.plugin.name).toBe('Project - Important Dates')
  })

  describe('register(server)', () => {
    let registeredRoutes

    beforeEach(() => {
      const mockServer = { route: vi.fn() }
      projectImportantDates.plugin.register(mockServer)
      registeredRoutes = mockServer.route.mock.calls[0][0]
    })

    test('registers one route per method per step', () => {
      expect(registeredRoutes).toHaveLength(ROUTE_STEPS * METHODS_PER_STEP)
    })

    test.each(STEP_ROUTE_KEYS)(
      'registers GET and POST routes for %s',
      (routeKey) => {
        const routes = registeredRoutes.filter(
          (r) => r.path === ROUTES.PROJECT.EDIT[routeKey]
        )
        expect(routes).toHaveLength(METHODS_PER_STEP)
        expect(routes[0].method).toBe('GET')
        expect(routes[1].method).toBe('POST')
      }
    )

    test('steps are registered in the correct order', () => {
      const paths = registeredRoutes
        .filter((r) => r.method === 'GET')
        .map((r) => r.path)
      expect(paths).toEqual(STEP_ROUTE_KEYS.map((k) => ROUTES.PROJECT.EDIT[k]))
    })

    test('all routes include the requireFinancialYears gate', () => {
      registeredRoutes.forEach((route) => {
        expect(route.options.pre).toEqual(EXPECTED_PRE_HANDLERS)
      })
    })

    test('GET routes use importantDatesController.getHandler', () => {
      registeredRoutes
        .filter((r) => r.method === 'GET')
        .forEach((r) =>
          expect(r.options.handler).toBe(importantDatesController.getHandler)
        )
    })

    test('POST routes use importantDatesController.postHandler', () => {
      registeredRoutes
        .filter((r) => r.method === 'POST')
        .forEach((r) =>
          expect(r.options.handler).toBe(importantDatesController.postHandler)
        )
    })
  })
})
