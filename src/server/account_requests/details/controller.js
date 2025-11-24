import { statusCodes } from '../../common/constants/status-codes.js'

function buildViewModel(
  request,
  values = {},
  errors = {},
  errorSummary = [],
  returnTo = undefined
) {
  return {
    title: request.t('account-request.details.heading'),
    values,
    errors,
    errorSummary,
    returnTo
  }
}

function extractFormValues(payload) {
  return {
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    emailAddress: payload.emailAddress ?? '',
    telephoneNumber: payload.telephoneNumber ?? '',
    organisation: payload.organisation ?? '',
    jobTitle: payload.jobTitle ?? '',
    responsibility: payload.responsibility ?? ''
  }
}

function validateEmailFormat(emailAddress) {
  // Basic email format validation: something@something.domain
  // Using a safer regex pattern to prevent ReDoS (Regular Expression Denial of Service)
  // This pattern avoids catastrophic backtracking by using more restrictive character classes
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailPattern.test(emailAddress)
}

function validateRequiredField(value, fieldName, messageKey, href, addError) {
  if (!value.trim()) {
    addError(fieldName, messageKey, href)
  }
}

function validateEmailField(emailAddress, addError) {
  if (!emailAddress.trim()) {
    addError(
      'emailAddress',
      'account-request.details.errors.emailAddressRequired',
      '#email-address'
    )
  } else if (!validateEmailFormat(emailAddress)) {
    addError(
      'emailAddress',
      'account-request.details.errors.emailAddressInvalid',
      '#email-address'
    )
  } else {
    // Email is valid - no error to add
  }
}

function validateAllFields(values, addError) {
  validateRequiredField(
    values.firstName,
    'firstName',
    'account-request.details.errors.firstNameRequired',
    '#first-name',
    addError
  )
  validateRequiredField(
    values.lastName,
    'lastName',
    'account-request.details.errors.lastNameRequired',
    '#last-name',
    addError
  )
  validateEmailField(values.emailAddress, addError)
  validateRequiredField(
    values.telephoneNumber,
    'telephoneNumber',
    'account-request.details.errors.telephoneNumberRequired',
    '#telephone-number',
    addError
  )
  validateRequiredField(
    values.organisation,
    'organisation',
    'account-request.details.errors.organisationRequired',
    '#organisation',
    addError
  )
  validateRequiredField(
    values.jobTitle,
    'jobTitle',
    'account-request.details.errors.jobTitleRequired',
    '#job-title',
    addError
  )
  if (!values.responsibility) {
    addError(
      'responsibility',
      'account-request.details.errors.responsibilityRequired',
      '#responsibility-1'
    )
  }
}

function validateDetails(request) {
  const t = request.t.bind(request)
  const payload = request.payload ?? {}
  const values = extractFormValues(payload)

  const errors = {}
  const errorSummary = []

  function addError(field, messageKey, href) {
    const text = t(messageKey)
    errors[field] = text
    errorSummary.push({ href, text })
  }

  validateAllFields(values, addError)

  return { values, errors, errorSummary }
}

function getSessionData(request) {
  return request.yar.get('accountRequest') ?? {}
}

function handlePostRequest(request, h) {
  const { values, errors, errorSummary } = validateDetails(request)
  const returnTo = request.payload?.returnTo

  if (errorSummary.length) {
    return h
      .view(
        'account_requests/details/index.njk',
        buildViewModel(request, values, errors, errorSummary, returnTo)
      )
      .code(statusCodes.badRequest)
  }

  // Merge into accountRequest session object
  const sessionData = getSessionData(request)
  sessionData.details = values
  request.yar.set('accountRequest', sessionData)

  // All values valid – log them
  request.server.logger.info(
    { accountRequestDetails: values },
    'Account request details submitted'
  )

  // For now, redirect back to account_request page
  return h.redirect('/account_request')
}

function handleGetRequest(request, h) {
  const sessionData = getSessionData(request)
  const values = sessionData.details ?? {}

  return h.view(
    'account_requests/details/index.njk',
    buildViewModel(request, values)
  )
}

export const accountRequestDetailsController = {
  handler(request, h) {
    if (request.method === 'post') {
      return handlePostRequest(request, h)
    }

    return handleGetRequest(request, h)
  }
}
