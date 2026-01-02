import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

class HomeController {
  get(request, h) {
    const session = getAuthSession(request)

    return h.view('modules/general/home/index', {
      pageTitle: request.t('home.title'),
      heading: request.t('home.heading'),
      user: session?.user
    })
  }
}

const controller = new HomeController()

export const homeController = {
  handler: (request, h) => controller.get(request, h)
}
