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
    case 'EA': {
      // EA: Main EA Area (primary) + Additional EA Areas
      const mainEaAreaId = sessionData.eaMainArea?.mainEaArea
      const additionalEaAreaIds =
        sessionData.eaAdditionalAreas?.additionalEaAreas ?? []

      // Add main EA area as primary
      if (mainEaAreaId) {
        const mainEaAreaIdNum =
          typeof mainEaAreaId === 'string'
            ? parseInt(mainEaAreaId, 10)
            : mainEaAreaId
        areas.push({
          area_id: mainEaAreaIdNum,
          primary: true
        })
      }

      // Add additional EA areas as non-primary
      if (
        Array.isArray(additionalEaAreaIds) &&
        additionalEaAreaIds.length > 0
      ) {
        additionalEaAreaIds.forEach((areaId) => {
          const areaIdNum =
            typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
          areas.push({
            area_id: areaIdNum,
            primary: false
          })
        })
      }
      break
    }

    case 'PSO': {
      // PSO: EA Areas + Main PSO Team (primary) + Additional PSO Teams
      const eaAreaIds = sessionData.eaArea?.eaAreas ?? []
      const mainPsoTeamId = sessionData.mainPsoTeam?.mainPsoTeam
      const additionalPsoTeamIds =
        sessionData.additionalPsoTeams?.additionalPsoTeams ?? []

      // Add EA areas as non-primary
      if (Array.isArray(eaAreaIds) && eaAreaIds.length > 0) {
        eaAreaIds.forEach((areaId) => {
          const areaIdNum =
            typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
          areas.push({
            area_id: areaIdNum,
            primary: false
          })
        })
      }

      // Add main PSO team as primary
      if (mainPsoTeamId) {
        const mainPsoTeamIdNum =
          typeof mainPsoTeamId === 'string'
            ? parseInt(mainPsoTeamId, 10)
            : mainPsoTeamId
        areas.push({
          area_id: mainPsoTeamIdNum,
          primary: true
        })
      }

      // Add additional PSO teams as non-primary
      if (
        Array.isArray(additionalPsoTeamIds) &&
        additionalPsoTeamIds.length > 0
      ) {
        additionalPsoTeamIds.forEach((areaId) => {
          const areaIdNum =
            typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
          areas.push({
            area_id: areaIdNum,
            primary: false
          })
        })
      }
      break
    }

    case 'RMA': {
      // RMA: EA Areas + PSO Teams + Main RMA (primary) + Additional RMAs
      const rmaEaAreaIds = sessionData.eaArea?.eaAreas ?? []
      const psoTeamIds = sessionData.psoTeam?.psoTeams ?? []
      const mainRmaId = sessionData.mainRma?.mainRma
      const additionalRmaIds = sessionData.additionalRmas?.additionalRmas ?? []

      // Add EA areas as non-primary
      if (Array.isArray(rmaEaAreaIds) && rmaEaAreaIds.length > 0) {
        rmaEaAreaIds.forEach((areaId) => {
          const areaIdNum =
            typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
          areas.push({
            area_id: areaIdNum,
            primary: false
          })
        })
      }

      // Add PSO teams as non-primary
      if (Array.isArray(psoTeamIds) && psoTeamIds.length > 0) {
        psoTeamIds.forEach((areaId) => {
          const areaIdNum =
            typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
          areas.push({
            area_id: areaIdNum,
            primary: false
          })
        })
      }

      // Add main RMA as primary
      if (mainRmaId) {
        const mainRmaIdNum =
          typeof mainRmaId === 'string' ? parseInt(mainRmaId, 10) : mainRmaId
        areas.push({
          area_id: mainRmaIdNum,
          primary: true
        })
      }

      // Add additional RMAs as non-primary
      if (Array.isArray(additionalRmaIds) && additionalRmaIds.length > 0) {
        additionalRmaIds.forEach((areaId) => {
          const areaIdNum =
            typeof areaId === 'string' ? parseInt(areaId, 10) : areaId
          areas.push({
            area_id: areaIdNum,
            primary: false
          })
        })
      }
      break
    }
  }

  return {
    user: userData,
    areas
  }
}
