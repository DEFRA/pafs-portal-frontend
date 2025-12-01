import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasExcludingIds
} from '../../common/helpers/area-filters.js'

function buildViewModel(
  request,
  values = {},
  returnTo,
  additionalEaAreas = []
) {
  return {
    title: request.t('account-request.eaAdditionalAreas.heading'),
    values,
    returnTo,
    additionalEaAreas
  }
}

export const accountRequestEaAdditionalAreasController = {
  async handler(request, h) {
    if (request.method === 'post') {
      const payload = request.payload ?? {}
      let additionalEaAreas = payload.additionalEaAreas ?? []

      if (!Array.isArray(additionalEaAreas)) {
        additionalEaAreas = additionalEaAreas ? [additionalEaAreas] : []
      }

      const values = { additionalEaAreas }
      const returnTo = payload.returnTo

      const sessionData = request.yar.get('accountRequest') ?? {}
      sessionData.eaAdditionalAreas = values
      request.yar.set('accountRequest', sessionData)

      const nextUrl =
        returnTo === 'check-answers'
          ? '/account_request/check-answers'
          : '/account_request/check-answers'

      return h.redirect(nextUrl)
    }

    const sessionData = request.yar.get('accountRequest') ?? {}
    const values = sessionData.eaAdditionalAreas ?? {}
    // Check for returnTo in query string (from ea-main-area redirect) or from query param
    const returnTo =
      request.query.returnTo === 'check-answers' ||
      request.query.from === 'check-answers'
        ? 'check-answers'
        : undefined

    // Get main EA area from session to exclude it from additional areas
    const mainEaAreaId = sessionData.eaMainArea?.mainEaArea

    // Load EA areas from cache and filter out the main selected area
    let additionalEaAreas = []
    try {
      const areas = await getCachedAreas(request.server, getAreas)
      if (areas) {
        const allEaAreas = filterAreasByType(areas, 'EA Area')
        // Exclude the main selected EA area
        if (mainEaAreaId) {
          additionalEaAreas = filterAreasExcludingIds(allEaAreas, [
            mainEaAreaId
          ])
        } else {
          additionalEaAreas = allEaAreas
        }
        request.server.logger.info(
          { additionalEaAreasCount: additionalEaAreas.length, mainEaAreaId },
          'Additional EA areas loaded'
        )
      } else {
        request.server.logger.warn(
          'Failed to load EA areas for additional areas'
        )
      }
    } catch (error) {
      request.server.logger.error(
        { error: error.message },
        'Error loading additional EA areas'
      )
    }

    return h.view(
      'account_requests/ea-additional-areas/index.njk',
      buildViewModel(request, values, returnTo, additionalEaAreas)
    )
  }
}
