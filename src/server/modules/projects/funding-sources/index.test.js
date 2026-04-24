import { describe, it, expect, vi, beforeEach } from 'vitest'
import { projectFundingSources } from './index.js'

// ─── Mock all dependencies ────────────────────────────────────────────────────

vi.mock('../../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT: {
      EDIT: {
        FUNDING_SOURCES: {
          FUNDING_SOURCES_SELECTION:
            '/project/{referenceNumber}/funding-sources',
          ADDITIONAL_FUNDING_SOURCES_SELECTION:
            '/project/{referenceNumber}/funding-sources/additional',
          PUBLIC_SECTOR_CONTRIBUTORS:
            '/project/{referenceNumber}/funding-sources/public-contributors',
          PUBLIC_SECTOR_CONTRIBUTORS_DELETE:
            '/project/{referenceNumber}/funding-sources/public-contributors/delete',
          PRIVATE_SECTOR_CONTRIBUTORS:
            '/project/{referenceNumber}/funding-sources/private-contributors',
          PRIVATE_SECTOR_CONTRIBUTORS_DELETE:
            '/project/{referenceNumber}/funding-sources/private-contributors/delete',
          OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS:
            '/project/{referenceNumber}/funding-sources/other-ea-contributors',
          OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DELETE:
            '/project/{referenceNumber}/funding-sources/other-ea-contributors/delete',
          ESTIMATED_SPEND:
            '/project/{referenceNumber}/funding-sources/estimated-spend'
        }
      }
    }
  }
}))

vi.mock('./helpers/require-financial-years.js', () => ({
  requireFinancialYears: vi.fn()
}))

vi.mock('./helpers/require-funding-source-gate.js', () => ({
  requireFundingSourceGate: vi.fn()
}))

vi.mock('../helpers/route-helpers.js', () => ({
  createEditRoutePair: vi.fn((path, controller, pre) => [
    { method: 'GET', path, handler: controller.getHandler },
    { method: 'POST', path, handler: controller.postHandler }
  ])
}))

vi.mock('./controller.js', () => ({
  fundingSourcesSelectionController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  additionalFundingSourcesController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  publicContributorsController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  publicContributorsDeleteController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  privateContributorsController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  privateContributorsDeleteController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  otherEaContributorsController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  otherEaContributorsDeleteController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  },
  estimatedSpendController: {
    getHandler: vi.fn(),
    postHandler: vi.fn()
  }
}))

import { createEditRoutePair } from '../helpers/route-helpers.js'
import { requireFinancialYears } from './helpers/require-financial-years.js'
import { requireFundingSourceGate } from './helpers/require-funding-source-gate.js'
import {
  fundingSourcesSelectionController,
  additionalFundingSourcesController,
  publicContributorsController,
  publicContributorsDeleteController,
  privateContributorsController,
  privateContributorsDeleteController,
  otherEaContributorsController,
  otherEaContributorsDeleteController,
  estimatedSpendController
} from './controller.js'

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('projectFundingSources plugin', () => {
  it('exports a plugin object with the correct name', () => {
    expect(projectFundingSources.plugin.name).toBe('Project - Funding Sources')
  })

  it('exports a plugin object with a register function', () => {
    expect(typeof projectFundingSources.plugin.register).toBe('function')
  })

  describe('register(server)', () => {
    let mockServer
    let registeredRoutes

    beforeEach(() => {
      vi.clearAllMocks()
      registeredRoutes = []
      mockServer = {
        route: vi.fn((routes) => {
          registeredRoutes = routes
        })
      }
      createEditRoutePair.mockImplementation((path, controller) => [
        { method: 'GET', path, handler: controller.getHandler },
        { method: 'POST', path, handler: controller.postHandler }
      ])
    })

    it('calls server.route once with all routes', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(mockServer.route).toHaveBeenCalledTimes(1)
    })

    it('registers 18 routes total (9 route pairs × 2 methods)', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(registeredRoutes).toHaveLength(18)
    })

    it('calls createEditRoutePair 9 times (one per route pair)', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledTimes(9)
    })

    it('registers the funding sources selection route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources',
        fundingSourcesSelectionController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the additional funding sources route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/additional',
        additionalFundingSourcesController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the public sector contributors route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/public-contributors',
        publicContributorsController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the public sector contributors delete route pair with index param', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/public-contributors/delete/{index}',
        publicContributorsDeleteController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the private sector contributors route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/private-contributors',
        privateContributorsController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the private sector contributors delete route pair with index param', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/private-contributors/delete/{index}',
        privateContributorsDeleteController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the other EA contributors route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/other-ea-contributors',
        otherEaContributorsController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the other EA contributors delete route pair with index param', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/other-ea-contributors/delete/{index}',
        otherEaContributorsDeleteController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('registers the estimated spend route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledWith(
        '/project/{referenceNumber}/funding-sources/estimated-spend',
        estimatedSpendController,
        [
          { method: requireFinancialYears },
          { method: requireFundingSourceGate }
        ]
      )
    })

    it('all registered routes have GET and POST methods', () => {
      projectFundingSources.plugin.register(mockServer)
      const getMethods = registeredRoutes.filter((r) => r.method === 'GET')
      const postMethods = registeredRoutes.filter((r) => r.method === 'POST')
      expect(getMethods).toHaveLength(9)
      expect(postMethods).toHaveLength(9)
    })
  })
})
