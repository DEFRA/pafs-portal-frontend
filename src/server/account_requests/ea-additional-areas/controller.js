import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import {
  filterAreasByType,
  filterAreasExcludingIds
} from '../../common/helpers/area-filters.js'

const CHECK_ANSWERS_URL = '/account_request/check-answers'
const CHECK_ANSWERS_RETURN_TO = 'check-answers'

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

async function handlePost(request, h) {
  const payload = request.payload ?? {}
  let additionalEaAreas = payload.additionalEaAreas ?? []

  if (!Array.isArray(additionalEaAreas)) {
    additionalEaAreas = additionalEaAreas ? [additionalEaAreas] : []
  }

  const values = { additionalEaAreas }
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.eaAdditionalAreas = values
  request.yar.set('accountRequest', sessionData)

  return h.redirect(CHECK_ANSWERS_URL)
}

async function loadAdditionalEaAreas(request, mainEaAreaId) {
  const areas = await getCachedAreas(request.server, getAreas)
  if (!areas) {
    request.server.logger.warn('Failed to load EA areas for additional areas')
    return []
  }

  const allEaAreas = filterAreasByType(areas, 'EA Area')
  // Exclude the main selected EA area
  const additionalEaAreas = mainEaAreaId
    ? filterAreasExcludingIds(allEaAreas, [mainEaAreaId])
    : allEaAreas

  request.server.logger.info(
    { additionalEaAreasCount: additionalEaAreas.length, mainEaAreaId },
    'Additional EA areas loaded'
  )

  return additionalEaAreas
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  const values = sessionData.eaAdditionalAreas ?? {}
  // Check for returnTo in query string (from ea-main-area redirect) or from query param
  const returnTo =
    request.query.returnTo === CHECK_ANSWERS_RETURN_TO ||
    request.query.from === CHECK_ANSWERS_RETURN_TO
      ? CHECK_ANSWERS_RETURN_TO
      : undefined

  // Get main EA area from session to exclude it from additional areas
  const mainEaAreaId = sessionData.eaMainArea?.mainEaArea

  // Load EA areas from cache and filter out the main selected area
  let additionalEaAreas = []
  try {
    additionalEaAreas = await loadAdditionalEaAreas(request, mainEaAreaId)
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

export const accountRequestEaAdditionalAreasController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
