import { healthController, healthDetailedController } from './controller.js'
import {
  registerHealthBearerAuth,
  HEALTH_BEARER_STRATEGY
} from './health-bearer-scheme.js'

export const health = {
  plugin: {
    name: 'health',
    register(server) {
      registerHealthBearerAuth(server)
      server.route([
        {
          method: 'GET',
          path: '/health',
          ...healthController
        },
        {
          method: 'GET',
          path: '/health-detailed',
          options: { auth: HEALTH_BEARER_STRATEGY },
          handler: healthDetailedController.handler
        }
      ])
    }
  }
}
