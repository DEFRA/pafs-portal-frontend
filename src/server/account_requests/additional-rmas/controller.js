import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasByParentIds,
  filterAreasExcludingIds,
  getAreaById
} from '../../common/helpers/area-filters.js'

const CHECK_ANSWERS_URL = '/account_request/check-answers'
const CHECK_ANSWERS_RETURN_TO = 'check-answers'

function buildViewModel(
  request,
  values = {},
  returnTo,
  additionalRmasByPsoTeam = []
) {
  return {
    title: request.t('account-request.additionalRmas.heading'),
    values,
    returnTo,
    additionalRmasByPsoTeam
  }
}

/**
 * Group RMAs by their parent PSO team and EA area, excluding main RMA
 * @param {Array} rmas - Array of RMA objects
 * @param {Array} allAreas - Array of all areas (to get PSO team and EA area names)
 * @param {Array} selectedPsoTeamIds - Array of selected PSO team IDs
 * @param {string|number} mainRmaId - Main RMA ID to exclude
 * @returns {Array} Array of objects with eaArea, psoTeam, and rmas properties
 */
function groupRmasByPsoTeam(rmas, allAreas, selectedPsoTeamIds, mainRmaId) {
  const grouped = []

  // For each selected PSO team, get its RMAs and parent EA area
  for (const psoTeamId of selectedPsoTeamIds) {
    const psoTeam = getAreaById(allAreas, psoTeamId)
    if (psoTeam) {
      // Get the EA area that is the parent of this PSO team
      const eaArea = getAreaById(allAreas, psoTeam.parent_id)

      // Get RMAs that have this PSO team as parent, excluding main RMA
      const teamRmas = rmas.filter((rma) => {
        const rmaParentId =
          typeof rma.parent_id === 'string'
            ? parseInt(rma.parent_id, 10)
            : rma.parent_id
        const psoTeamIdNum =
          typeof psoTeamId === 'string' ? parseInt(psoTeamId, 10) : psoTeamId

        // Check if RMA belongs to this PSO team and is not the main RMA
        const belongsToTeam = rmaParentId === psoTeamIdNum
        const rmaId = typeof rma.id === 'string' ? parseInt(rma.id, 10) : rma.id
        const mainRmaIdNum = mainRmaId
          ? typeof mainRmaId === 'string'
            ? parseInt(mainRmaId, 10)
            : mainRmaId
          : null
        const isNotMainRma = !mainRmaIdNum || rmaId !== mainRmaIdNum

        return belongsToTeam && isNotMainRma
      })

      if (teamRmas.length > 0 && eaArea) {
        grouped.push({
          eaArea: {
            id: eaArea.id,
            name: eaArea.name
          },
          psoTeam: {
            id: psoTeam.id,
            name: psoTeam.name
          },
          rmas: teamRmas
        })
      }
    }
  }

  return grouped
}

async function handlePost(request, h) {
  const payload = request.payload ?? {}
  let additionalRmas = payload.additionalRmas ?? []

  if (!Array.isArray(additionalRmas)) {
    additionalRmas = additionalRmas ? [additionalRmas] : []
  }

  const values = { additionalRmas }
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.additionalRmas = values
  request.yar.set('accountRequest', sessionData)

  return h.redirect(CHECK_ANSWERS_URL)
}

async function loadAdditionalRmasByPsoTeam(
  request,
  selectedPsoTeamIds,
  mainRmaId
) {
  const areas = await getCachedAreas(request.server, getAreas)
  if (!areas || selectedPsoTeamIds.length === 0) {
    request.server.logger.warn(
      {
        selectedPsoTeamIds,
        selectedPsoTeamCount: selectedPsoTeamIds.length
      },
      'Failed to load additional RMAs - missing PSO team selection'
    )
    return []
  }

  const allRmaAreas = filterAreasByType(areas, 'RMA')
  const rmasByPsoTeams = filterAreasByParentIds(allRmaAreas, selectedPsoTeamIds)

  // Exclude the main selected RMA and group by PSO team
  const rmasExcludingMain = mainRmaId
    ? filterAreasExcludingIds(rmasByPsoTeams, [mainRmaId])
    : rmasByPsoTeams

  const additionalRmasByPsoTeam = groupRmasByPsoTeam(
    rmasExcludingMain,
    areas,
    selectedPsoTeamIds,
    mainRmaId
  )

  request.server.logger.info(
    {
      additionalRmasCount: rmasExcludingMain.length,
      groupedCount: additionalRmasByPsoTeam.length,
      selectedPsoTeamIds,
      selectedPsoTeamCount: selectedPsoTeamIds.length,
      mainRmaId
    },
    'Additional RMAs loaded and grouped by PSO team'
  )

  return additionalRmasByPsoTeam
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  const values = sessionData.additionalRmas ?? {}
  const returnTo =
    request.query.from === CHECK_ANSWERS_RETURN_TO
      ? CHECK_ANSWERS_RETURN_TO
      : undefined

  // Get selected PSO teams and main RMA from session
  const selectedPsoTeamIds = sessionData.psoTeam?.psoTeams ?? []
  const mainRmaId = sessionData.mainRma?.mainRma

  // Load RMAs filtered by all selected PSO teams, grouped by PSO team, excluding main selected RMA
  let additionalRmasByPsoTeam = []
  try {
    additionalRmasByPsoTeam = await loadAdditionalRmasByPsoTeam(
      request,
      selectedPsoTeamIds,
      mainRmaId
    )
  } catch (error) {
    request.server.logger.error(
      { error: error.message, stack: error.stack },
      'Error loading additional RMAs'
    )
  }

  return h.view(
    'account_requests/additional-rmas/index.njk',
    buildViewModel(request, values, returnTo, additionalRmasByPsoTeam)
  )
}

export const accountRequestAdditionalRmasController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
