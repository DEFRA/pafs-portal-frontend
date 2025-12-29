import { accessibilityController } from './controller.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const accessibility = {
  plugin: {
    name: 'Accessibility',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.ACCESSIBILITY,
          ...accessibilityController
        }
      ])
    }
  }
}
