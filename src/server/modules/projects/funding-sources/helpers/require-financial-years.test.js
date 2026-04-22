import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { requireFinancialYears } from './require-financial-years.js'

vi.mock('../../helpers/project-utils.js', () => ({
  getSessionData: vi.fn()
}))

const { getSessionData } = await import('../../helpers/project-utils.js')

function createH() {
  const viewResponse = { takeover: vi.fn() }
  viewResponse.takeover.mockReturnValue(viewResponse)
  return {
    continue: Symbol('continue'),
    view: vi.fn().mockReturnValue(viewResponse),
    _viewResponse: viewResponse
  }
}

function createRequest(params = {}, sessionOverrides = {}) {
  const sessionData = {
    [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 0,
    [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 0,
    ...sessionOverrides
  }
  getSessionData.mockReturnValue(sessionData)
  return {
    params: { referenceNumber: 'TEST-001', ...params },
    t: vi.fn((key) => key)
  }
}

describe('requireFinancialYears', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns h.continue when both start and end year are set', () => {
    const request = createRequest(
      {},
      {
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      }
    )
    const h = createH()

    const result = requireFinancialYears(request, h)

    expect(result).toBe(h.continue)
    expect(h.view).not.toHaveBeenCalled()
  })

  it('renders warning page when start year is missing', () => {
    const request = createRequest(
      {},
      {
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 0,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      }
    )
    const h = createH()

    requireFinancialYears(request, h)

    expect(h.view).toHaveBeenCalledWith(
      PROJECT_VIEWS.FUNDING_SOURCES_MISSING_FINANCIAL_YEARS,
      expect.objectContaining({
        pageTitle: 'projects.funding_sources.missing_financial_years.title',
        overviewUrl: ROUTES.PROJECT.OVERVIEW.replace(
          '{referenceNumber}',
          'TEST-001'
        )
      })
    )
    expect(h._viewResponse.takeover).toHaveBeenCalled()
  })

  it('renders warning page when end year is missing', () => {
    const request = createRequest(
      {},
      {
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 0
      }
    )
    const h = createH()

    requireFinancialYears(request, h)

    expect(h.view).toHaveBeenCalledWith(
      PROJECT_VIEWS.FUNDING_SOURCES_MISSING_FINANCIAL_YEARS,
      expect.any(Object)
    )
    expect(h._viewResponse.takeover).toHaveBeenCalled()
  })

  it('renders warning page when both years are missing', () => {
    const request = createRequest()
    const h = createH()

    requireFinancialYears(request, h)

    expect(h.view).toHaveBeenCalled()
    expect(h._viewResponse.takeover).toHaveBeenCalled()
  })

  it('builds the correct overview URL from the reference number', () => {
    const request = createRequest({ referenceNumber: 'REF-999' })
    const h = createH()

    requireFinancialYears(request, h)

    const viewArgs = h.view.mock.calls[0][1]
    expect(viewArgs.overviewUrl).toBe(
      ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', 'REF-999')
    )
  })

  it('handles missing params gracefully', () => {
    getSessionData.mockReturnValue({})
    const request = { params: undefined, t: vi.fn((k) => k) }
    const h = createH()

    requireFinancialYears(request, h)

    const viewArgs = h.view.mock.calls[0][1]
    expect(viewArgs.overviewUrl).toBe(
      ROUTES.PROJECT.OVERVIEW.replace('{referenceNumber}', '')
    )
  })

  it('treats non-numeric start year as missing', () => {
    const request = createRequest(
      {},
      {
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 'abc',
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2030
      }
    )
    const h = createH()

    requireFinancialYears(request, h)

    expect(h.view).toHaveBeenCalled()
    expect(h._viewResponse.takeover).toHaveBeenCalled()
  })
})
