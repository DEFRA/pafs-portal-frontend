import { statusCodes } from '../../common/constants/status-codes.js'
import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import { filterAreasByType } from '../../common/helpers/area-filters.js'

const CHECK_ANSWERS_RETURN_TO = 'check-answers'
const EA_ADDITIONAL_AREAS_URL = '/account_request/ea-additional-areas'
const SAMPLE_SIZE = 3

function buildViewModel(
  request,
  returnTo,
  values = {},
  errors = {},
  errorSummary = [],
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

async function loadEaAreasForErrorDisplay(request) {
  try {
    const areas = await getCachedAreas(request.server, getAreas)
    if (areas) {
      return filterAreasByType(areas, 'EA Area')
    }
  } catch (error) {
    request.server.logger.error(
      { error: error.message },
      'Error loading EA areas for error display'
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
  const eaAreas = await loadEaAreasForErrorDisplay(request)

  return h
    .view(
      'account_requests/ea-main-area/index.njk',
      buildViewModel(request, returnTo, values, errors, errorSummary, eaAreas)
    )
    .code(statusCodes.badRequest)
}

async function handlePostSuccess(request, h, values, returnTo) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.eaMainArea = values
  request.yar.set('accountRequest', sessionData)

  // Always go to additional areas page, but pass returnTo if coming from check-answers
  const nextUrl =
    returnTo === CHECK_ANSWERS_RETURN_TO
      ? `${EA_ADDITIONAL_AREAS_URL}?returnTo=${CHECK_ANSWERS_RETURN_TO}`
      : EA_ADDITIONAL_AREAS_URL

  return h.redirect(nextUrl)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary } = validateEaMainArea(request)
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

function clearAreaSelectionIfNeeded(request, sessionData) {
  if (request.query.reset === 'areas') {
    // Keep only the details (including responsibility) and clear all area selections
    const details = sessionData.details ?? {}
    request.yar.set('accountRequest', { details })
    request.server.logger.info(
      'Cleared area selection data, keeping only details'
    )
  }
}

function getReturnToFromQuery(request) {
  return request.query.from === CHECK_ANSWERS_RETURN_TO
    ? CHECK_ANSWERS_RETURN_TO
    : undefined
}

async function loadEaAreas(request) {
  try {
    const areas = await getCachedAreas(request.server, getAreas)
    if (!areas) {
      request.server.logger.warn(
        'Failed to load EA areas - areas is null or undefined'
      )
      return []
    }

    request.server.logger.info(
      {
        totalAreasCount: Array.isArray(areas) ? areas.length : 'not an array',
        areasType: typeof areas,
        sampleArea: Array.isArray(areas) && areas.length > 0 ? areas[0] : null
      },
      'Areas retrieved from cache'
    )

    const eaAreas = filterAreasByType(areas, 'EA Area')

    request.server.logger.info(
      {
        eaAreasCount: eaAreas.length,
        eaAreasSample: eaAreas.length > 0 ? eaAreas.slice(0, SAMPLE_SIZE) : []
      },
      'EA areas filtered for main area selection'
    )

    return eaAreas
  } catch (error) {
    request.server.logger.error(
      { error: error.message, stack: error.stack },
      'Error loading EA areas'
    )
    return []
  }
}

async function handleGet(request, h) {
  const sessionData = request.yar.get('accountRequest') ?? {}

  clearAreaSelectionIfNeeded(request, sessionData)

  const updatedSessionData = request.yar.get('accountRequest') ?? {}
  const values = updatedSessionData.eaMainArea ?? {}
  const returnTo = getReturnToFromQuery(request)

  const eaAreas = await loadEaAreas(request)

  return h.view(
    'account_requests/ea-main-area/index.njk',
    buildViewModel(request, returnTo, values, undefined, undefined, eaAreas)
  )
}

export const accountRequestEaMainAreaController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
