function buildViewModel(request, sessionData = {}) {
  const details = sessionData.details ?? {}
  const eaMainArea = sessionData.eaMainArea ?? {}
  const eaAdditionalAreas = sessionData.eaAdditionalAreas ?? {
    additionalEaAreas: []
  }

  // Map responsibility code to label using i18n
  const t = request.i18n.__.bind(request.i18n)
  let responsibilityValue = ''
  switch (details.responsibility) {
    case 'environment-agency-area-programme-team':
      responsibilityValue = t('accountRequest.details.eaAreaProgrammeTeam')
      break
    case 'environment-agency-partnership-strategic-overview-team':
      responsibilityValue = t(
        'accountRequest.details.eaPartnershipStrategicOverviewTeam'
      )
      break
    case 'risk-management-authority':
      responsibilityValue = t('accountRequest.details.riskManagementAuthority')
      break
    default:
      responsibilityValue = ''
  }

  // Map main EA area code to human-readable label
  const mainEaAreaMap = {
    wessex: 'Wessex',
    thames: 'Thames',
    anglian: 'Anglian',
    midlands: 'Midlands',
    'north-west': 'North West',
    yorkshire: 'Yorkshire',
    'north-east': 'North East'
  }

  const mainEaAreaValue = mainEaAreaMap[eaMainArea.mainEaArea] ?? ''

  // Map additional areas array to labels
  const additionalAreasLabels = (eaAdditionalAreas.additionalEaAreas ?? [])
    .map((code) => mainEaAreaMap[code])
    .filter(Boolean)

  return {
    title: t('accountRequest.checkAnswers.heading'),
    details,
    responsibilityValue,
    mainEaAreaValue,
    additionalAreasLabels
  }
}

export const accountRequestCheckAnswersController = {
  handler(request, h) {
    if (request.method === 'post') {
      const sessionData = request.yar.get('accountRequest') ?? {}

      // TODO: Send sessionData to backend API when implemented
      console.log(
        'Submitting account request to backend (placeholder):',
        sessionData
      )

      return h.redirect('/account_request/confirmation')
    }

    const sessionData = request.yar.get('accountRequest') ?? {}
    console.log('sessionData-----', sessionData)
    return h.view(
      'account_requests/check-answers/index.njk',
      buildViewModel(request, sessionData)
    )
  }
}
