import { cookieSettingsController } from './controller.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const cookieSettings = {
  plugin: {
    name: 'Cookie Settings',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.COOKIE_SETTINGS,
          handler: cookieSettingsController.handler.get
        },
        {
          method: 'POST',
          path: ROUTES.GENERAL.COOKIE_SETTINGS,
          options: {
            validate: {
              payload: (value) => value
            }
          },
          handler: cookieSettingsController.handler.post
        }
      ])
    }
  }
}
