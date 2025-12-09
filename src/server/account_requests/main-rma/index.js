import { accountRequestMainRmaController } from './controller.js'

export const accountRequestMainRma = {
  plugin: {
    name: 'Account Request Main RMA',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/main-rma',
          ...accountRequestMainRmaController
        },
        {
          method: 'POST',
          path: '/account_request/main-rma',
          ...accountRequestMainRmaController
        }
      ])
    }
  }
}
