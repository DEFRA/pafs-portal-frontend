import { accountRequestDetailsController } from './controller.js'

export const accountRequestDetails = {
  plugin: {
    name: 'Account Request Details',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/details',
          ...accountRequestDetailsController
        }
      ])
    }
  }
}
