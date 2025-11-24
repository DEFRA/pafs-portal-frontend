export const accountRequestController = {
  handler(_request, h) {
    return h.view('account_requests/account_request/index.njk')
  }
}
