import { logoutController } from './controller.js'
import { ROUTES } from '../../common/constants/routes.js'

export const logout = {
  plugin: {
    name: 'Logout',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.LOGOUT,
          ...logoutController
        }
      ])
    }
  }
}
