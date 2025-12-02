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
  values = {},
  errors = {},
  errorSummary = [],
  returnTo,
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
    if (eaArea && eaArea.id !== undefined && eaArea.name !== undefined) {
      const teams = psoTeams.filter((team) => {
        if (!team || team.parent_id === undefined || team.parent_id === null) {
          return false
        }
        const teamParentId =
          typeof team.parent_id === 'string'
            ? parseInt(team.parent_id, 10)
            : team.parent_id
        const eaAreaIdNum =
          typeof eaAreaId === 'string' ? parseInt(eaAreaId, 10) : eaAreaId
        return (
          !isNaN(teamParentId) &&
          !isNaN(eaAreaIdNum) &&
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

export const accountRequestPsoTeamController = {
  async handler(request, h) {
    try {
      if (request.method === 'post') {
        const { values, errors, errorSummary } = validatePsoTeam(request)
        const returnTo = request.payload?.returnTo

        if (errorSummary.length) {
          // Load PSO teams for error display
          let psoTeamsByEaArea = []
          try {
            const sessionData = request.yar.get('accountRequest') ?? {}
            const selectedEaAreaIds = sessionData.eaArea?.eaAreas ?? []

            // Ensure selectedEaAreaIds is an array
            const validEaAreaIds = Array.isArray(selectedEaAreaIds)
              ? selectedEaAreaIds
              : []

            if (validEaAreaIds.length > 0) {
              const areas = await getCachedAreas(request.server, getAreas)
              if (areas && Array.isArray(areas) && areas.length > 0) {
                const allPsoAreas = filterAreasByType(areas, 'PSO Area')
                const psoTeams = filterAreasByParentIds(
                  allPsoAreas,
                  validEaAreaIds
                )

                if (Array.isArray(psoTeams) && Array.isArray(areas)) {
                  psoTeamsByEaArea = groupPsoTeamsByEaArea(
                    psoTeams,
                    areas,
                    validEaAreaIds
                  )
                }
              }
            }
          } catch (error) {
            request.server.logger.error(
              {
                error: error.message,
                stack: error.stack
              },
              'Error loading PSO teams for error display'
            )
            // Continue with empty array
            psoTeamsByEaArea = []
          }

          // Ensure psoTeamsByEaArea is always an array
          const safePsoTeamsByEaArea = Array.isArray(psoTeamsByEaArea)
            ? psoTeamsByEaArea
            : []

          return h
            .view(
              'account_requests/pso-team/index.njk',
              buildViewModel(
                request,
                values,
                errors,
                errorSummary,
                returnTo,
                safePsoTeamsByEaArea
              )
            )
            .code(statusCodes.badRequest)
        }

        const sessionData = request.yar.get('accountRequest') ?? {}
        sessionData.psoTeam = values
        request.yar.set('accountRequest', sessionData)

        const nextUrl =
          returnTo === 'check-answers'
            ? '/account_request/check-answers'
            : '/account_request/main-rma'

        return h.redirect(nextUrl)
      }

      // GET handler
      const sessionData = request.yar.get('accountRequest') ?? {}
      const values = sessionData.psoTeam ?? {}
      const returnTo =
        request.query.from === 'check-answers' ? 'check-answers' : undefined

      // Get selected EA areas from session (array from checkbox selection)
      const selectedEaAreaIds = sessionData.eaArea?.eaAreas ?? []

      // Validate that we have EA areas selected - if not, redirect back to ea-area page
      if (!Array.isArray(selectedEaAreaIds) || selectedEaAreaIds.length === 0) {
        request.server.logger.warn(
          {
            sessionDataKeys: Object.keys(sessionData),
            eaAreaData: sessionData.eaArea,
            responsibility: sessionData.details?.responsibility
          },
          'No EA areas selected, redirecting back to ea-area page'
        )
        return h.redirect('/account_request/ea-area')
      }

      // Load PSO teams filtered by all selected EA areas and group by EA area
      let psoTeamsByEaArea = []
      try {
        // Ensure selectedEaAreaIds is an array
        const validEaAreaIds = Array.isArray(selectedEaAreaIds)
          ? selectedEaAreaIds
          : []

        if (validEaAreaIds.length === 0) {
          request.server.logger.warn(
            {
              selectedEaAreaIds,
              selectedEaAreaCount: validEaAreaIds.length,
              sessionDataKeys: Object.keys(sessionData),
              eaAreaData: sessionData.eaArea
            },
            'Failed to load PSO teams - missing EA area selection'
          )
        } else {
          const areas = await getCachedAreas(request.server, getAreas)
          if (
            areas &&
            Array.isArray(areas) &&
            areas.length > 0 &&
            validEaAreaIds.length > 0
          ) {
            try {
              const allPsoAreas = filterAreasByType(areas, 'PSO Area')
              const psoTeams = filterAreasByParentIds(
                allPsoAreas,
                validEaAreaIds
              )

              // Only group if we have valid data
              if (Array.isArray(psoTeams) && Array.isArray(areas)) {
                psoTeamsByEaArea = groupPsoTeamsByEaArea(
                  psoTeams,
                  areas,
                  validEaAreaIds
                )
              }

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
              // Continue with empty array
              psoTeamsByEaArea = []
            }
          } else {
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
        }
      } catch (error) {
        request.server.logger.error(
          {
            error: error.message,
            stack: error.stack,
            selectedEaAreaIds,
            selectedEaAreaIdsType: typeof selectedEaAreaIds,
            selectedEaAreaIdsIsArray: Array.isArray(selectedEaAreaIds)
          },
          'Error loading PSO teams'
        )
        // Continue with empty array to allow page to render
        psoTeamsByEaArea = []
      }

      // Ensure psoTeamsByEaArea is always an array
      const safePsoTeamsByEaArea = Array.isArray(psoTeamsByEaArea)
        ? psoTeamsByEaArea
        : []

      return h.view(
        'account_requests/pso-team/index.njk',
        buildViewModel(
          request,
          values,
          undefined,
          undefined,
          returnTo,
          safePsoTeamsByEaArea
        )
      )
    } catch (error) {
      request.server.logger.error(
        {
          error: error.message,
          stack: error.stack,
          method: request.method,
          url: request.url.pathname,
          sessionData: request.yar.get('accountRequest')
        },
        'Unhandled error in pso-team controller'
      )
      // Re-throw to let Hapi's error handler deal with it
      throw error
    }
  }
}
