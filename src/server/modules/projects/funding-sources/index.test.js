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

vi.mock('../helpers/require-financial-years.js', () => ({
  requireFinancialYears: vi.fn()
}))

vi.mock('./helpers/require-funding-source-gate.js', () => ({
  requireFundingSourceGate: vi.fn()
}))

vi.mock('../helpers/route-helpers.js', () => ({
  createEditRoutePair: vi.fn((path, controller, _pre) => [
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
import { requireFinancialYears } from '../helpers/require-financial-years.js'
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

const ROUTE_PAIRS = 9
const FUNDING_SOURCES_GATE = [
  { method: requireFinancialYears },
  { method: requireFundingSourceGate }
]
const ROUTE_PAIR_DATA = [
  [
    '/project/{referenceNumber}/funding-sources',
    fundingSourcesSelectionController
  ],
  [
    '/project/{referenceNumber}/funding-sources/additional',
    additionalFundingSourcesController
  ],
  [
    '/project/{referenceNumber}/funding-sources/public-contributors',
    publicContributorsController
  ],
  [
    '/project/{referenceNumber}/funding-sources/public-contributors/delete/{index}',
    publicContributorsDeleteController
  ],
  [
    '/project/{referenceNumber}/funding-sources/private-contributors',
    privateContributorsController
  ],
  [
    '/project/{referenceNumber}/funding-sources/private-contributors/delete/{index}',
    privateContributorsDeleteController
  ],
  [
    '/project/{referenceNumber}/funding-sources/other-ea-contributors',
    otherEaContributorsController
  ],
  [
    '/project/{referenceNumber}/funding-sources/other-ea-contributors/delete/{index}',
    otherEaContributorsDeleteController
  ],
  [
    '/project/{referenceNumber}/funding-sources/estimated-spend',
    estimatedSpendController
  ]
]

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

    it('registers the correct total number of routes', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(registeredRoutes).toHaveLength(ROUTE_PAIRS * 2)
    })

    it('calls createEditRoutePair once per route pair', () => {
      projectFundingSources.plugin.register(mockServer)
      expect(createEditRoutePair).toHaveBeenCalledTimes(ROUTE_PAIRS)
    })

    it('all registered routes have GET and POST methods', () => {
      projectFundingSources.plugin.register(mockServer)
      const getMethods = registeredRoutes.filter((r) => r.method === 'GET')
      const postMethods = registeredRoutes.filter((r) => r.method === 'POST')
      expect(getMethods).toHaveLength(ROUTE_PAIRS)
      expect(postMethods).toHaveLength(ROUTE_PAIRS)
    })

    it.each(ROUTE_PAIR_DATA)(
      'registers %s with requireFinancialYears + gate pre-handlers',
      (path, controller) => {
        projectFundingSources.plugin.register(mockServer)
        expect(createEditRoutePair).toHaveBeenCalledWith(
          path,
          controller,
          FUNDING_SOURCES_GATE
        )
      }
    )
  })
})
