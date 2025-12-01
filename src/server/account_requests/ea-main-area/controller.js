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
    title: request.t('account-request.eaMainArea.heading'),
    values,
    errors,
    errorSummary,
    returnTo,
    eaAreas
  }
}

function validateEaMainArea(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  const values = {
    mainEaArea: payload.mainEaArea ?? ''
  }

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  if (!values.mainEaArea) {
    addError(
      'mainEaArea',
      'account-request.eaMainArea.errors.mainEaAreaRequired',
      '#main-ea-area'
    )
  }

  return { values, errors, errorSummary }
}

export const accountRequestEaMainAreaController = {
  async handler(request, h) {
    if (request.method === 'post') {
      const { values, errors, errorSummary } = validateEaMainArea(request)
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
            'account_requests/ea-main-area/index.njk',
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
      sessionData.eaMainArea = values
      request.yar.set('accountRequest', sessionData)

      // Always go to additional areas page, but pass returnTo if coming from check-answers
      const nextUrl =
        returnTo === 'check-answers'
          ? '/account_request/ea-additional-areas?returnTo=check-answers'
          : '/account_request/ea-additional-areas'

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
    const values = updatedSessionData.eaMainArea ?? {}
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
          'EA areas filtered for main area selection'
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
      'account_requests/ea-main-area/index.njk',
      buildViewModel(request, values, undefined, undefined, returnTo, eaAreas)
    )
  }
}
