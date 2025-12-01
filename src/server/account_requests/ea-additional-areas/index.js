import { accountRequestEaAdditionalAreasController } from './controller.js'

export const accountRequestEaAdditionalAreas = {
  plugin: {
    name: 'Account Request EA Additional Areas',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/ea-additional-areas',
          ...accountRequestEaAdditionalAreasController
        },
        {
          method: 'POST',
          path: '/account_request/ea-additional-areas',
          ...accountRequestEaAdditionalAreasController
        }
      ])
    }
  }
}
