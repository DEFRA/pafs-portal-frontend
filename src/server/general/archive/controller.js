import { getAuthSession } from '../../common/helpers/auth/session-manager.js'

class ArchiveController {
  get(request, h) {
    const session = getAuthSession(request)

    return h.view('general/archive/index', {
      pageTitle: request.t('common.pages.archive.title'),
      heading: request.t('common.pages.archive.heading'),
      user: session?.user
    })
  }
}

const controller = new ArchiveController()

export const archiveController = {
  handler: (request, h) => controller.get(request, h)
}
