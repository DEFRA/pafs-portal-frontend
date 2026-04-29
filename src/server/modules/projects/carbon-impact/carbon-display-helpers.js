import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'
import { formatCurrency } from './controller-helpers.js'

/**
 * Convert a tCO2e string value (up to 18 integer digits or 16 digits + 2dp)
 * to a BigInt scaled by 100, enabling exact integer arithmetic.
 * Returns 0n for null, empty, or invalid-format strings.
 */
const TONNES_INPUT_REGEX = /^\d+(\.\d{1,2})?$/

const toScaledBigInt = (strValue) => {
  if (strValue == null || strValue === '') {
    return 0n
  }
  const s = String(strValue).trim()
  if (!s || !TONNES_INPUT_REGEX.test(s)) {
    return 0n
  }
  const dotIdx = s.indexOf('.')
  if (dotIdx === -1) {
    return BigInt(s) * 100n
  }
  const intStr = s.slice(0, dotIdx) || '0'
  const decStr = (s.slice(dotIdx + 1) + '00').slice(0, 2)
  return BigInt(intStr) * 100n + BigInt(decStr)
}

/**
 * Format a BigInt scaled by 100 back to a fixed 2 decimal place string.
 * Handles negative results (e.g. when avoided/sequestered exceed build/operation).
 */
const scaledBigIntToFixed2 = (scaled) => {
  const neg = scaled < 0n
  const abs = neg ? -scaled : scaled
  const intPart = abs / 100n
  const decPart = String(abs % 100n).padStart(2, '0')
  return `${neg ? '-' : ''}${intPart}.${decPart}`
}

/**
 * Format a tCO2e value to always exactly 2 decimal places.
 *
 * - null / undefined → null  (preserves null-checks in templates for optional backend values)
 * - empty string     → '0.00' (user input field not filled in)
 * - string input     → BigInt fixed-point for exact precision up to 18 significant digits
 * - number input     → toFixed(2) (backend API values already limited by JSON precision)
 */
export const formatTonnes = (value) => {
  if (value == null) {
    return null
  }
  if (value === '') {
    return '0.00'
  }
  if (typeof value === 'string') {
    const s = value.trim()
    if (!s) {
      return '0.00'
    }
    return scaledBigIntToFixed2(toScaledBigInt(s))
  }
  const num =
    typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (Number.isNaN(num)) {
    return null
  }
  return num.toFixed(2)
}

/**
 * Extract and convert carbon cost values from session data.
 * Returns raw strings so that BigInt arithmetic can be applied without
 * precision loss from Number conversion.
 */
export const extractCarbonCosts = (sessionData) => ({
  build: sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD] ?? '',
  operation: sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION] ?? '',
  sequestered:
    sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED] ?? '',
  avoided: sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED] ?? ''
})

/**
 * Build initial display data from session values.
 * Whole-life carbon and net carbon are computed with BigInt fixed-point
 * arithmetic to preserve full precision for values up to 18 digits.
 * All tCO2e display values are pre-formatted to exactly 2 decimal places.
 */
export const buildInitialDisplayData = (sessionData, carbonCosts) => {
  const buildScaled = toScaledBigInt(carbonCosts.build)
  const operationScaled = toScaledBigInt(carbonCosts.operation)
  const sequesteredScaled = toScaledBigInt(carbonCosts.sequestered)
  const avoidedScaled = toScaledBigInt(carbonCosts.avoided)

  return {
    build: formatTonnes(carbonCosts.build) ?? '0.00',
    operation: formatTonnes(carbonCosts.operation) ?? '0.00',
    sequestered: formatTonnes(carbonCosts.sequestered) ?? '0.00',
    avoided: formatTonnes(carbonCosts.avoided) ?? '0.00',
    wholeLifeCarbon: scaledBigIntToFixed2(buildScaled + operationScaled),
    netCarbon: scaledBigIntToFixed2(
      buildScaled + operationScaled - sequesteredScaled - avoidedScaled
    ),
    benefit:
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT],
    forecast:
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST],
    benefitDisplay: formatCurrency(
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]
    ),
    forecastDisplay: formatCurrency(
      sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]
    ),
    capitalCostEstimateDisplay: formatCurrency(
      sessionData[
        PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS
      ]
    )
  }
}

/**
 * Merge backend calculated values into display data.
 * All tCO2e values from the API are formatted to 2 decimal places.
 * Currency values are formatted with formatCurrency (no decimals).
 */
export const mergeCalculatedValues = (displayData, calcData) => {
  const enriched = { ...displayData }
  const c = calcData

  enriched.capitalCarbonBaseline = formatTonnes(c.capitalCarbonBaseline)
  enriched.capitalCarbonTarget = formatTonnes(c.capitalCarbonTarget)
  enriched.operationalCarbonBaseline = formatTonnes(c.operationalCarbonBaseline)
  enriched.operationalCarbonTarget = formatTonnes(c.operationalCarbonTarget)
  enriched.netCarbonEstimate =
    c.netCarbonEstimate == null
      ? displayData.netCarbon
      : formatTonnes(c.netCarbonEstimate)
  enriched.netCarbonWithBlanks = formatTonnes(c.netCarbonWithBlanks)
  enriched.allCarbonValuesPresent = hasAllCarbonValues(c)
  enriched.constructionTotalFunding = formatCurrency(c.constructionTotalFunding)
  enriched.capitalCostEstimateDisplay = enriched.constructionTotalFunding

  return enriched
}

/**
 * Check whether all four carbon cost fields are present
 */
export const hasAllCarbonValues = (c) =>
  c.carbonCostBuild != null &&
  c.carbonCostOperation != null &&
  c.carbonCostSequestered != null &&
  c.carbonCostAvoided != null

/**
 * Apply fallback values when API call fails
 */
export const applyFallbackValues = (displayData) => {
  displayData.netCarbonEstimate = displayData.netCarbon
  displayData.allCarbonValuesPresent = false
}

/**
 * Safe logging helper
 */
export const logError = (request, tags, message) => {
  if (request.log) {
    request.log(tags, message)
  }
}
