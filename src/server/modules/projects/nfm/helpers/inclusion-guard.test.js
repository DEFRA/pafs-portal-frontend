import { describe, it, expect, vi, beforeEach } from 'vitest'

import { requireNfmInclusion } from './inclusion-guard.js'

vi.mock('../../helpers/project-utils.js', () => ({
  getSessionData: vi.fn(),
  navigateToProjectOverview: vi.fn()
}))

vi.mock('../../../../common/constants/projects.js', () => ({
  PROJECT_PAYLOAD_FIELDS: {
    PROJECT_INTERVENTION_TYPES: 'projectInterventionTypes',
    NATURAL_FLOOD_RISK_MEASURES_INCLUDED: 'naturalFloodRiskMeasuresIncluded'
  },
  PROJECT_INTERVENTION_TYPES: {
    NFM: 'NFM',
    SUDS: 'SUDS'
  }
}))

vi.mock('../../../../common/constants/routes.js', () => ({
  ROUTES: {
    PROJECT: {
      EDIT: {
        NFM: {
          INCLUSION: '/projects/{referenceNumber}/nfm/inclusion'
        }
      }
    }
  }
}))

import {
  getSessionData,
  navigateToProjectOverview
} from '../../helpers/project-utils.js'

describe('requireNfmInclusion', () => {
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()
    mockH = {
      continue: Symbol('continue'),
      redirect: vi.fn().mockReturnValue({ takeover: vi.fn() })
    }
  })

  it('should return h.continue when project has NFM intervention type', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: ['NFM', 'SUDS']
    })

    const request = { params: { referenceNumber: 'REF123' } }
    const result = requireNfmInclusion(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  it('should return h.continue when project has no SUDS (not SUDS-only)', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: ['NFM']
    })

    const request = { params: { referenceNumber: 'REF123' } }
    const result = requireNfmInclusion(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  it('should return h.continue when SUDS-only and inclusion is true', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: ['SUDS'],
      naturalFloodRiskMeasuresIncluded: true
    })

    const request = { params: { referenceNumber: 'REF123' } }
    const result = requireNfmInclusion(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  it('should redirect to inclusion page when SUDS-only and inclusion is not true', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: ['SUDS'],
      naturalFloodRiskMeasuresIncluded: null
    })

    const request = { params: { referenceNumber: 'REF123' } }
    requireNfmInclusion(request, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(
      '/projects/REF123/nfm/inclusion'
    )
  })

  it('should redirect to inclusion page when SUDS-only and inclusion is false', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: ['SUDS'],
      naturalFloodRiskMeasuresIncluded: false
    })

    const request = { params: { referenceNumber: 'REF123' } }
    requireNfmInclusion(request, mockH)

    expect(mockH.redirect).toHaveBeenCalledWith(
      '/projects/REF123/nfm/inclusion'
    )
  })

  it('should call navigateToProjectOverview when no referenceNumber', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: ['SUDS'],
      naturalFloodRiskMeasuresIncluded: null
    })
    navigateToProjectOverview.mockReturnValue('overview-redirect')

    const request = { params: {} }
    const result = requireNfmInclusion(request, mockH)

    expect(navigateToProjectOverview).toHaveBeenCalledWith(undefined, mockH)
    expect(result).toBe('overview-redirect')
  })

  it('should return h.continue when intervention types are empty', () => {
    getSessionData.mockReturnValue({
      projectInterventionTypes: []
    })

    const request = { params: { referenceNumber: 'REF123' } }
    const result = requireNfmInclusion(request, mockH)

    expect(result).toBe(mockH.continue)
  })

  it('should return h.continue when intervention types are null/undefined', () => {
    getSessionData.mockReturnValue({})

    const request = { params: { referenceNumber: 'REF123' } }
    const result = requireNfmInclusion(request, mockH)

    expect(result).toBe(mockH.continue)
  })
})
