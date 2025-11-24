function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  returnTo
) {
  return {
    title: request.t('account-request.details.heading'),
    values,
    errors,
    errorSummary,
    returnTo
  }
}

function validateDetails(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  const values = {
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    emailAddress: payload.emailAddress ?? '',
    telephoneNumber: payload.telephoneNumber ?? '',
    organisation: payload.organisation ?? '',
    jobTitle: payload.jobTitle ?? '',
    responsibility: payload.responsibility ?? ''
  }

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  if (!values.firstName.trim()) {
    addError(
      'firstName',
      'account-request.details.errors.firstNameRequired',
      '#first-name'
    )
  }
  if (!values.lastName.trim()) {
    addError(
      'lastName',
      'account-request.details.errors.lastNameRequired',
      '#last-name'
    )
  }
  if (!values.emailAddress.trim()) {
    addError(
      'emailAddress',
      'account-request.details.errors.emailAddressRequired',
      '#email-address'
    )
  } else {
    // Basic email format validation: something@something.domain
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(values.emailAddress)) {
      addError(
        'emailAddress',
        'account-request.details.errors.emailAddressInvalid',
        '#email-address'
      )
    }
  }
  if (!values.telephoneNumber.trim()) {
    addError(
      'telephoneNumber',
      'account-request.details.errors.telephoneNumberRequired',
      '#telephone-number'
    )
  }
  if (!values.organisation.trim()) {
    addError(
      'organisation',
      'account-request.details.errors.organisationRequired',
      '#organisation'
    )
  }
  if (!values.jobTitle.trim()) {
    addError(
      'jobTitle',
      'account-request.details.errors.jobTitleRequired',
      '#job-title'
    )
  }
  if (!values.responsibility) {
    addError(
      'responsibility',
      'account-request.details.errors.responsibilityRequired',
      '#responsibility-1'
    )
  }

  return { values, errors, errorSummary }
}

export const accountRequestDetailsController = {
  handler(request, h) {
    if (request.method === 'post') {
      const { values, errors, errorSummary } = validateDetails(request)
      const returnTo = request.payload?.returnTo

      if (errorSummary.length) {
        return h
          .view(
            'account_requests/details/index.njk',
            buildViewModel(request, values, errors, errorSummary, returnTo)
          )
          .code(400)
      }

      // Merge into accountRequest session object
      const sessionData = request.yar.get('accountRequest') ?? {}
      sessionData.details = values
      request.yar.set('accountRequest', sessionData)

      // All values valid – log them for now
      console.log('Account request details submitted:', values)

      // For now, redirect back to account_request page
      return h.redirect('/account_request')
    }

    // GET – pre-populate from session if available
    const sessionData = request.yar.get('accountRequest') ?? {}
    const values = sessionData.details ?? {}

    return h.view(
      'account_requests/details/index.njk',
      buildViewModel(request, values, undefined, undefined, undefined)
    )
  }
}
