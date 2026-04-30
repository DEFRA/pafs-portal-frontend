import { describe, expect, test, vi } from 'vitest'
import {
  extractCarbonCosts,
  buildInitialDisplayData,
  mergeCalculatedValues,
  hasAllCarbonValues,
  applyFallbackValues,
  logError
} from './carbon-display-helpers.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

const makeSession = (overrides = {}) => ({
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: 1000,
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: 500,
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: 200,
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: 100,
  [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: 50000,
  [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: 20000,
  [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS]: 100000,
  ...overrides
})

describe('extractCarbonCosts', () => {
  test('extracts numeric cost values from session', () => {
    const result = extractCarbonCosts(makeSession())
    expect(result).toEqual({
      build: 1000,
      operation: 500,
      sequestered: 200,
      avoided: 100
    })
  })

  test('defaults missing fields to 0', () => {
    const result = extractCarbonCosts({})
    expect(result).toEqual({
      build: 0,
      operation: 0,
      sequestered: 0,
      avoided: 0
    })
  })
})

describe('buildInitialDisplayData', () => {
  test('computes wholeLifeCarbon and netCarbon', () => {
    const session = makeSession()
    const costs = extractCarbonCosts(session)
    const data = buildInitialDisplayData(session, costs)
    expect(data.wholeLifeCarbon).toBe(1500) // 1000 + 500
    expect(data.netCarbon).toBe(1200) // 1000 + 500 - 200 - 100
  })

  test('includes formatted emission fields', () => {
    const session = makeSession()
    const costs = extractCarbonCosts(session)
    const data = buildInitialDisplayData(session, costs)
    expect(data.buildFormatted).toBe('1,000.00')
    expect(data.wholeLifeCarbonFormatted).toBe('1,500.00')
    expect(data.netCarbonFormatted).toBe('1,200.00')
  })

  test('includes formatted currency fields', () => {
    const session = makeSession()
    const costs = extractCarbonCosts(session)
    const data = buildInitialDisplayData(session, costs)
    expect(data.benefitDisplay).toBe('£50,000')
    expect(data.capitalCostEstimateDisplay).toBe('£100,000')
  })
})

describe('mergeCalculatedValues', () => {
  test('merges calc data and adds formatted fields', () => {
    const session = makeSession()
    const costs = extractCarbonCosts(session)
    const displayData = buildInitialDisplayData(session, costs)
    const calcData = {
      capitalCarbonBaseline: 2000,
      capitalCarbonTarget: 1800,
      operationalCarbonBaseline: 300,
      operationalCarbonTarget: 250,
      netCarbonEstimate: 1200,
      netCarbonWithBlanks: null,
      constructionTotalFunding: 500000,
      carbonCostBuild: 1000,
      carbonCostOperation: 500,
      carbonCostSequestered: 200,
      carbonCostAvoided: 100
    }
    const result = mergeCalculatedValues(displayData, calcData)
    expect(result.capitalCarbonBaselineFormatted).toBe('2,000.00')
    expect(result.netCarbonEstimateFormatted).toBe('1,200.00')
    expect(result.netCarbonWithBlanksFormatted).toBeNull()
    expect(result.allCarbonValuesPresent).toBe(true)
    expect(result.constructionTotalFunding).toBe('£500,000')
  })

  test('uses displayData.netCarbon when netCarbonEstimate is null', () => {
    const session = makeSession()
    const costs = extractCarbonCosts(session)
    const displayData = buildInitialDisplayData(session, costs)
    const calcData = {
      capitalCarbonBaseline: null,
      capitalCarbonTarget: null,
      operationalCarbonBaseline: null,
      operationalCarbonTarget: null,
      netCarbonEstimate: null,
      netCarbonWithBlanks: null,
      constructionTotalFunding: null,
      carbonCostBuild: null,
      carbonCostOperation: null,
      carbonCostSequestered: null,
      carbonCostAvoided: null
    }
    const result = mergeCalculatedValues(displayData, calcData)
    expect(result.netCarbonEstimate).toBe(displayData.netCarbon)
    expect(result.allCarbonValuesPresent).toBe(false)
  })
})

describe('hasAllCarbonValues', () => {
  test('returns true when all fields are present', () => {
    expect(
      hasAllCarbonValues({
        carbonCostBuild: 1,
        carbonCostOperation: 2,
        carbonCostSequestered: 3,
        carbonCostAvoided: 4
      })
    ).toBe(true)
  })

  test('returns false when a field is null', () => {
    expect(
      hasAllCarbonValues({
        carbonCostBuild: 1,
        carbonCostOperation: null,
        carbonCostSequestered: 3,
        carbonCostAvoided: 4
      })
    ).toBe(false)
  })
})

describe('applyFallbackValues', () => {
  test('sets netCarbonEstimate to netCarbon and allCarbonValuesPresent to false', () => {
    const displayData = {
      netCarbon: 999,
      netCarbonEstimate: 0,
      allCarbonValuesPresent: true
    }
    applyFallbackValues(displayData)
    expect(displayData.netCarbonEstimate).toBe(999)
    expect(displayData.allCarbonValuesPresent).toBe(false)
  })
})

describe('logError', () => {
  test('calls request.log when it exists', () => {
    const mockLog = vi.fn()
    const request = { log: mockLog }
    logError(request, ['error'], 'something went wrong')
    expect(mockLog).toHaveBeenCalledWith(['error'], 'something went wrong')
  })

  test('does nothing when request.log is absent', () => {
    expect(() => logError({}, ['error'], 'msg')).not.toThrow()
  })
})
