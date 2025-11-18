export const accountRequestDetailsController = {
  handler(request, h) {
    return h.view('account_requests/details/index.njk', {
      title: 'Request an account'
    })
  }
}
