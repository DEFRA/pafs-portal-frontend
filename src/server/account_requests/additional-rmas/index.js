import { accountRequestAdditionalRmasController } from './controller.js'

export const accountRequestAdditionalRmas = {
  plugin: {
    name: 'Account Request Additional RMAs',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/additional-rmas',
          ...accountRequestAdditionalRmasController
        },
        {
          method: 'POST',
          path: '/account_request/additional-rmas',
          ...accountRequestAdditionalRmasController
        }
      ])
    }
  }
}
