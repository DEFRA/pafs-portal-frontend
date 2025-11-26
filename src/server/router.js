import inert from '@hapi/inert'

import { home } from './general/home/index.js'
import { health } from './health/index.js'
import { download } from './general/download/index.js'
import { archive } from './general/archive/index.js'
import { login } from './auth/login/index.js'
import { logout } from './auth/logout/index.js'
import { forgotPassword } from './auth/forgot-password/index.js'
import { resetPassword } from './auth/reset-password/index.js'
import { users } from './admin/users/index.js'
import { journeySelection } from './admin/journey-selection/index.js'
import { accountRequest } from './account_requests/account_request/index.js'
import { accountRequestDetails } from './account_requests/details/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Authentication routes
      await server.register([login, logout, forgotPassword, resetPassword])

      // Admin routes
      await server.register([users, journeySelection])

      // General user routes
      await server.register([home, archive, download])

      // Account request routes
      await server.register([accountRequest, accountRequestDetails])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
