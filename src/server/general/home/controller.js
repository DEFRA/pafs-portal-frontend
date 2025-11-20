import { getAuthSession } from '../../common/helpers/auth/session-manager.js'

class HomeController {
  get(request, h) {
    const session = getAuthSession(request)

    return h.view('general/home/index', {
      pageTitle: request.t('common.pages.home.title'),
      heading: request.t('common.pages.home.heading'),
      user: session?.user
    })
  }
}

const controller = new HomeController()

export const homeController = {
  handler: (request, h) => controller.get(request, h)
}
