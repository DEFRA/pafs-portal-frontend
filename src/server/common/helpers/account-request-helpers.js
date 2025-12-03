function parseAreaId(areaId) {
  return typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
}

function addArea(areas, areaId, isPrimary) {
  if (areaId) {
    areas.push({
      area_id: parseAreaId(areaId),
      primary: isPrimary
    })
  }
}

function addAreas(areas, areaIds, isPrimary) {
  if (Array.isArray(areaIds) && areaIds.length > 0) {
    areaIds.forEach((areaId) => {
      addArea(areas, areaId, isPrimary)
    })
  }
}

function prepareEaAreas(sessionData, areas) {
  const mainEaAreaId = sessionData.eaMainArea?.mainEaArea
  const additionalEaAreaIds =
    sessionData.eaAdditionalAreas?.additionalEaAreas ?? []

  addArea(areas, mainEaAreaId, true)
  addAreas(areas, additionalEaAreaIds, false)
}

function preparePsoAreas(sessionData, areas) {
  const eaAreaIds = sessionData.eaArea?.eaAreas ?? []
  const mainPsoTeamId = sessionData.mainPsoTeam?.mainPsoTeam
  const additionalPsoTeamIds =
    sessionData.additionalPsoTeams?.additionalPsoTeams ?? []

  addAreas(areas, eaAreaIds, false)
  addArea(areas, mainPsoTeamId, true)
  addAreas(areas, additionalPsoTeamIds, false)
}

function prepareRmaAreas(sessionData, areas) {
  const rmaEaAreaIds = sessionData.eaArea?.eaAreas ?? []
  const psoTeamIds = sessionData.psoTeam?.psoTeams ?? []
  const mainRmaId = sessionData.mainRma?.mainRma
  const additionalRmaIds = sessionData.additionalRmas?.additionalRmas ?? []

  addAreas(areas, rmaEaAreaIds, false)
  addAreas(areas, psoTeamIds, false)
  addArea(areas, mainRmaId, true)
  addAreas(areas, additionalRmaIds, false)
}

/**
 * Prepare complete JSON payload for backend API submission
 * @param {Object} sessionData - Session data containing all account request information
 * @returns {Object} JSON payload ready for backend API
 *
 * Structure:
 * {
 *   user: {
 *     firstName: string,
 *     lastName: string,
 *     emailAddress: string,
 *     telephoneNumber: string,
 *     organisation: string,
 *     jobTitle: string,
 *     responsibility: string
 *   },
 *   areas: [
 *     {
 *       area_id: number,
 *       primary: boolean
 *     }
 *   ]
 * }
 */
export function prepareAccountRequestPayload(sessionData) {
  const details = sessionData.details ?? {}
  const responsibility = details.responsibility

  // Prepare user data
  const userData = {
    firstName: details.firstName ?? '',
    lastName: details.lastName ?? '',
    emailAddress: details.emailAddress ?? '',
    telephoneNumber: details.telephoneNumber ?? '',
    organisation: details.organisation ?? '',
    jobTitle: details.jobTitle ?? '',
    responsibility: responsibility ?? ''
  }

  // Prepare areas data (without user_id, as backend will handle that)
  const areas = []

  switch (responsibility) {
    case 'EA':
      prepareEaAreas(sessionData, areas)
      break

    case 'PSO':
      preparePsoAreas(sessionData, areas)
      break

    case 'RMA':
      prepareRmaAreas(sessionData, areas)
      break

    default:
      // Unknown responsibility - leave areas empty
      break
  }

  return {
    user: userData,
    areas
  }
}
