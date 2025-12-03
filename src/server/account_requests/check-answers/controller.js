import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import { getAreaById } from '../../common/helpers/area-filters.js'
import { prepareAccountRequestPayload } from '../../common/helpers/account-request-helpers.js'

function buildViewModel(request, summaryData = {}) {
  return {
    title: request.t('account-request.checkAnswers.heading'),
    summaryData
  }
}

/**
 * Get area name by ID
 * @param {Array} areas - All areas from cache
 * @param {string|number} areaId - Area ID to look up
 * @returns {string} Area name or 'Unknown' if not found
 */
function getAreaName(areas, areaId) {
  if (!areaId) {
    return ''
  }
  const area = getAreaById(areas, areaId)
  return area ? area.name : 'Unknown'
}

/**
 * Get multiple area names by IDs
 * @param {Array} areas - All areas from cache
 * @param {Array<string|number>} areaIds - Array of area IDs
 * @returns {Array<string>} Array of area names
 */
function getAreaNames(areas, areaIds) {
  if (!Array.isArray(areaIds) || areaIds.length === 0) {
    return []
  }
  return areaIds
    .map((id) => getAreaName(areas, id))
    .filter((name) => name !== '')
}

/**
 * Build EA flow area summary
 * @param {Object} sessionData - Session data
 * @param {Array} areas - All areas from cache
 * @returns {Object} Area summary for EA flow
 */
function buildEaAreaSummary(sessionData, areas) {
  const mainEaAreaId = sessionData.eaMainArea?.mainEaArea
  const additionalEaAreaIds =
    sessionData.eaAdditionalAreas?.additionalEaAreas ?? []

  return {
    mainEaArea: {
      id: mainEaAreaId,
      name: getAreaName(areas, mainEaAreaId)
    },
    additionalEaAreas: getAreaNames(areas, additionalEaAreaIds)
  }
}

/**
 * Build PSO flow area summary
 * @param {Object} sessionData - Session data
 * @param {Array} areas - All areas from cache
 * @returns {Object} Area summary for PSO flow
 */
function buildPsoAreaSummary(sessionData, areas) {
  const eaAreaIds = sessionData.eaArea?.eaAreas ?? []
  const mainPsoTeamId = sessionData.mainPsoTeam?.mainPsoTeam
  const additionalPsoTeamIds =
    sessionData.additionalPsoTeams?.additionalPsoTeams ?? []

  return {
    eaAreas: getAreaNames(areas, eaAreaIds),
    mainPsoTeam: {
      id: mainPsoTeamId,
      name: getAreaName(areas, mainPsoTeamId)
    },
    additionalPsoTeams: getAreaNames(areas, additionalPsoTeamIds)
  }
}

/**
 * Build RMA flow area summary
 * @param {Object} sessionData - Session data
 * @param {Array} areas - All areas from cache
 * @returns {Object} Area summary for RMA flow
 */
function buildRmaAreaSummary(sessionData, areas) {
  const rmaEaAreaIds = sessionData.eaArea?.eaAreas ?? []
  const psoTeamIds = sessionData.psoTeam?.psoTeams ?? []
  const mainRmaId = sessionData.mainRma?.mainRma
  const additionalRmaIds = sessionData.additionalRmas?.additionalRmas ?? []

  return {
    eaAreas: getAreaNames(areas, rmaEaAreaIds),
    psoTeams: getAreaNames(areas, psoTeamIds),
    mainRma: {
      id: mainRmaId,
      name: getAreaName(areas, mainRmaId)
    },
    additionalRmas: getAreaNames(areas, additionalRmaIds)
  }
}

/**
 * Build summary data from session
 * @param {Object} sessionData - Session data
 * @param {Array} areas - All areas from cache
 * @returns {Object} Summary data object
 */
function buildSummaryData(sessionData, areas) {
  const details = sessionData.details ?? {}
  const responsibility = details.responsibility

  const summary = {
    personalDetails: {
      firstName: details.firstName ?? '',
      lastName: details.lastName ?? '',
      emailAddress: details.emailAddress ?? '',
      telephoneNumber: details.telephoneNumber ?? '',
      organisation: details.organisation ?? '',
      jobTitle: details.jobTitle ?? ''
    },
    responsibility: {
      value: responsibility,
      displayValue: getResponsibilityDisplayValue(responsibility)
    },
    areas: {}
  }

  // Determine which flow and build area summary
  switch (responsibility) {
    case 'EA':
      summary.areas = buildEaAreaSummary(sessionData, areas)
      break

    case 'PSO':
      summary.areas = buildPsoAreaSummary(sessionData, areas)
      break

    case 'RMA':
      summary.areas = buildRmaAreaSummary(sessionData, areas)
      break

    default:
      // Unknown responsibility - leave areas empty
      break
  }

  return summary
}

/**
 * Get display value for responsibility
 * @param {string} responsibility - Responsibility value
 * @returns {string} Display value
 */
function getResponsibilityDisplayValue(responsibility) {
  const mapping = {
    EA: 'Environment Agency – Area Programme Team',
    PSO: 'Environment Agency – Partnership & Strategic Overview Team',
    RMA: 'Risk Management Authority (RMA)'
  }
  return mapping[responsibility] || responsibility
}

export const accountRequestCheckAnswersController = {
  async handler(request, h) {
    // Handle POST - submit data and redirect to confirmation page
    if (request.method === 'post') {
      const sessionData = request.yar.get('accountRequest') ?? {}

      // Prepare JSON payload for backend API
      const payload = prepareAccountRequestPayload(sessionData)

      // Log the prepared payload for debugging
      request.server.logger.info(
        {
          payload,
          areasCount: payload.areas.length,
          primaryArea: payload.areas.find((area) => area.primary === true)
        },
        'Account request payload prepared for backend API'
      )

      // Clear session data after successful submission
      request.yar.set('accountRequest', {})

      return h.redirect('/account_request/confirmation')
    }

    // Handle GET - display check answers page
    const sessionData = request.yar.get('accountRequest') ?? {}

    // Load areas from cache to get names
    let areas = []
    try {
      areas = (await getCachedAreas(request.server, getAreas)) ?? []
    } catch (error) {
      request.server.logger.error(
        { error: error.message },
        'Error loading areas for check-answers page'
      )
    }

    // Build summary data
    const summaryData = buildSummaryData(sessionData, areas)

    // Prepare and log payload for backend API
    const payload = prepareAccountRequestPayload(sessionData)

    console.log(
      '\n*********************RAW SESSION DATA****************************'
    )
    console.log(JSON.stringify(sessionData, null, 2))
    console.log(
      '*********************RAW SESSION DATA*****************************\n'
    )

    console.log(
      '*********************BACKEND API PAYLOAD****************************'
    )
    console.log(JSON.stringify(payload, null, 2))
    console.log('Total areas:', payload.areas.length)
    console.log(
      'Primary area:',
      payload.areas.find((area) => area.primary === true)
    )
    console.log(
      '*********************BACKEND API PAYLOAD*****************************\n'
    )

    return h.view(
      'account_requests/check-answers/index.njk',
      buildViewModel(request, summaryData)
    )
  }
}
