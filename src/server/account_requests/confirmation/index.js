import { accountRequestConfirmationController } from './controller.js'

export const accountRequestConfirmation = {
  plugin: {
    name: 'Account Request Confirmation',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/confirmation',
          ...accountRequestConfirmationController
        }
      ])
    }
  }
}
