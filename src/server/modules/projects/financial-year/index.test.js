import { describe, test, expect, beforeEach, vi } from 'vitest'
import { projectFinancialYear } from './index.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  requireProposalCreator,
  requireFinancialStartYearSet,
  requirePrimaryInterventionTypeSet,
  requireEditPermission,
  requireEditableStatus,
  noEditSessionRequired
} from '../helpers/permissions.js'
import {
  fetchProjectForEdit,
  initializeEditSessionPreHandler
} from '../helpers/project-edit-session.js'
import { financialYearController } from './controller.js'
import { financialYearWarningController } from './helpers/financial-year-warning-controller.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/auth-middleware.js')
vi.mock('../helpers/permissions.js')
vi.mock('../helpers/project-edit-session.js')
vi.mock('./controller.js')
vi.mock('./helpers/financial-year-warning-controller.js')

describe('projectFinancialYear plugin', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      route: vi.fn()
    }
  })

  test('should have correct plugin name', () => {
    expect(projectFinancialYear.plugin.name).toBe('Project - Financial Year')
  })

  test('should register 18 routes (4 steps × 2 modes × 2 methods + warning edit pair)', () => {
    projectFinancialYear.plugin.register(mockServer)

    expect(mockServer.route).toHaveBeenCalledTimes(1)
    const registeredRoutes = mockServer.route.mock.calls[0][0]
    expect(registeredRoutes).toHaveLength(18)
  })

  describe('Create mode routes', () => {
    test('should register GET route for FINANCIAL_START_YEAR with correct pre-handlers', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' && r.path === ROUTES.PROJECT.FINANCIAL_START_YEAR
      )

      expect(route).toBeDefined()
      expect(route.options.pre).toEqual([
        { method: requireProposalCreator },
        { method: noEditSessionRequired },
        requirePrimaryInterventionTypeSet
      ])
      expect(route.options.handler).toBe(financialYearController.getHandler)
    })

    test('should register POST route for FINANCIAL_START_YEAR', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' && r.path === ROUTES.PROJECT.FINANCIAL_START_YEAR
      )

      expect(route).toBeDefined()
      expect(route.options.handler).toBe(financialYearController.postHandler)
    })

    test('should register GET route for FINANCIAL_START_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' &&
          r.path === ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL
      )

      expect(route).toBeDefined()
      expect(route.options.pre).toEqual([
        { method: requireProposalCreator },
        { method: noEditSessionRequired },
        requirePrimaryInterventionTypeSet
      ])
    })

    test('should register POST route for FINANCIAL_START_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' &&
          r.path === ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL
      )

      expect(route).toBeDefined()
    })

    test('should register GET route for FINANCIAL_END_YEAR with requireFinancialStartYearSet', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' && r.path === ROUTES.PROJECT.FINANCIAL_END_YEAR
      )

      expect(route).toBeDefined()
      expect(route.options.pre).toEqual([
        { method: requireProposalCreator },
        { method: noEditSessionRequired },
        requireFinancialStartYearSet
      ])
    })

    test('should register POST route for FINANCIAL_END_YEAR', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' && r.path === ROUTES.PROJECT.FINANCIAL_END_YEAR
      )

      expect(route).toBeDefined()
    })

    test('should register GET route for FINANCIAL_END_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' &&
          r.path === ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL
      )

      expect(route).toBeDefined()
    })

    test('should register POST route for FINANCIAL_END_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' &&
          r.path === ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL
      )

      expect(route).toBeDefined()
    })
  })

  describe('Edit mode routes', () => {
    test('should register GET route for EDIT.FINANCIAL_START_YEAR with correct pre-handlers', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR
      )

      expect(route).toBeDefined()
      expect(route.options.pre).toEqual([
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireEditableStatus },
        { method: requireEditPermission }
      ])
      expect(route.options.handler).toBe(financialYearController.getHandler)
    })

    test('should register POST route for EDIT.FINANCIAL_START_YEAR', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR
      )

      expect(route).toBeDefined()
      expect(route.options.handler).toBe(financialYearController.postHandler)
    })

    test('should register GET route for EDIT.FINANCIAL_START_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL
      )

      expect(route).toBeDefined()
      expect(route.options.pre).toEqual([
        { method: requireAuth },
        { method: fetchProjectForEdit },
        { method: initializeEditSessionPreHandler },
        { method: requireEditableStatus },
        { method: requireEditPermission }
      ])
    })

    test('should register POST route for EDIT.FINANCIAL_START_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL
      )

      expect(route).toBeDefined()
    })

    test('should register GET route for EDIT.FINANCIAL_END_YEAR', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR
      )

      expect(route).toBeDefined()
    })

    test('should register POST route for EDIT.FINANCIAL_END_YEAR', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR
      )

      expect(route).toBeDefined()
    })

    test('should register GET route for EDIT.FINANCIAL_END_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'GET' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL
      )

      expect(route).toBeDefined()
    })

    test('should register POST route for EDIT.FINANCIAL_END_YEAR_MANUAL', () => {
      projectFinancialYear.plugin.register(mockServer)

      const registeredRoutes = mockServer.route.mock.calls[0][0]
      const route = registeredRoutes.find(
        (r) =>
          r.method === 'POST' &&
          r.path === ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL
      )

      expect(route).toBeDefined()
    })
  })

  test('should use same controller for all financial year routes', () => {
    projectFinancialYear.plugin.register(mockServer)

    const registeredRoutes = mockServer.route.mock.calls[0][0]
    const warningPath = ROUTES.PROJECT.EDIT.FINANCIAL_YEAR_WARNING
    const nonWarningRoutes = registeredRoutes.filter(
      (r) => r.path !== warningPath
    )
    const getRoutes = nonWarningRoutes.filter((r) => r.method === 'GET')
    const postRoutes = nonWarningRoutes.filter((r) => r.method === 'POST')

    getRoutes.forEach((route) => {
      expect(route.options.handler).toBe(financialYearController.getHandler)
    })

    postRoutes.forEach((route) => {
      expect(route.options.handler).toBe(financialYearController.postHandler)
    })

    const warningGetRoute = registeredRoutes.find(
      (r) => r.method === 'GET' && r.path === warningPath
    )
    const warningPostRoute = registeredRoutes.find(
      (r) => r.method === 'POST' && r.path === warningPath
    )

    expect(warningGetRoute.options.handler).toBe(
      financialYearWarningController.getHandler
    )
    expect(warningPostRoute.options.handler).toBe(
      financialYearWarningController.postHandler
    )
  })
})
