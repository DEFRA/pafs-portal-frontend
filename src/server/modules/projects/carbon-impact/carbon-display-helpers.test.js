import { describe, test, expect, vi } from 'vitest'
import {
  formatTonnes,
  extractCarbonCosts,
  buildInitialDisplayData,
  mergeCalculatedValues,
  hasAllCarbonValues,
  applyFallbackValues,
  logError
} from './carbon-display-helpers.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

vi.mock('./controller-helpers.js', () => ({
  formatCurrency: vi.fn((v) => {
    if (v == null || v === '') return 'Not provided'
    return `£${v}`
  })
}))

// ─────────────────────────────────────────────────────────────────────────────
// formatTonnes
// ─────────────────────────────────────────────────────────────────────────────
describe('formatTonnes', () => {
  test('returns null for null', () => {
    expect(formatTonnes(null)).toBeNull()
  })

  test('returns null for undefined', () => {
    expect(formatTonnes(undefined)).toBeNull()
  })

  test('returns 0.00 for empty string', () => {
    expect(formatTonnes('')).toBe('0.00')
  })

  test('returns 0.00 for whitespace-only string', () => {
    expect(formatTonnes('   ')).toBe('0.00')
  })

  test('formats whole number string as 2 decimal places', () => {
    expect(formatTonnes('15')).toBe('15.00')
  })

  test('formats single-decimal string with trailing zero', () => {
    expect(formatTonnes('15.0')).toBe('15.00')
    expect(formatTonnes('15.2')).toBe('15.20')
  })

  test('preserves 2 decimal place string unchanged', () => {
    expect(formatTonnes('15.23')).toBe('15.23')
  })

  test('formats large integer string correctly', () => {
    expect(formatTonnes('123456789012345678')).toBe('123456789012345678.00')
  })

  test('formats max-precision decimal string correctly', () => {
    expect(formatTonnes('1234567890123456.23')).toBe('1234567890123456.23')
  })

  test('returns 0.00 for string starting with decimal point (invalid format)', () => {
    // ".5" doesn't match the schema format (must have leading digit); treated as zero
    expect(formatTonnes('.5')).toBe('0.00')
  })

  test('returns 0.00 for a malformed string (non-numeric)', () => {
    // Invalid input: regex guard treats it as zero
    expect(formatTonnes('abc')).toBe('0.00')
  })

  test('formats number 0 as 0.00', () => {
    expect(formatTonnes(0)).toBe('0.00')
  })

  test('formats integer number as 2 decimal places', () => {
    expect(formatTonnes(100)).toBe('100.00')
  })

  test('formats fractional number with trailing zero', () => {
    expect(formatTonnes(100.5)).toBe('100.50')
  })

  test('formats fractional number to 2dp', () => {
    expect(formatTonnes(15.23)).toBe('15.23')
  })

  test('returns null for NaN number', () => {
    expect(formatTonnes(Number.NaN)).toBeNull()
  })

  test('returns null when a non-string non-number value cannot be parsed', () => {
    // e.g. boolean true → parseFloat('true') = NaN → null
    expect(formatTonnes(true)).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// extractCarbonCosts
// ─────────────────────────────────────────────────────────────────────────────
describe('extractCarbonCosts', () => {
  test('extracts raw string values from session data', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '10.50',
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '5.00',
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '2.25',
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '1.00'
    }
    const result = extractCarbonCosts(sessionData)
    expect(result).toEqual({
      build: '10.50',
      operation: '5.00',
      sequestered: '2.25',
      avoided: '1.00'
    })
  })

  test('returns empty string for missing fields', () => {
    const result = extractCarbonCosts({})
    expect(result).toEqual({
      build: '',
      operation: '',
      sequestered: '',
      avoided: ''
    })
  })

  test('returns empty string when field is null', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: null
    }
    const result = extractCarbonCosts(sessionData)
    expect(result.build).toBe('')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// buildInitialDisplayData
// ─────────────────────────────────────────────────────────────────────────────
describe('buildInitialDisplayData', () => {
  test('returns 0.00 for all tCO2e fields when costs are empty', () => {
    const sessionData = {}
    const carbonCosts = {
      build: '',
      operation: '',
      sequestered: '',
      avoided: ''
    }
    const result = buildInitialDisplayData(sessionData, carbonCosts)
    expect(result.build).toBe('0.00')
    expect(result.operation).toBe('0.00')
    expect(result.sequestered).toBe('0.00')
    expect(result.avoided).toBe('0.00')
    expect(result.wholeLifeCarbon).toBe('0.00')
    expect(result.netCarbon).toBe('0.00')
  })

  test('calculates wholeLifeCarbon as build + operation', () => {
    const sessionData = {}
    const carbonCosts = {
      build: '10.50',
      operation: '5.25',
      sequestered: '0',
      avoided: '0'
    }
    const result = buildInitialDisplayData(sessionData, carbonCosts)
    expect(result.wholeLifeCarbon).toBe('15.75')
  })

  test('calculates netCarbon as build + operation - sequestered - avoided', () => {
    const sessionData = {}
    const carbonCosts = {
      build: '20.00',
      operation: '10.00',
      sequestered: '8.00',
      avoided: '4.00'
    }
    const result = buildInitialDisplayData(sessionData, carbonCosts)
    expect(result.netCarbon).toBe('18.00')
  })

  test('produces negative netCarbon when sequestered+avoided exceed build+operation', () => {
    const sessionData = {}
    const carbonCosts = {
      build: '5.00',
      operation: '3.00',
      sequestered: '10.00',
      avoided: '2.00'
    }
    const result = buildInitialDisplayData(sessionData, carbonCosts)
    // 5 + 3 - 10 - 2 = -4
    expect(result.netCarbon).toBe('-4.00')
  })

  test('preserves full precision for large values without floating-point error', () => {
    const sessionData = {}
    const carbonCosts = {
      build: '999999999999999.99',
      operation: '1.01',
      sequestered: '0',
      avoided: '0'
    }
    const result = buildInitialDisplayData(sessionData, carbonCosts)
    // JavaScript Number would lose precision here; BigInt should not
    expect(result.wholeLifeCarbon).toBe('1000000000000001.00')
  })

  test('returns 0.00 for all fields when carbonCosts has null values', () => {
    // When carbonCosts fields are null, formatTonnes returns null and ?? '0.00' kicks in
    const result = buildInitialDisplayData(
      {},
      { build: null, operation: null, sequestered: null, avoided: null }
    )
    expect(result.build).toBe('0.00')
    expect(result.operation).toBe('0.00')
    expect(result.sequestered).toBe('0.00')
    expect(result.avoided).toBe('0.00')
  })

  test('extracts benefit and forecast from session data', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '5000',
      [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '2500'
    }
    const result = buildInitialDisplayData(sessionData, {
      build: '',
      operation: '',
      sequestered: '',
      avoided: ''
    })
    expect(result.benefit).toBe('5000')
    expect(result.forecast).toBe('2500')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// mergeCalculatedValues
// ─────────────────────────────────────────────────────────────────────────────
describe('mergeCalculatedValues', () => {
  const baseDisplayData = {
    build: '10.00',
    operation: '5.00',
    sequestered: '0.00',
    avoided: '0.00',
    wholeLifeCarbon: '15.00',
    netCarbon: '15.00',
    benefit: null,
    forecast: null,
    benefitDisplay: 'Not provided',
    forecastDisplay: 'Not provided',
    capitalCostEstimateDisplay: 'Not provided'
  }

  test('formats tCO2e API values to 2dp strings', () => {
    const calcData = {
      capitalCarbonBaseline: 100,
      capitalCarbonTarget: 90,
      operationalCarbonBaseline: 50,
      operationalCarbonTarget: 45,
      netCarbonEstimate: 150,
      netCarbonWithBlanks: 120,
      constructionTotalFunding: 500000,
      carbonCostBuild: '10.0',
      carbonCostOperation: '5.0',
      carbonCostSequestered: '2.0',
      carbonCostAvoided: '1.0'
    }
    const result = mergeCalculatedValues(baseDisplayData, calcData)
    expect(result.capitalCarbonBaseline).toBe('100.00')
    expect(result.capitalCarbonTarget).toBe('90.00')
    expect(result.operationalCarbonBaseline).toBe('50.00')
    expect(result.operationalCarbonTarget).toBe('45.00')
    expect(result.netCarbonEstimate).toBe('150.00')
    expect(result.netCarbonWithBlanks).toBe('120.00')
  })

  test('falls back to displayData.netCarbon when netCarbonEstimate is null', () => {
    const calcData = {
      capitalCarbonBaseline: 100,
      capitalCarbonTarget: 90,
      operationalCarbonBaseline: 50,
      operationalCarbonTarget: 45,
      netCarbonEstimate: null,
      netCarbonWithBlanks: null,
      constructionTotalFunding: null,
      carbonCostBuild: '10',
      carbonCostOperation: '5',
      carbonCostSequestered: null,
      carbonCostAvoided: null
    }
    const result = mergeCalculatedValues(baseDisplayData, calcData)
    expect(result.netCarbonEstimate).toBe('15.00')
  })

  test('sets allCarbonValuesPresent true when all four fields present', () => {
    const calcData = {
      capitalCarbonBaseline: 1,
      capitalCarbonTarget: 1,
      operationalCarbonBaseline: 1,
      operationalCarbonTarget: 1,
      netCarbonEstimate: 1,
      netCarbonWithBlanks: 1,
      constructionTotalFunding: 1,
      carbonCostBuild: '1',
      carbonCostOperation: '1',
      carbonCostSequestered: '1',
      carbonCostAvoided: '1'
    }
    const result = mergeCalculatedValues(baseDisplayData, calcData)
    expect(result.allCarbonValuesPresent).toBe(true)
  })

  test('sets allCarbonValuesPresent false when a field is missing', () => {
    const calcData = {
      capitalCarbonBaseline: 1,
      capitalCarbonTarget: 1,
      operationalCarbonBaseline: 1,
      operationalCarbonTarget: 1,
      netCarbonEstimate: 1,
      netCarbonWithBlanks: 1,
      constructionTotalFunding: 1,
      carbonCostBuild: '1',
      carbonCostOperation: '1',
      carbonCostSequestered: null,
      carbonCostAvoided: '1'
    }
    const result = mergeCalculatedValues(baseDisplayData, calcData)
    expect(result.allCarbonValuesPresent).toBe(false)
  })

  test('does not mutate the original displayData', () => {
    const calcData = {
      capitalCarbonBaseline: 1,
      capitalCarbonTarget: 1,
      operationalCarbonBaseline: 1,
      operationalCarbonTarget: 1,
      netCarbonEstimate: 1,
      netCarbonWithBlanks: 1,
      constructionTotalFunding: 100,
      carbonCostBuild: '1',
      carbonCostOperation: '1',
      carbonCostSequestered: '1',
      carbonCostAvoided: '1'
    }
    const original = { ...baseDisplayData }
    mergeCalculatedValues(baseDisplayData, calcData)
    expect(baseDisplayData).toEqual(original)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// hasAllCarbonValues
// ─────────────────────────────────────────────────────────────────────────────
describe('hasAllCarbonValues', () => {
  test('returns true when all four fields are present', () => {
    expect(
      hasAllCarbonValues({
        carbonCostBuild: '10',
        carbonCostOperation: '5',
        carbonCostSequestered: '2',
        carbonCostAvoided: '1'
      })
    ).toBe(true)
  })

  test('returns false when build is null', () => {
    expect(
      hasAllCarbonValues({
        carbonCostBuild: null,
        carbonCostOperation: '5',
        carbonCostSequestered: '2',
        carbonCostAvoided: '1'
      })
    ).toBe(false)
  })

  test('returns false when any field is null', () => {
    expect(
      hasAllCarbonValues({
        carbonCostBuild: '10',
        carbonCostOperation: null,
        carbonCostSequestered: null,
        carbonCostAvoided: null
      })
    ).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// applyFallbackValues
// ─────────────────────────────────────────────────────────────────────────────
describe('applyFallbackValues', () => {
  test('sets netCarbonEstimate to netCarbon', () => {
    const displayData = { netCarbon: '12.34', allCarbonValuesPresent: true }
    applyFallbackValues(displayData)
    expect(displayData.netCarbonEstimate).toBe('12.34')
  })

  test('sets allCarbonValuesPresent to false', () => {
    const displayData = { netCarbon: '12.34', allCarbonValuesPresent: true }
    applyFallbackValues(displayData)
    expect(displayData.allCarbonValuesPresent).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// logError
// ─────────────────────────────────────────────────────────────────────────────
describe('logError', () => {
  test('calls request.log with tags and message', () => {
    const mockRequest = { log: vi.fn() }
    logError(mockRequest, ['warn', 'carbon'], 'something went wrong')
    expect(mockRequest.log).toHaveBeenCalledWith(
      ['warn', 'carbon'],
      'something went wrong'
    )
  })

  test('does not throw when request.log is absent', () => {
    const mockRequest = {}
    expect(() => logError(mockRequest, ['warn'], 'message')).not.toThrow()
  })
})
