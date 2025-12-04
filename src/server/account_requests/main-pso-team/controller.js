import { statusCodes } from '../../common/constants/status-codes.js'
import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasByParentIds,
  getAreaById
} from '../../common/helpers/area-filters.js'

const CHECK_ANSWERS_RETURN_TO = 'check-answers'
const ADDITIONAL_PSO_TEAMS_URL = '/account_request/additional-pso-teams'

function buildViewModel(
  request,
  returnTo,
  values = {},
  errors = {},
  errorSummary = [],
  psoTeamsByEaArea = []
) {
  return {
    title: request.t('account-request.mainPsoTeam.heading'),
    values,
    errors,
    errorSummary,
    returnTo,
    psoTeamsByEaArea
  }
}

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
            ? Number.parseInt(team.parent_id, 10)
            : team.parent_id
        const eaAreaIdNum =
          typeof eaAreaId === 'string'
            ? Number.parseInt(eaAreaId, 10)
            : eaAreaId
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

function validateMainPsoTeam(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  const values = {
    mainPsoTeam: payload.mainPsoTeam ?? ''
  }

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  if (!values.mainPsoTeam) {
    addError(
      'mainPsoTeam',
      'account-request.mainPsoTeam.errors.mainPsoTeamRequired',
      '#main-pso-team'
    )
  }

  return { values, errors, errorSummary }
}

async function loadPsoTeamsForErrorDisplay(request) {
  try {
    const sessionData = request.yar.get('accountRequest') ?? {}
    const selectedEaAreaIds = sessionData.eaArea?.eaAreas ?? []
    const areas = await getCachedAreas(request.server, getAreas)
    if (areas && selectedEaAreaIds.length > 0) {
      const allPsoAreas = filterAreasByType(areas, 'PSO Area')
      const psoTeams = filterAreasByParentIds(allPsoAreas, selectedEaAreaIds)
      return groupPsoTeamsByEaArea(psoTeams, areas, selectedEaAreaIds)
    }
  } catch (error) {
    request.server.logger.error(
      { error: error.message },
      'Error loading PSO teams for error display'
    )
  }
  return []
}

async function handlePostWithErrors(
  request,
  h,
  values,
  errors,
  errorSummary,
  returnTo
) {
  const psoTeamsByEaArea = await loadPsoTeamsForErrorDisplay(request)

  return h
    .view(
      'account_requests/main-pso-team/index.njk',
      buildViewModel(
        request,
        returnTo,
        values,
        errors,
        errorSummary,
        psoTeamsByEaArea
      )
    )
    .code(statusCodes.badRequest)
}

async function handlePostSuccess(request, h, values, returnTo) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.mainPsoTeam = values
  request.yar.set('accountRequest', sessionData)

  // Always go to additional-pso-teams, but pass returnTo if coming from check-answers
  const nextUrl =
    returnTo === CHECK_ANSWERS_RETURN_TO
      ? `${ADDITIONAL_PSO_TEAMS_URL}?returnTo=${CHECK_ANSWERS_RETURN_TO}`
      : ADDITIONAL_PSO_TEAMS_URL

  return h.redirect(nextUrl)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary } = validateMainPsoTeam(request)
  const returnTo = request.payload?.returnTo

  if (errorSummary.length) {
    return handlePostWithErrors(
      request,
      h,
      values,
      errors,
      errorSummary,
      returnTo
    )
  }

  return handlePostSuccess(request, h, values, returnTo)
}

function getReturnToFromQuery(request) {
  return request.query.returnTo === CHECK_ANSWERS_RETURN_TO ||
    request.query.from === CHECK_ANSWERS_RETURN_TO
    ? CHECK_ANSWERS_RETURN_TO
    : undefined
}

async function loadPsoTeamsByEaArea(request, selectedEaAreaIds) {
  const areas = await getCachedAreas(request.server, getAreas)
  if (!areas || selectedEaAreaIds.length === 0) {
    request.server.logger.warn(
      { selectedEaAreaIds, selectedEaAreaCount: selectedEaAreaIds.length },
      'Failed to load PSO teams - missing EA area selection'
    )
    return []
  }

  const allPsoAreas = filterAreasByType(areas, 'PSO Area')
  const psoTeams = filterAreasByParentIds(allPsoAreas, selectedEaAreaIds)
  const psoTeamsByEaArea = groupPsoTeamsByEaArea(
    psoTeams,
    areas,
    selectedEaAreaIds
  )

  request.server.logger.info(
    {
      psoTeamsCount: psoTeams.length,
      groupedCount: psoTeamsByEaArea.length,
      selectedEaAreaIds,
      selectedEaAreaCount: selectedEaAreaIds.length
    },
    'PSO teams loaded and grouped by EA area for main team selection'
  )

  return psoTeamsByEaArea
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  const values = sessionData.mainPsoTeam ?? {}
  const returnTo = getReturnToFromQuery(request)

  // Get selected EA areas from session (array from checkbox selection)
  const selectedEaAreaIds = sessionData.eaArea?.eaAreas ?? []

  // Load PSO teams filtered by all selected EA areas and group by EA area
  let psoTeamsByEaArea = []
  try {
    psoTeamsByEaArea = await loadPsoTeamsByEaArea(request, selectedEaAreaIds)
  } catch (error) {
    request.server.logger.error(
      { error: error.message, stack: error.stack },
      'Error loading PSO teams'
    )
  }

  return h.view(
    'account_requests/main-pso-team/index.njk',
    buildViewModel(
      request,
      returnTo,
      values,
      undefined,
      undefined,
      psoTeamsByEaArea
    )
  )
}

export const accountRequestMainPsoTeamController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
