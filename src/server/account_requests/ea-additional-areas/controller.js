function buildViewModel(request, values = {}, returnTo) {
  return {
    title: request.i18n.__('accountRequest.eaAdditionalAreas.heading'),
    values,
    returnTo
  }
}

export const accountRequestEaAdditionalAreasController = {
  handler(request, h) {
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
    const returnTo =
      request.query.from === 'check-answers' ? 'check-answers' : undefined

    return h.view(
      'account_requests/ea-additional-areas/index.njk',
      buildViewModel(request, values, returnTo)
    )
  }
}
