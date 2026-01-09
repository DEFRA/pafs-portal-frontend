import inert from '@hapi/inert'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

import { loadModules } from './common/helpers/load-modules/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

const fileName = fileURLToPath(import.meta.url)
const dirName = dirname(fileName)

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await loadModules(server, join(dirName, 'modules'), ['health'])

      // Authentication routes
      await loadModules(server, join(dirName, 'modules/auth'), [
        'login',
        'logout',
        'forgot-password',
        'reset-password',
        'set-password'
      ])

      // Admin routes
      await loadModules(server, join(dirName, 'modules/admin'), [
        'users',
        'users/pending',
        'users/active',
        'journey-selection',
        'accounts'
      ])

      // General user routes
      await loadModules(server, join(dirName, 'modules/general'), [
        'home',
        'download',
        'archive',
        'accounts',
        'static'
      ])

      // Project proposal routes
      await loadModules(server, join(dirName, 'modules/project-proposal'), [
        'start-proposal',
        'project-name',
        'project-type',
        'intervention-type',
        'primary-intervention-type'
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
