import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getCurrentFinancialYearStartYear,
  buildFinancialYearLabel,
  buildFinancialYearOptions,
  getAfterMarchYear
} from './financial-year.js'

describe('financial-year helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getCurrentFinancialYearStartYear', () => {
    test('returns current year when date is in April or later', () => {
      vi.setSystemTime(new Date('2026-04-01T12:00:00.000Z'))
      expect(getCurrentFinancialYearStartYear()).toBe(2026)

      vi.setSystemTime(new Date('2026-06-15T12:00:00.000Z'))
      expect(getCurrentFinancialYearStartYear()).toBe(2026)

      vi.setSystemTime(new Date('2027-03-31T12:00:00.000Z'))
      expect(getCurrentFinancialYearStartYear()).toBe(2026)
    })

    test('returns previous year when date is before April', () => {
      vi.setSystemTime(new Date('2026-01-13T12:00:00.000Z'))
      expect(getCurrentFinancialYearStartYear()).toBe(2025)

      vi.setSystemTime(new Date('2026-03-31T12:00:00.000Z'))
      expect(getCurrentFinancialYearStartYear()).toBe(2025)
    })
  })

  describe('buildFinancialYearLabel', () => {
    test('builds correct label format', () => {
      expect(buildFinancialYearLabel(2025)).toBe('April 2025 to March 2026')
      expect(buildFinancialYearLabel(2032)).toBe('April 2032 to March 2033')
    })
  })

  describe('buildFinancialYearOptions', () => {
    test('builds 6 options by default', () => {
      const options = buildFinancialYearOptions(2025)
      expect(options).toHaveLength(6)
      expect(options[0]).toEqual({
        value: '2025',
        text: 'April 2025 to March 2026'
      })
      expect(options[5]).toEqual({
        value: '2030',
        text: 'April 2030 to March 2031'
      })
    })

    test('builds specified count of options', () => {
      const options = buildFinancialYearOptions(2025, 3)
      expect(options).toHaveLength(3)
      expect(options[2]).toEqual({
        value: '2027',
        text: 'April 2027 to March 2028'
      })
    })
  })

  describe('getAfterMarchYear', () => {
    test('returns start year + count', () => {
      expect(getAfterMarchYear(2025, 6)).toBe(2031)
      expect(getAfterMarchYear(2025, 3)).toBe(2028)
    })
  })
})
