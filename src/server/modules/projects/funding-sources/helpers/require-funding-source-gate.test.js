import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { requireFundingSourceGate } from './require-funding-source-gate.js'

vi.mock('../../helpers/project-utils.js', () => ({
  getSessionData: vi.fn()
}))

const { getSessionData } = await import('../../helpers/project-utils.js')

const FS_ROUTES = ROUTES.PROJECT.EDIT.FUNDING_SOURCES

function createH() {
  const redirectResponse = { takeover: vi.fn() }
  redirectResponse.takeover.mockReturnValue(redirectResponse)
  return {
    continue: Symbol('continue'),
    redirect: vi.fn().mockReturnValue(redirectResponse),
    _redirectResponse: redirectResponse
  }
}

function createRequest(
  routePath,
  sessionOverrides = {},
  refNumber = 'TEST-001'
) {
  getSessionData.mockReturnValue(sessionOverrides)
  return {
    route: { path: routePath },
    params: { referenceNumber: refNumber }
  }
}

const selectionUrl = FS_ROUTES.FUNDING_SOURCES_SELECTION.replace(
  '{referenceNumber}',
  'TEST-001'
)

describe('requireFundingSourceGate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── resolveCurrentStep: null (no gate needed) ──────────────────────
  it('returns h.continue for the funding sources selection page', () => {
    const request = createRequest(FS_ROUTES.FUNDING_SOURCES_SELECTION)
    const h = createH()

    const result = requireFundingSourceGate(request, h)

    expect(result).toBe(h.continue)
  })

  it('returns h.continue for an unknown route path', () => {
    const request = createRequest('/project/{referenceNumber}/some-other')
    const h = createH()

    const result = requireFundingSourceGate(request, h)

    expect(result).toBe(h.continue)
  })

  // ── Additional funding sources page ──────────────────────────────
  describe('additional funding sources page', () => {
    const path = FS_ROUTES.ADDITIONAL_FUNDING_SOURCES_SELECTION

    it('redirects when additionalFcermGia is false', () => {
      const request = createRequest(path, { additionalFcermGia: false })
      const h = createH()

      requireFundingSourceGate(request, h)

      expect(h.redirect).toHaveBeenCalledWith(selectionUrl)
      expect(h._redirectResponse.takeover).toHaveBeenCalled()
    })

    it('returns h.continue when additionalFcermGia is true', () => {
      const request = createRequest(path, { additionalFcermGia: true })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })
  })

  // ── Estimated spend page ──────────────────────────────────────────
  describe('estimated spend page', () => {
    const path = FS_ROUTES.ESTIMATED_SPEND

    it('redirects when no funding sources selected', () => {
      const request = createRequest(path, {})
      const h = createH()

      requireFundingSourceGate(request, h)

      expect(h.redirect).toHaveBeenCalledWith(selectionUrl)
      expect(h._redirectResponse.takeover).toHaveBeenCalled()
    })

    it('returns h.continue when fcermGia is selected', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })

    it('returns h.continue when localLevy is selected', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })

    it('returns h.continue when notYetIdentified is selected', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })

    it('redirects to contributor naming page when contributor enabled but no names', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: ''
      })
      const h = createH()

      requireFundingSourceGate(request, h)

      const expectedUrl = FS_ROUTES.PUBLIC_SECTOR_CONTRIBUTORS.replace(
        '{referenceNumber}',
        'TEST-001'
      )
      expect(h.redirect).toHaveBeenCalledWith(expectedUrl)
      expect(h._redirectResponse.takeover).toHaveBeenCalled()
    })

    it('redirects to private naming page when private enabled but no names', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true,
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES]: '  '
      })
      const h = createH()

      requireFundingSourceGate(request, h)

      const expectedUrl = FS_ROUTES.PRIVATE_SECTOR_CONTRIBUTORS.replace(
        '{referenceNumber}',
        'TEST-001'
      )
      expect(h.redirect).toHaveBeenCalledWith(expectedUrl)
    })

    it('redirects to other-EA naming page when other-EA enabled but no names', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
      })
      const h = createH()

      requireFundingSourceGate(request, h)

      const expectedUrl =
        FS_ROUTES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      expect(h.redirect).toHaveBeenCalledWith(expectedUrl)
    })

    it('returns h.continue when contributor is enabled and has names', () => {
      const request = createRequest(path, {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'Alice, Bob'
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })
  })

  // ── Public contributor pages ──────────────────────────────────────
  describe('public contributor pages', () => {
    it('redirects when public contributions not enabled', () => {
      const request = createRequest(FS_ROUTES.PUBLIC_SECTOR_CONTRIBUTORS, {})
      const h = createH()

      requireFundingSourceGate(request, h)

      expect(h.redirect).toHaveBeenCalledWith(selectionUrl)
    })

    it('returns h.continue when public contributions enabled', () => {
      const request = createRequest(FS_ROUTES.PUBLIC_SECTOR_CONTRIBUTORS, {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })

    it('resolves delete path as public-contributors step', () => {
      const deletePath =
        FS_ROUTES.PUBLIC_SECTOR_CONTRIBUTORS_DELETE + '/some-name'
      const request = createRequest(deletePath, {
        [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })
  })

  // ── Private contributor pages ─────────────────────────────────────
  describe('private contributor pages', () => {
    it('redirects when private contributions not enabled', () => {
      const request = createRequest(FS_ROUTES.PRIVATE_SECTOR_CONTRIBUTORS, {})
      const h = createH()

      requireFundingSourceGate(request, h)

      expect(h.redirect).toHaveBeenCalledWith(selectionUrl)
    })

    it('returns h.continue when private contributions enabled', () => {
      const request = createRequest(FS_ROUTES.PRIVATE_SECTOR_CONTRIBUTORS, {
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })

    it('resolves delete path as private-contributors step', () => {
      const deletePath =
        FS_ROUTES.PRIVATE_SECTOR_CONTRIBUTORS_DELETE + '/some-name'
      const request = createRequest(deletePath, {
        [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })
  })

  // ── Other EA contributor pages ────────────────────────────────────
  describe('other EA contributor pages', () => {
    it('redirects when other EA contributions not enabled', () => {
      const request = createRequest(
        FS_ROUTES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS,
        {}
      )
      const h = createH()

      requireFundingSourceGate(request, h)

      expect(h.redirect).toHaveBeenCalledWith(selectionUrl)
    })

    it('returns h.continue when other EA contributions enabled', () => {
      const request = createRequest(
        FS_ROUTES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS,
        {
          [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
        }
      )
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })

    it('resolves delete path as other-ea-contributors step', () => {
      const deletePath =
        FS_ROUTES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DELETE + '/some-name'
      const request = createRequest(deletePath, {
        [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
      })
      const h = createH()

      const result = requireFundingSourceGate(request, h)

      expect(result).toBe(h.continue)
    })
  })
})
