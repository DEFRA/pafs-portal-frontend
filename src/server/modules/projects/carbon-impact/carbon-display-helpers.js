import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'
import { formatCurrency, formatEmission } from './controller-helpers.js'

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
export const buildInitialDisplayData = (sessionData, carbonCosts) => {
  const wholeLifeCarbon = carbonCosts.build + carbonCosts.operation
  const netCarbon =
    carbonCosts.build +
    carbonCosts.operation -
    carbonCosts.sequestered -
    carbonCosts.avoided
  return {
    build: carbonCosts.build,
    operation: carbonCosts.operation,
    sequestered: carbonCosts.sequestered,
    avoided: carbonCosts.avoided,
    wholeLifeCarbon,
    netCarbon,
    buildFormatted: formatEmission(carbonCosts.build),
    operationFormatted: formatEmission(carbonCosts.operation),
    sequesteredFormatted: formatEmission(carbonCosts.sequestered),
    avoidedFormatted: formatEmission(carbonCosts.avoided),
    wholeLifeCarbonFormatted: formatEmission(wholeLifeCarbon),
    netCarbonFormatted: formatEmission(netCarbon),
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
  enriched.allCarbonValuesPresent = hasAllCarbonValues(c)
  enriched.constructionTotalFunding = formatCurrency(c.constructionTotalFunding)
  enriched.capitalCostEstimateDisplay = enriched.constructionTotalFunding

  // Formatted emission values for calculated fields
  enriched.capitalCarbonBaselineFormatted = formatEmission(
    c.capitalCarbonBaseline
  )
  enriched.capitalCarbonTargetFormatted = formatEmission(c.capitalCarbonTarget)
  enriched.operationalCarbonBaselineFormatted = formatEmission(
    c.operationalCarbonBaseline
  )
  enriched.operationalCarbonTargetFormatted = formatEmission(
    c.operationalCarbonTarget
  )
  enriched.netCarbonEstimateFormatted = formatEmission(
    c.netCarbonEstimate ?? displayData.netCarbon
  )
  enriched.netCarbonWithBlanksFormatted = formatEmission(c.netCarbonWithBlanks)

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
