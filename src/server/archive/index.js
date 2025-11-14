import { archiveController } from './controller.js'

export const archive = {
  plugin: {
    name: 'Archive',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/archive',
          ...archiveController
        }
      ])
    }
  }
}
