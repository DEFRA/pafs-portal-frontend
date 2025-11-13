export const downloadController = {
  handler(request, h) {
    return h.view('download/index.njk', {
      title: 'Download',
      heading: 'Download'
    })
  }
}
