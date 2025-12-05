import { statusCodes } from '../../common/constants/status-codes.js'
import { getAreas } from '../../common/services/areas/area-service.js'
import { getCachedAreas } from '../../common/services/areas/areas-cache.js'
import { filterAreasByType } from '../../common/helpers/area-filters.js'

const CHECK_ANSWERS_RETURN_TO = 'check-answers'
const CHECK_ANSWERS_URL = '/account_request/check-answers'
const MAIN_PSO_TEAM_URL = '/account_request/main-pso-team'
const PSO_TEAM_URL = '/account_request/pso-team'
const ACCOUNT_REQUEST_URL = '/account_request'
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

function getNextUrl(sessionData, returnTo) {
  const responsibility = sessionData.details?.responsibility
  const hasReturnTo = returnTo === CHECK_ANSWERS_RETURN_TO

  // Determine next step based on responsibility
  // When returnTo is 'check-answers', we still need to go through the full flow
  // The returnTo will be passed along and handled at the final step
  switch (responsibility) {
    case 'PSO':
      // For PSO: EA areas → main-pso-team → additional-pso-teams → check-answers
      return hasReturnTo
        ? `${MAIN_PSO_TEAM_URL}?returnTo=${CHECK_ANSWERS_RETURN_TO}`
        : MAIN_PSO_TEAM_URL
    case 'RMA':
      // For RMA: EA areas → pso-team → main-rma → additional-rmas → check-answers
      return hasReturnTo
        ? `${PSO_TEAM_URL}?returnTo=${CHECK_ANSWERS_RETURN_TO}`
        : PSO_TEAM_URL
    default:
      // For EA or unknown, if returnTo is check-answers, go there directly
      // Otherwise continue flow
      return hasReturnTo ? CHECK_ANSWERS_URL : ACCOUNT_REQUEST_URL
  }
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
      'account_requests/ea-area/index.njk',
      buildViewModel(request, returnTo, values, errors, errorSummary, eaAreas)
    )
    .code(statusCodes.badRequest)
}

async function handlePostSuccess(request, h, values, returnTo) {
  const sessionData = request.yar.get('accountRequest') ?? {}
  sessionData.eaArea = values
  request.yar.set('accountRequest', sessionData)

  request.server.logger.info(
    {
      responsibility: sessionData.details?.responsibility,
      eaAreas: values.eaAreas,
      eaAreasCount: Array.isArray(values.eaAreas) ? values.eaAreas.length : 0,
      returnTo,
      sessionKeys: Object.keys(sessionData)
    },
    'EA areas saved to session, redirecting to next page'
  )

  const nextUrl = getNextUrl(sessionData, returnTo)

  request.server.logger.info(
    { nextUrl, responsibility: sessionData.details?.responsibility },
    'Redirecting to next page in RMA/PSO flow'
  )

  return h.redirect(nextUrl)
}

async function handlePost(request, h) {
  const { values, errors, errorSummary } = validateEaArea(request)
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
  return request.query.returnTo === CHECK_ANSWERS_RETURN_TO ||
    request.query.from === CHECK_ANSWERS_RETURN_TO
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
      'EA areas filtered for area selection'
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
  const values = updatedSessionData.eaArea ?? {}
  const returnTo = getReturnToFromQuery(request)

  const eaAreas = await loadEaAreas(request)

  return h.view(
    'account_requests/ea-area/index.njk',
    buildViewModel(request, returnTo, values, undefined, undefined, eaAreas)
  )
}

export const accountRequestEaAreaController = {
  async handler(request, h) {
    if (request.method === 'post') {
      return handlePost(request, h)
    }
    return handleGet(request, h)
  }
}
