import { cookiesController } from './controller.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const cookies = {
  plugin: {
    name: 'Cookies Policy',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.COOKIES,
          ...cookiesController
        }
      ])
    }
  }
}
