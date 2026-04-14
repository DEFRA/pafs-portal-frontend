import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'
import { getCarbonImpactCalc } from '../../../../common/services/project/project-service.js'
import { updateSessionData } from '../project-utils.js'

/**
 * Data enrichment function: Fetches recalculated carbon impact values from the
 * backend on every overview page load.
 *
 * On each load:
 * - Reads the rates JSON dynamically (via the backend calculator)
 * - Recalculates all carbon baselines and targets
 * - Compares the recalculated hexdigest against the stored hexdigest
 * - Sets a `carbonValuesChanged` flag if they differ
 *
 * Follows the enrichment pattern: (request, projectData) => { success, projectData, error? }
 *
 * @param {Object} request - Hapi request object
 * @param {Object} projectData - Current project data
 * @returns {Promise<Object>} { success, projectData, error? }
 */
export async function getCarbonImpactOverviewData(request, projectData) {
  // Only fetch if the project has carbon data (at least one field populated)
  const hasCarbonData =
    projectData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD] != null ||
    projectData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION] != null ||
    projectData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED] != null ||
    projectData[PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED] != null ||
    projectData[PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT] !=
      null ||
    projectData[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST] != null

  if (!hasCarbonData) {
    return { success: true, projectData }
  }

  try {
    const authSession = getAuthSession(request)
    const accessToken = authSession?.accessToken || ''
    const referenceNumber = projectData[PROJECT_PAYLOAD_FIELDS.SLUG]

    const calcResult = await getCarbonImpactCalc(referenceNumber, accessToken)

    if (calcResult?.success && calcResult?.data) {
      const c = calcResult.data

      // Enrich projectData with calculated values for the template
      const enrichedData = {
        ...projectData,
        carbonCalc: {
          capitalCarbonBaseline: c.capitalCarbonBaseline,
          capitalCarbonTarget: c.capitalCarbonTarget,
          operationalCarbonBaseline: c.operationalCarbonBaseline,
          operationalCarbonTarget: c.operationalCarbonTarget,
          netCarbonEstimate: c.netCarbonEstimate,
          netCarbonWithBlanks: c.netCarbonWithBlanks,
          constructionTotalFunding: c.constructionTotalFunding,
          hasValuesChanged: c.hasValuesChanged === true,
          hexdigest: c.hexdigest,
          allCarbonValuesPresent:
            c.carbonCostBuild != null &&
            c.carbonCostOperation != null &&
            c.carbonCostSequestered != null &&
            c.carbonCostAvoided != null
        }
      }

      // Update session with enriched data so it's available for the template
      updateSessionData(request, enrichedData)

      return { success: true, projectData: enrichedData }
    }

    // API returned but no success — still render page without calculated values
    return { success: true, projectData }
  } catch (error) {
    // Non-fatal — page still renders without calculated carbon values
    request.server?.logger?.error?.(
      { err: error },
      'Carbon impact overview enrichment failed'
    )
    return { success: true, projectData }
  }
}
