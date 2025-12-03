import { ROUTES } from '../../common/constants/routes.js'

class UsersController {
  get(_request, h) {
    // Redirect to pending users page by default
    return h.redirect(ROUTES.ADMIN.USERS_ACTIVE)
  }
}

const controller = new UsersController()

export const usersController = {
  handler: (request, h) => controller.get(request, h)
}
