import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasByParentIds,
  filterAreasExcludingIds,
  getAreaById
} from '../../common/helpers/area-filters.js'

/**
 * Group PSO teams by their parent EA area
 * @param {Array} psoTeams - Array of PSO team objects
 * @param {Array} allAreas - Array of all areas (to get EA area names)
 * @param {Array} selectedEaAreaIds - Array of selected EA area IDs
 * @returns {Array} Array of objects with eaArea and teams properties
 */
function groupPsoTeamsByEaArea(psoTeams, allAreas, selectedEaAreaIds) {
  const grouped = []

  // For each selected EA area, get its PSO teams
  for (const eaAreaId of selectedEaAreaIds) {
    const eaArea = getAreaById(allAreas, eaAreaId)
    if (eaArea) {
      const teams = psoTeams.filter((team) => {
        const teamParentId =
          typeof team.parent_id === 'string'
            ? parseInt(team.parent_id, 10)
            : team.parent_id
        const eaAreaIdNum =
          typeof eaAreaId === 'string' ? parseInt(eaAreaId, 10) : eaAreaId
        return teamParentId === eaAreaIdNum
      })

      if (teams.length > 0) {
        grouped.push({
          eaArea: {
            id: eaArea.id,
            name: eaArea.name
          },
          teams
        })
      }
    }
  }

  return grouped
}

const CHECK_ANSWERS_URL = '/account_request/check-answers'
const CHECK_ANSWERS_RETURN_TO = 'check-answers'

function buildViewModel(
  request,
  returnTo,
  values = {},
  additionalPsoTeamsByEaArea = []
) {
  return {
    title: request.t('account-request.additionalPsoTeams.heading'),
    values,
    returnTo,
    additionalPsoTeamsByEaArea
  }
}

async function handlePost(request, h) {
  const payload = request.payload ?? {}
  let additionalPsoTeams = payload.additionalPsoTeams ?? []

  if (!Array.isArray(additionalPsoTeams)) {
    additionalPsoTeams = additionalPsoTeams ? [additionalPsoTeams] : []
  }

  const values = { additionalPsoTeams }
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.additionalPsoTeams = values
  request.yar.set('accountRequest', sessionData)

  return h.redirect(CHECK_ANSWERS_URL)
}

async function loadAdditionalPsoTeamsByEaArea(
  request,
  selectedEaAreaIds,
  mainPsoTeamId
) {
  const areas = await getCachedAreas(request.server, getAreas)
  if (!areas || selectedEaAreaIds.length === 0) {
    request.server.logger.warn(
      { selectedEaAreaIds, selectedEaAreaCount: selectedEaAreaIds.length },
      'Failed to load additional PSO teams - missing EA area selection'
    )
    return []
  }

  const allPsoAreas = filterAreasByType(areas, 'PSO Area')
  const psoTeamsByEaAreas = filterAreasByParentIds(
    allPsoAreas,
    selectedEaAreaIds
  )

  // Exclude the main selected PSO team
  const additionalPsoTeams = mainPsoTeamId
    ? filterAreasExcludingIds(psoTeamsByEaAreas, [mainPsoTeamId])
    : psoTeamsByEaAreas

  // Group by EA area
  const additionalPsoTeamsByEaArea = groupPsoTeamsByEaArea(
    additionalPsoTeams,
    areas,
    selectedEaAreaIds
  )

  request.server.logger.info(
    {
      additionalPsoTeamsCount: additionalPsoTeams.length,
      groupedCount: additionalPsoTeamsByEaArea.length,
      selectedEaAreaIds,
      selectedEaAreaCount: selectedEaAreaIds.length,
      mainPsoTeamId
    },
    'Additional PSO teams loaded and grouped by EA area'
  )

  return additionalPsoTeamsByEaArea
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  const values = sessionData.additionalPsoTeams ?? {}

  // Check for returnTo in query string (from main-pso-team redirect) or from query param
  const returnTo =
    request.query.returnTo === CHECK_ANSWERS_RETURN_TO ||
    request.query.from === CHECK_ANSWERS_RETURN_TO
      ? CHECK_ANSWERS_RETURN_TO
      : undefined

  // Get selected EA areas and main PSO team from session
  const selectedEaAreaIds = sessionData.eaArea?.eaAreas ?? []
  const mainPsoTeamId = sessionData.mainPsoTeam?.mainPsoTeam

  // Load PSO teams filtered by all selected EA areas, excluding main selected team, and group by EA area
  let additionalPsoTeamsByEaArea = []
  try {
    additionalPsoTeamsByEaArea = await loadAdditionalPsoTeamsByEaArea(
      request,
      selectedEaAreaIds,
      mainPsoTeamId
    )
  } catch (error) {
    request.server.logger.error(
      { error: error.message, stack: error.stack },
      'Error loading additional PSO teams'
    )
  }

  return h.view(
    'account_requests/additional-pso-teams/index.njk',
    buildViewModel(request, returnTo, values, additionalPsoTeamsByEaArea)
  )
}

export const accountRequestAdditionalPsoTeamsController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
