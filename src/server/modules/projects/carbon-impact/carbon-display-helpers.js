import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'
import { formatCurrency } from './controller-helpers.js'

/**
 * Extract and convert carbon cost values from session data
 */
export const extractCarbonCosts = (sessionData) => ({
  build: Number(sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD] || 0),
  operation: Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION] || 0
  ),
  sequestered: Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED] || 0
  ),
  avoided: Number(sessionData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED] || 0)
})

/**
 * Build initial display data from session values
 */
export const buildInitialDisplayData = (sessionData, carbonCosts) => ({
  build: carbonCosts.build,
  operation: carbonCosts.operation,
  sequestered: carbonCosts.sequestered,
  avoided: carbonCosts.avoided,
  wholeLifeCarbon: carbonCosts.build + carbonCosts.operation,
  netCarbon:
    carbonCosts.build +
    carbonCosts.operation -
    carbonCosts.sequestered -
    carbonCosts.avoided,
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
    sessionData[PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS]
  )
})

/**
 * Merge backend calculated values into display data
 */
export const mergeCalculatedValues = (displayData, calcData) => {
  const enriched = { ...displayData }
  const c = calcData

  enriched.capitalCarbonBaseline = c.capitalCarbonBaseline
  enriched.capitalCarbonTarget = c.capitalCarbonTarget
  enriched.operationalCarbonBaseline = c.operationalCarbonBaseline
  enriched.operationalCarbonTarget = c.operationalCarbonTarget
  enriched.netCarbonEstimate = c.netCarbonEstimate ?? displayData.netCarbon
  enriched.netCarbonWithBlanks = c.netCarbonWithBlanks
  enriched.allCarbonValuesPresent =
    c.carbonCostBuild != null &&
    c.carbonCostOperation != null &&
    c.carbonCostSequestered != null &&
    c.carbonCostAvoided != null
  enriched.constructionTotalFunding = formatCurrency(c.constructionTotalFunding)
  enriched.capitalCostEstimateDisplay = enriched.constructionTotalFunding

  return enriched
}

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
