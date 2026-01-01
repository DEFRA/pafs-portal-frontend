import inert from '@hapi/inert'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

import { loadModules } from './common/helpers/load-modules/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await loadModules(server, join(__dirname, 'modules'), ['health'])

      // Authentication routes
      await loadModules(server, join(__dirname, 'modules/auth'), [
        'login',
        'logout',
        'forgot-password',
        'reset-password',
        'set-password'
      ])

      // Admin routes
      await loadModules(server, join(__dirname, 'modules/admin'), [
        'users',
        'users/pending',
        'users/active',
        'journey-selection',
        'accounts'
      ])

      // General user routes
      await loadModules(server, join(__dirname, 'modules/general'), [
        'home',
        'download',
        'archive',
        'accounts'
      ])

      // Project proposal routes
      await loadModules(server, join(__dirname, 'modules/project-proposal'), [
        'start-proposal',
        'project-name'
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
