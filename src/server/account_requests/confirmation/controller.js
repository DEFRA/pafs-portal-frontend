export const accountRequestConfirmationController = {
  handler(request, h) {
    return h.view('account_requests/confirmation/index.njk')
  }
}
