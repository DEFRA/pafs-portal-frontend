import { describe, test, expect, vi, beforeEach } from 'vitest'
import {
  getCurrentFinancialYear,
  hasStaleFinancialYears,
  flushStaleFinancialYears
} from './stale-financial-years.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS
} from '../../../common/constants/projects.js'

vi.mock('../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

vi.mock('../../../common/services/project/project-service.js', () => ({
  upsertProjectProposal: vi.fn()
}))

vi.mock('./project-utils.js', () => ({
  getSessionData: vi.fn(),
  updateSessionData: vi.fn()
}))

import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { upsertProjectProposal } from '../../../common/services/project/project-service.js'
import { getSessionData, updateSessionData } from './project-utils.js'

describe('stale-financial-years', () => {
  describe('getCurrentFinancialYear', () => {
    test('returns current year when on or after 1 April', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-04-01'))
      expect(getCurrentFinancialYear()).toBe(2026)
      vi.useRealTimers()
    })

    test('returns current year for a date in May', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-15'))
      expect(getCurrentFinancialYear()).toBe(2026)
      vi.useRealTimers()
    })

    test('returns current year for a date in March (still in previous FY)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-31'))
      expect(getCurrentFinancialYear()).toBe(2025)
      vi.useRealTimers()
    })

    test('returns current year for a date in January', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-01-10'))
      expect(getCurrentFinancialYear()).toBe(2025)
      vi.useRealTimers()
    })

    test('returns current year for a date on 31 March (last day of FY)', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-03-31'))
      expect(getCurrentFinancialYear()).toBe(2024)
      vi.useRealTimers()
    })
  })

  describe('hasStaleFinancialYears', () => {
    const CURRENT_FY = 2026

    test('returns false when both years are null', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null
          },
          CURRENT_FY
        )
      ).toBe(false)
    })

    test('returns false when both years are undefined', () => {
      expect(hasStaleFinancialYears({}, CURRENT_FY)).toBe(false)
    })

    test('returns false when both years equal the current FY', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2026,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2026
          },
          CURRENT_FY
        )
      ).toBe(false)
    })

    test('returns false when both years are in the future', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2027,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2028
          },
          CURRENT_FY
        )
      ).toBe(false)
    })

    test('returns true when start year is before current FY', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2028
          },
          CURRENT_FY
        )
      ).toBe(true)
    })

    test('returns true when end year is before current FY', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2027,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2024
          },
          CURRENT_FY
        )
      ).toBe(true)
    })

    test('returns true when both years are before current FY', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025
          },
          CURRENT_FY
        )
      ).toBe(true)
    })

    test('returns true when only start year is set and is stale', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null
          },
          CURRENT_FY
        )
      ).toBe(true)
    })

    test('returns true when only end year is set and is stale', () => {
      expect(
        hasStaleFinancialYears(
          {
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025
          },
          CURRENT_FY
        )
      ).toBe(true)
    })

    test('returns false when projectData is null', () => {
      expect(hasStaleFinancialYears(null, CURRENT_FY)).toBe(false)
    })

    test('uses getCurrentFinancialYear when currentFY is not supplied', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-05-15'))
      // FY 2026 — year 2025 should be stale
      expect(
        hasStaleFinancialYears({
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2025
        })
      ).toBe(true)
      vi.useRealTimers()
    })
  })

  describe('flushStaleFinancialYears', () => {
    let mockRequest

    beforeEach(() => {
      vi.clearAllMocks()

      mockRequest = {
        logger: { error: vi.fn() }
      }

      getAuthSession.mockReturnValue({ accessToken: 'test-token' })

      getSessionData.mockReturnValue({
        [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]: 'REF123',
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: 2024,
        [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: 2025
      })

      upsertProjectProposal.mockResolvedValue({ success: true })
    })

    test('makes exactly one API call', async () => {
      await flushStaleFinancialYears(mockRequest)
      expect(upsertProjectProposal).toHaveBeenCalledTimes(1)
    })

    test('calls API with CLEAR_STALE_DATA level containing all cleared fields', async () => {
      await flushStaleFinancialYears(mockRequest)

      expect(upsertProjectProposal).toHaveBeenCalledWith(
        expect.objectContaining({
          level: PROJECT_PAYLOAD_LEVELS.CLEAR_STALE_DATA,
          payload: expect.objectContaining({
            [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]: 'REF123',
            // Financial years
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null,
            // Important dates
            [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: null,
            [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH]: null,
            [PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: null,
            [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: null,
            [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: null,
            [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR]: null,
            [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: null,
            [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH]: null,
            [PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR]: null,
            // Funding sources
            [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: false,
            [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: false,
            [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: false,
            [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: false,
            [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: false,
            [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: null,
            [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES]: null,
            [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTOR_NAMES]: null,
            // Banner flag persisted to DB
            [PROJECT_PAYLOAD_FIELDS.STALE_DATA_CLEARED]: true
          })
        }),
        'test-token'
      )
    })

    test('updates session with all cleared data', async () => {
      await flushStaleFinancialYears(mockRequest)

      expect(updateSessionData).toHaveBeenCalledWith(
        mockRequest,
        expect.objectContaining({
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]: null,
          [PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]: null,
          [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]: null,
          [PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]: null,
          [PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH]: null,
          [PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH]: null,
          [PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH]: null,
          [PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY]: null,
          [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: false,
          [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: null,
          [PROJECT_PAYLOAD_FIELDS.STALE_DATA_CLEARED]: true
        })
      )
    })

    test('returns true when API call succeeds', async () => {
      const result = await flushStaleFinancialYears(mockRequest)
      expect(result).toBe(true)
    })

    test('returns false and does not update session when API call fails', async () => {
      upsertProjectProposal.mockResolvedValueOnce({ success: false })

      const result = await flushStaleFinancialYears(mockRequest)

      expect(result).toBe(false)
      expect(updateSessionData).not.toHaveBeenCalled()
    })

    test('returns false when API call rejects', async () => {
      const networkError = new Error('Network error')
      upsertProjectProposal.mockRejectedValueOnce(networkError)

      const result = await flushStaleFinancialYears(mockRequest)

      expect(result).toBe(false)
      expect(updateSessionData).not.toHaveBeenCalled()
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error flushing stale financial years',
        networkError
      )
    })

    test('uses empty string as access token when authSession has no accessToken', async () => {
      getAuthSession.mockReturnValue({})

      await flushStaleFinancialYears(mockRequest)

      expect(upsertProjectProposal).toHaveBeenCalledWith(expect.any(Object), '')
    })
  })
})
