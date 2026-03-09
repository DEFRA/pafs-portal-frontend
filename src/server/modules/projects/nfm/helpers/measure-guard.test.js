import { describe, test, expect, vi, beforeEach } from 'vitest'

vi.mock('../../helpers/project-utils.js', () => ({
  getSessionData: vi.fn(),
  navigateToProjectOverview: vi.fn((referenceNumber, h) =>
    h.redirect(`/project/${referenceNumber}`).takeover()
  )
}))

const { requireSelectedMeasure } = await import('./measure-guard.js')
const { getSessionData, navigateToProjectOverview } =
  await import('../../helpers/project-utils.js')

describe('nfm measure guard', () => {
  const h = {
    continue: Symbol('continue'),
    redirect: vi.fn((path) => ({
      takeover: () => ({ redirected: true, path })
    }))
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('allows access for selected measures step (no required measure)', () => {
    const request = {
      route: { path: '/project/{referenceNumber}/nfm-selected-measures' },
      params: { referenceNumber: 'TEST-001' }
    }

    const result = requireSelectedMeasure(request, h)
    expect(result).toBe(h.continue)
    expect(getSessionData).not.toHaveBeenCalled()
  })

  test('allows access when required measure is selected', () => {
    getSessionData.mockReturnValue({
      nfmSelectedMeasures: 'river_floodplain_restoration,leaky_barriers'
    })

    const request = {
      route: { path: '/project/{referenceNumber}/nfm-river-restoration' },
      params: { referenceNumber: 'TEST-001' }
    }

    const result = requireSelectedMeasure(request, h)
    expect(result).toBe(h.continue)
    expect(navigateToProjectOverview).not.toHaveBeenCalled()
  })

  test('redirects to overview when required measure is not selected', () => {
    getSessionData.mockReturnValue({
      nfmSelectedMeasures: 'leaky_barriers,woodland'
    })

    const request = {
      route: { path: '/project/{referenceNumber}/nfm-river-restoration' },
      params: { referenceNumber: 'TEST-001' }
    }

    const result = requireSelectedMeasure(request, h)
    expect(result).toEqual({ redirected: true, path: '/project/TEST-001' })
    expect(navigateToProjectOverview).toHaveBeenCalledWith('TEST-001', h)
  })

  test('redirects to overview when no measures exist in session', () => {
    getSessionData.mockReturnValue({})

    const request = {
      route: { path: '/project/{referenceNumber}/nfm-offline-storage' },
      params: { referenceNumber: 'TEST-001' }
    }

    const result = requireSelectedMeasure(request, h)
    expect(result).toEqual({ redirected: true, path: '/project/TEST-001' })
  })
})
