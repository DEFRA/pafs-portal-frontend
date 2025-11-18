export const accountRequestEaAdditionalAreasController = {
  handler(request, h) {
    return h.view('account_requests/ea-additional-areas/index.njk', {
      title: 'Select additional EA areas'
    })
  }
}
