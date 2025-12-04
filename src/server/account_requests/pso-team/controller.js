import { statusCodes } from '../../common/constants/status-codes.js'
import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasByParentIds,
  getAreaById
} from '../../common/helpers/area-filters.js'

function buildViewModel(
  request,
  returnTo = undefined,
  values = {},
  errors = {},
  errorSummary = [],
  psoTeamsByEaArea = []
) {
  return {
    title: request.t('account-request.psoTeam.heading'),
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

  // Validate inputs
  if (
    !Array.isArray(psoTeams) ||
    !Array.isArray(allAreas) ||
    !Array.isArray(selectedEaAreaIds)
  ) {
    return []
  }

  // For each selected EA area, get its PSO teams
  for (const eaAreaId of selectedEaAreaIds) {
    if (eaAreaId === undefined || eaAreaId === null) {
      continue
    }

    const eaArea = getAreaById(allAreas, eaAreaId)
    if (eaArea?.id !== undefined && eaArea?.name !== undefined) {
      const teams = psoTeams.filter((team) => {
        // Corrected check: Assigns team?.parent_id (undefined if team is null/undefined)
        // or the parent_id value itself.
        const parentId = team?.parent_id
        if (parentId == null) {
          // Checks if parentId is null OR undefined
          return false
        }
        const teamParentId =
          typeof team.parent_id === 'string'
            ? Number.parseInt(team.parent_id, 10)
            : team.parent_id
        const eaAreaIdNum =
          typeof eaAreaId === 'string'
            ? Number.parseInt(eaAreaId, 10)
            : eaAreaId
        return (
          !Number.isNaN(teamParentId) &&
          !Number.isNaN(eaAreaIdNum) &&
          teamParentId === eaAreaIdNum
        )
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

function validatePsoTeam(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  let psoTeams = payload.psoTeams ?? []

  // Handle single checkbox value (not array)
  if (!Array.isArray(psoTeams)) {
    psoTeams = psoTeams ? [psoTeams] : []
  }

  const values = {
    psoTeams
  }

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  if (!psoTeams || psoTeams.length === 0) {
    addError(
      'psoTeams',
      'account-request.psoTeam.errors.psoTeamRequired',
      '#pso-teams'
    )
  }

  return { values, errors, errorSummary }
}
const CHECK_ANSWERS_RETURN_TO = 'check-answers'
const CHECK_ANSWERS_URL = '/account_request/check-answers'
const MAIN_RMA_URL = '/account_request/main-rma'
const EA_AREA_URL = '/account_request/ea-area'
const PSO_TEAM_VIEW = 'account_requests/pso-team/index.njk'

async function loadPsoTeamsForErrorDisplay(request) {
  const errorDisplaySessionData = request.yar.get('accountRequest') ?? {}
  const errorDisplaySelectedEaAreaIds =
    errorDisplaySessionData.eaArea?.eaAreas ?? []
  const validEaAreaIds = Array.isArray(errorDisplaySelectedEaAreaIds)
    ? errorDisplaySelectedEaAreaIds
    : []

  if (validEaAreaIds.length === 0) {
    return []
  }

  try {
    const areas = await getCachedAreas(request.server, getAreas)
    if (!areas || !Array.isArray(areas) || areas.length === 0) {
      return []
    }

    const allPsoAreas = filterAreasByType(areas, 'PSO Area')
    const psoTeams = filterAreasByParentIds(allPsoAreas, validEaAreaIds)

    if (!Array.isArray(psoTeams) || !Array.isArray(areas)) {
      return []
    }

    return groupPsoTeamsByEaArea(psoTeams, areas, validEaAreaIds)
  } catch (error) {
    request.server.logger.error(
      {
        error: error.message,
        stack: error.stack
      },
      'Error loading PSO teams for error display'
    )
    return []
  }
}

async function handlePostWithErrors(
  request,
  h,
  postValues,
  postErrors,
  postErrorSummary,
  postReturnTo
) {
  const psoTeamsByEaArea = await loadPsoTeamsForErrorDisplay(request)
  const postSafePsoTeamsByEaArea = Array.isArray(psoTeamsByEaArea)
    ? psoTeamsByEaArea
    : []

  return h
    .view(
      PSO_TEAM_VIEW,
      buildViewModel(
        request,
        postReturnTo,
        postValues,
        postErrors,
        postErrorSummary,
        postSafePsoTeamsByEaArea
      )
    )
    .code(statusCodes.badRequest)
}

function getNextUrl(postReturnTo) {
  if (postReturnTo === CHECK_ANSWERS_RETURN_TO) {
    return CHECK_ANSWERS_URL
  }
  return MAIN_RMA_URL
}

function handlePostSuccess(request, h, postValues, postReturnTo) {
  const postSessionData = request.yar.get('accountRequest') ?? {}
  postSessionData.psoTeam = postValues
  request.yar.set('accountRequest', postSessionData)

  const nextUrl = getNextUrl(postReturnTo)
  return h.redirect(nextUrl)
}

function getReturnToFromQuery(request) {
  return request.query.from === CHECK_ANSWERS_RETURN_TO
    ? CHECK_ANSWERS_RETURN_TO
    : undefined
}

function validateEaAreaSelection(
  request,
  getSelectedEaAreaIds,
  getSessionData
) {
  if (
    !Array.isArray(getSelectedEaAreaIds) ||
    getSelectedEaAreaIds.length === 0
  ) {
    request.server.logger.warn(
      {
        sessionDataKeys: Object.keys(getSessionData),
        eaAreaData: getSessionData.eaArea,
        responsibility: getSessionData.details?.responsibility
      },
      'No EA areas selected, redirecting back to ea-area page'
    )
    return false
  }
  return true
}

function ensureArray(value) {
  return Array.isArray(value) ? value : []
}

function isValidAreasData(areas, validEaAreaIds) {
  return (
    areas &&
    Array.isArray(areas) &&
    areas.length > 0 &&
    validEaAreaIds.length > 0
  )
}

function logInvalidAreasWarning(request, areas, validEaAreaIds) {
  request.server.logger.warn(
    {
      areasType: typeof areas,
      areasIsArray: Array.isArray(areas),
      areasLength: Array.isArray(areas) ? areas.length : 'N/A',
      selectedEaAreaIds: validEaAreaIds,
      selectedEaAreaCount: validEaAreaIds.length
    },
    'Failed to load PSO teams - invalid areas data or missing EA area selection'
  )
}

async function processPsoTeams(request, areas, validEaAreaIds) {
  try {
    const allPsoAreas = filterAreasByType(areas, 'PSO Area')
    const psoTeams = filterAreasByParentIds(allPsoAreas, validEaAreaIds)

    if (!Array.isArray(psoTeams) || !Array.isArray(areas)) {
      return []
    }

    const psoTeamsByEaArea = groupPsoTeamsByEaArea(
      psoTeams,
      areas,
      validEaAreaIds
    )

    request.server.logger.info(
      {
        psoTeamsCount: psoTeams.length,
        groupedCount: psoTeamsByEaArea.length,
        selectedEaAreaIds: validEaAreaIds,
        selectedEaAreaCount: validEaAreaIds.length,
        allPsoAreasCount: allPsoAreas.length
      },
      'PSO teams loaded and grouped by EA area for team selection'
    )

    return psoTeamsByEaArea
  } catch (groupingError) {
    request.server.logger.error(
      {
        error: groupingError.message,
        stack: groupingError.stack,
        validEaAreaIds,
        areasCount: areas.length
      },
      'Error grouping PSO teams by EA area'
    )
    return []
  }
}

async function loadAndGroupPsoTeams(request, validEaAreaIds) {
  if (validEaAreaIds.length === 0) {
    request.server.logger.warn(
      {
        selectedEaAreaIds: validEaAreaIds,
        selectedEaAreaCount: validEaAreaIds.length
      },
      'Failed to load PSO teams - missing EA area selection'
    )
    return []
  }

  try {
    const areas = await getCachedAreas(request.server, getAreas)
    if (!isValidAreasData(areas, validEaAreaIds)) {
      logInvalidAreasWarning(request, areas, validEaAreaIds)
      return []
    }

    return await processPsoTeams(request, areas, validEaAreaIds)
  } catch (error) {
    request.server.logger.error(
      {
        error: error.message,
        stack: error.stack,
        selectedEaAreaIds: validEaAreaIds
      },
      'Error loading PSO teams'
    )
    return []
  }
}

async function handleGet(request, h) {
  const getSessionData = request.yar.get('accountRequest') ?? {}
  const getValues = getSessionData.psoTeam ?? {}
  const getReturnTo = getReturnToFromQuery(request)
  const getSelectedEaAreaIds = getSessionData.eaArea?.eaAreas ?? []

  if (!validateEaAreaSelection(request, getSelectedEaAreaIds, getSessionData)) {
    return h.redirect(EA_AREA_URL)
  }

  const validEaAreaIds = ensureArray(getSelectedEaAreaIds)
  const getPsoTeamsByEaArea = await loadAndGroupPsoTeams(
    request,
    validEaAreaIds
  )
  const safePsoTeamsByEaArea = ensureArray(getPsoTeamsByEaArea)

  return h.view(
    PSO_TEAM_VIEW,
    buildViewModel(
      request,
      getReturnTo,
      getValues,
      undefined,
      undefined,
      safePsoTeamsByEaArea
    )
  )
}

export const accountRequestPsoTeamController = {
  async handler(request, h) {
    try {
      if (request.method === 'post') {
        const { values, errors, errorSummary } = validatePsoTeam(request)
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

      return handleGet(request, h)
    } catch (error) {
      request.server.logger.error(
        {
          error: error.message,
          stack: error.stack,
          method: request.method,
          url: request.url.pathname,
          sessionData: request?.yar?.get('accountRequest')
        },
        'Unhandled error in pso-team controller'
      )
      throw error
    }
  }
}
