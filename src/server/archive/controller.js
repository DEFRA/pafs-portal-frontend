export const archiveController = {
  handler(_request, h) {
    return h.view('archive/index.njk', { title: 'Archive', heading: 'Archive' })
  }
}
