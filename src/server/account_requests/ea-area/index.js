import { accountRequestEaAreaController } from './controller.js'

export const accountRequestEaArea = {
  plugin: {
    name: 'Account Request EA Area',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/ea-area',
          ...accountRequestEaAreaController
        },
        {
          method: 'POST',
          path: '/account_request/ea-area',
          ...accountRequestEaAreaController
        }
      ])
    }
  }
}
