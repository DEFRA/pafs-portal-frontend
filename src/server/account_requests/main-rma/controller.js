import { statusCodes } from '../../common/constants/status-codes.js'
import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasByParentIds,
  getAreaById
} from '../../common/helpers/area-filters.js'

const CHECK_ANSWERS_RETURN_TO = 'check-answers'
const CHECK_ANSWERS_URL = '/account_request/check-answers'
const ADDITIONAL_RMAS_URL = '/account_request/additional-rmas'

function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  returnTo,
  rmasByPsoTeam = []
) {
  return {
    title: request.t('account-request.mainRma.heading'),
    values,
    errors,
    errorSummary,
    returnTo,
    rmasByPsoTeam
  }
}

/**
 * Group RMAs by their parent PSO team and EA area
 * @param {Array} rmas - Array of RMA objects
 * @param {Array} allAreas - Array of all areas (to get PSO team and EA area names)
 * @param {Array} selectedPsoTeamIds - Array of selected PSO team IDs
 * @returns {Array} Array of objects with eaArea, psoTeam, and rmas properties
 */
function groupRmasByPsoTeam(rmas, allAreas, selectedPsoTeamIds) {
  const grouped = []

  // For each selected PSO team, get its RMAs and parent EA area
  for (const psoTeamId of selectedPsoTeamIds) {
    const psoTeam = getAreaById(allAreas, psoTeamId)
    if (psoTeam) {
      // Get the EA area that is the parent of this PSO team
      const eaArea = getAreaById(allAreas, psoTeam.parent_id)

      // Get RMAs that have this PSO team as parent
      const teamRmas = rmas.filter((rma) => {
        const rmaParentId =
          typeof rma.parent_id === 'string'
            ? parseInt(rma.parent_id, 10)
            : rma.parent_id
        const psoTeamIdNum =
          typeof psoTeamId === 'string' ? parseInt(psoTeamId, 10) : psoTeamId
        return rmaParentId === psoTeamIdNum
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

function validateMainRma(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  const values = {
    mainRma: payload.mainRma ?? ''
  }

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  if (!values.mainRma) {
    addError(
      'mainRma',
      'account-request.mainRma.errors.mainRmaRequired',
      '#main-rma'
    )
  }

  return { values, errors, errorSummary }
}

async function loadRmasForErrorDisplay(request) {
  try {
    const sessionData = request.yar.get('accountRequest') ?? {}
    const selectedPsoTeamIds = sessionData.psoTeam?.psoTeams ?? []
    const areas = await getCachedAreas(request.server, getAreas)
    if (areas && selectedPsoTeamIds.length > 0) {
      const allRmaAreas = filterAreasByType(areas, 'RMA')
      const rmas = filterAreasByParentIds(allRmaAreas, selectedPsoTeamIds)
      return groupRmasByPsoTeam(rmas, areas, selectedPsoTeamIds)
    }
  } catch (error) {
    request.server.logger.error(
      { error: error.message },
      'Error loading RMAs for error display'
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
  const rmasByPsoTeam = await loadRmasForErrorDisplay(request)

  return h
    .view(
      'account_requests/main-rma/index.njk',
      buildViewModel(
        request,
        values,
        errors,
        errorSummary,
        returnTo,
        rmasByPsoTeam
      )
    )
    .code(statusCodes.badRequest)
}

async function handlePostSuccess(request, h, values, returnTo) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.mainRma = values
  request.yar.set('accountRequest', sessionData)

  const nextUrl =
    returnTo === CHECK_ANSWERS_RETURN_TO
      ? CHECK_ANSWERS_URL
      : ADDITIONAL_RMAS_URL

  return h.redirect(nextUrl)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary } = validateMainRma(request)
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
  return request.query.from === CHECK_ANSWERS_RETURN_TO
    ? CHECK_ANSWERS_RETURN_TO
    : undefined
}

async function loadRmasByPsoTeam(request, selectedPsoTeamIds) {
  const areas = await getCachedAreas(request.server, getAreas)
  if (!areas || selectedPsoTeamIds.length === 0) {
    request.server.logger.warn(
      {
        selectedPsoTeamIds,
        selectedPsoTeamCount: selectedPsoTeamIds.length
      },
      'Failed to load RMAs - missing PSO team selection'
    )
    return []
  }

  const allRmaAreas = filterAreasByType(areas, 'RMA')
  const rmas = filterAreasByParentIds(allRmaAreas, selectedPsoTeamIds)
  const rmasByPsoTeam = groupRmasByPsoTeam(rmas, areas, selectedPsoTeamIds)

  request.server.logger.info(
    {
      rmasCount: rmas.length,
      groupedCount: rmasByPsoTeam.length,
      selectedPsoTeamIds,
      selectedPsoTeamCount: selectedPsoTeamIds.length
    },
    'RMAs loaded and grouped by PSO team for main RMA selection'
  )

  return rmasByPsoTeam
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  const values = sessionData.mainRma ?? {}
  const returnTo = getReturnToFromQuery(request)

  // Get selected PSO teams from session (array from checkbox selection)
  const selectedPsoTeamIds = sessionData.psoTeam?.psoTeams ?? []

  // Load RMAs filtered by all selected PSO teams and group by PSO team
  let rmasByPsoTeam = []
  try {
    rmasByPsoTeam = await loadRmasByPsoTeam(request, selectedPsoTeamIds)
  } catch (error) {
    request.server.logger.error(
      { error: error.message, stack: error.stack },
      'Error loading RMAs'
    )
  }

  return h.view(
    'account_requests/main-rma/index.njk',
    buildViewModel(
      request,
      values,
      undefined,
      undefined,
      returnTo,
      rmasByPsoTeam
    )
  )
}

export const accountRequestMainRmaController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
