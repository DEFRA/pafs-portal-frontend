import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { updateSessionData } from '../project-utils.js'
import {
  buildInitialDisplayData,
  extractCarbonCosts,
  hasAllCarbonValues,
  mergeCalculatedValues
} from '../../carbon-impact/carbon-display-helpers.js'

const CARBON_DATA_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD,
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION,
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED,
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED,
  PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
]

const hasCarbonData = (projectData) =>
  CARBON_DATA_FIELDS.some((field) => projectData[field] != null)

const buildCarbonCalc = (c) => ({
  capitalCarbonBaseline: c.capitalCarbonBaseline,
  capitalCarbonTarget: c.capitalCarbonTarget,
  operationalCarbonBaseline: c.operationalCarbonBaseline,
  operationalCarbonTarget: c.operationalCarbonTarget,
  netCarbonEstimate: c.netCarbonEstimate,
  netCarbonWithBlanks: c.netCarbonWithBlanks,
  constructionTotalFunding: c.constructionTotalFunding,
  hasValuesChanged: c.hasValuesChanged === true,
  hexdigest: c.hexdigest,
  allCarbonValuesPresent: hasAllCarbonValues(c)
})

/**
 * Data enrichment function: reads pre-computed carbon impact values from the
 * project overview response (embedded as `carbonCalc` by the backend).
 *
 * The backend now computes carbon results inside GET /api/v1/project/:ref,
 * so no separate /carbon-impact API call is needed here.
 *
 * @param {Object} request - Hapi request object
 * @param {Object} projectData - Current project data (already includes carbonCalc)
 * @returns {Promise<Object>} { success, projectData }
 */
export async function getCarbonImpactOverviewData(request, projectData) {
  if (!hasCarbonData(projectData)) {
    return { success: true, projectData }
  }

  try {
    const rawCalc = projectData.carbonCalc

    const carbonCosts = extractCarbonCosts(projectData)
    let carbonDisplay = buildInitialDisplayData(projectData, carbonCosts)

    if (rawCalc) {
      carbonDisplay = mergeCalculatedValues(carbonDisplay, rawCalc)
      const enrichedData = {
        ...projectData,
        carbonCalc: buildCarbonCalc(rawCalc),
        carbonDisplay
      }

      updateSessionData(request, enrichedData)

      return { success: true, projectData: enrichedData }
    }

    // carbonCalc absent (e.g. backend calculation failed) — return with formatted session values
    return { success: true, projectData: { ...projectData, carbonDisplay } }
  } catch (error) {
    request.server?.logger?.error?.(
      { err: error },
      'Carbon impact overview enrichment failed'
    )
    return { success: true, projectData }
  }
}
