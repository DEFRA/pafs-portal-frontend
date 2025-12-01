import { accountRequestEaMainAreaController } from './controller.js'

export const accountRequestEaMainArea = {
  plugin: {
    name: 'Account Request EA Main Area',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/ea-main-area',
          ...accountRequestEaMainAreaController
        },
        {
          method: 'POST',
          path: '/account_request/ea-main-area',
          ...accountRequestEaMainAreaController
        }
      ])
    }
  }
}
