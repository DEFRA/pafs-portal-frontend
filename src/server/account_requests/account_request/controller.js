export const accountRequestController = {
  handler(request, h) {
    return h.view('account_requests/account_request/index.njk', {
      title: 'Request an account'
    })
  }
}
