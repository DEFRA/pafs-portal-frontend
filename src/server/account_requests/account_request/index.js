import { accountRequestController } from './controller.js'

export const accountRequest = {
  plugin: {
    name: 'Account Request',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request',
          ...accountRequestController
        }
      ])
    }
  }
}
