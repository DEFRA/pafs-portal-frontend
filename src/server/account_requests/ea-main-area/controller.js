function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  returnTo
) {
  return {
    title: request.t('account-request.eaMainArea.heading'),
    values,
    errors,
    errorSummary,
    returnTo
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
  handler(request, h) {
    if (request.method === 'post') {
      const { values, errors, errorSummary } = validateEaMainArea(request)
      const returnTo = request.payload?.returnTo

      if (errorSummary.length) {
        return h
          .view(
            'account_requests/ea-main-area/index.njk',
            buildViewModel(request, values, errors, errorSummary, returnTo)
          )
          .code(400)
      }

      const sessionData = request.yar.get('accountRequest') ?? {}
      sessionData.eaMainArea = values
      request.yar.set('accountRequest', sessionData)

      const nextUrl =
        returnTo === 'check-answers'
          ? '/account_request/check-answers'
          : '/account_request/ea-additional-areas'

      return h.redirect(nextUrl)
    }

    const sessionData = request.yar.get('accountRequest') ?? {}
    const values = sessionData.eaMainArea ?? {}
    const returnTo =
      request.query.from === 'check-answers' ? 'check-answers' : undefined

    return h.view(
      'account_requests/ea-main-area/index.njk',
      buildViewModel(request, values, undefined, undefined, returnTo)
    )
  }
}
