function buildViewModel(request) {
  return {
    title: request.t('account-request.confirmation.panelTitle')
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
