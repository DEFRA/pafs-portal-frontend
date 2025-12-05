import { ROUTES } from '../../common/constants/routes.js'

class UsersController {
  get(_request, h) {
    return h.redirect(ROUTES.ADMIN.USERS_PENDING)
  }
}

const controller = new UsersController()

export const usersController = {
  handler: (request, h) => controller.get(request, h)
}
