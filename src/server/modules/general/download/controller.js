import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

class DownloadController {
  get(request, h) {
    const session = getAuthSession(request)

    return h.view('modules/general/download/index', {
      pageTitle: request.t('download.title'),
      heading: request.t('download.heading'),
      user: session?.user
    })
  }
}

const controller = new DownloadController()

export const downloadController = {
  handler: (request, h) => controller.get(request, h)
}
