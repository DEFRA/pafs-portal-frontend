import { describe, test, expect } from 'vitest'
import { convertYearToFinancialYearLabel } from './financial-year-helper.js'

describe('Financial Year Helper', () => {
  describe('convertYearToFinancialYearLabel', () => {
    test('should return correct financial year label for a given year', () => {
      const result = convertYearToFinancialYearLabel(2023)
      expect(result).toBe('April 2023 to March 2024')
    })

    test('should return correct financial year label for another year', () => {
      const result = convertYearToFinancialYearLabel(2024)
      expect(result).toBe('April 2024 to March 2025')
    })
  })
})
