import { downloadController } from './controller.js'

export const download = {
  plugin: {
    name: 'Download',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/download',
          ...downloadController
        }
      ])
    }
  }
}
