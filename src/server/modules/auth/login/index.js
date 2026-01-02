import { loginController, loginPostController } from './controller.js'
import { redirectIfAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const login = {
  plugin: {
    name: 'Login',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.LOGIN,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...loginController
        },
        {
          method: 'POST',
          path: ROUTES.LOGIN,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...loginPostController
        }
      ])
    }
  }
}
