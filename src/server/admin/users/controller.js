import { getAuthSession } from '../../common/helpers/auth/session-manager.js'

class UsersController {
  get(request, h) {
    const session = getAuthSession(request)

    return h.view('admin/users/index', {
      pageTitle: request.t('common.pages.admin.users.title'),
      heading: request.t('common.pages.admin.users.heading'),
      user: session?.user
    })
  }
}

const controller = new UsersController()

export const usersController = {
  handler: (request, h) => controller.get(request, h)
}
