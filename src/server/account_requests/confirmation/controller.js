function buildViewModel(request) {
  const confirmation = request.yar.get('accountRequestConfirmation') || {}
  const isApproved = confirmation.status === 'approved'
  return {
    // Title switches based on approval status
    title: isApproved
      ? request.t('account-request.confirmation-approved.panelTitle')
      : request.t('account-request.confirmation.panelTitle'),
    status: confirmation.status,
    email: confirmation.email
  }
}

export const accountRequestConfirmationController = {
  handler(request, h) {
    return h.view(
      'account_requests/confirmation/index.njk',
      buildViewModel(request)
    )
  }
}
