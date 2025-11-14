export const downloadController = {
  handler(_request, h) {
    return h.view('download/index.njk', {
      title: 'Download',
      heading: 'Download'
    })
  }
}
