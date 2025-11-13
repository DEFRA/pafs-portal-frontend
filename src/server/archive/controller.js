export const archiveController = {
  handler(request, h) {
    return h.view('archive/index.njk', { title: 'Archive', heading: 'Archive' })
  }
}
