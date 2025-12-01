import { statusCodes } from '../../common/constants/status-codes.js'
import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import { filterAreasByType } from '../../common/helpers/area-filters.js'

function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  returnTo,
  eaAreas = []
) {
  return {
    title: request.t('account-request.eaArea.heading'),
    values,
    errors,
    errorSummary,
    returnTo,
    eaAreas
  }
}

function validateEaArea(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  let eaAreas = payload.eaAreas ?? []

  // Handle single value or array
  if (!Array.isArray(eaAreas)) {
    eaAreas = eaAreas ? [eaAreas] : []
  }

  const values = {
    eaAreas
  }

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  if (eaAreas.length === 0) {
    addError(
      'eaAreas',
      'account-request.eaArea.errors.eaAreaRequired',
      '#ea-areas-1'
    )
  }

  return { values, errors, errorSummary }
}

function getNextUrl(sessionData) {
  const returnTo = sessionData.details?.returnTo
  const responsibility = sessionData.details?.responsibility

  if (returnTo === 'check-answers') {
    return '/account_request/check-answers'
  }

  // Determine next step based on responsibility
  switch (responsibility) {
    case 'PSO':
      return '/account_request/main-pso-team'
    case 'RMA':
      return '/account_request/pso-team'
    default:
      return '/account_request'
  }
}

export const accountRequestEaAreaController = {
  async handler(request, h) {
    if (request.method === 'post') {
      const { values, errors, errorSummary } = validateEaArea(request)
      const returnTo = request.payload?.returnTo

      if (errorSummary.length) {
        // Load EA areas for error display
        let eaAreas = []
        try {
          const areas = await getCachedAreas(request.server, getAreas)
          if (areas) {
            eaAreas = filterAreasByType(areas, 'EA Area')
          }
        } catch (error) {
          request.server.logger.error(
            { error: error.message },
            'Error loading EA areas for error display'
          )
        }

        return h
          .view(
            'account_requests/ea-area/index.njk',
            buildViewModel(
              request,
              values,
              errors,
              errorSummary,
              returnTo,
              eaAreas
            )
          )
          .code(statusCodes.badRequest)
      }

      const sessionData = request.yar.get('accountRequest') ?? {}
      sessionData.eaArea = values
      request.yar.set('accountRequest', sessionData)

      const nextUrl = getNextUrl(sessionData)

      return h.redirect(nextUrl)
    }

    const sessionData = request.yar.get('accountRequest') ?? {}

    // If reset=areas query parameter is present, clear all area selection data
    if (request.query.reset === 'areas') {
      // Keep only the details (including responsibility) and clear all area selections
      const details = sessionData.details ?? {}
      request.yar.set('accountRequest', { details })
      request.server.logger.info(
        'Cleared area selection data, keeping only details'
      )
    }

    const updatedSessionData = request.yar.get('accountRequest') ?? {}
    const values = updatedSessionData.eaArea ?? {}
    const returnTo =
      request.query.from === 'check-answers' ? 'check-answers' : undefined

    // Load EA areas from cache
    let eaAreas = []
    try {
      const areas = await getCachedAreas(request.server, getAreas)
      if (areas) {
        request.server.logger.info(
          {
            totalAreasCount: Array.isArray(areas)
              ? areas.length
              : 'not an array',
            areasType: typeof areas,
            sampleArea:
              Array.isArray(areas) && areas.length > 0 ? areas[0] : null
          },
          'Areas retrieved from cache'
        )
        eaAreas = filterAreasByType(areas, 'EA Area')
        request.server.logger.info(
          {
            eaAreasCount: eaAreas.length,
            eaAreasSample: eaAreas.length > 0 ? eaAreas.slice(0, 3) : []
          },
          'EA areas filtered for area selection'
        )
      } else {
        request.server.logger.warn(
          'Failed to load EA areas - areas is null or undefined'
        )
      }
    } catch (error) {
      request.server.logger.error(
        { error: error.message, stack: error.stack },
        'Error loading EA areas'
      )
    }

    return h.view(
      'account_requests/ea-area/index.njk',
      buildViewModel(request, values, undefined, undefined, returnTo, eaAreas)
    )
  }
}
