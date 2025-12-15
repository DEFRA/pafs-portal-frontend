import inert from '@hapi/inert'

import { home } from './general/home/index.js'
import { health } from './health/index.js'
import { download } from './general/download/index.js'
import { archive } from './general/archive/index.js'
import { login } from './auth/login/index.js'
import { logout } from './auth/logout/index.js'
import { forgotPassword } from './auth/forgot-password/index.js'
import { resetPassword } from './auth/reset-password/index.js'
import { setPassword } from './auth/set-password/index.js'
import { users } from './admin/users/index.js'
import { pendingUsers } from './admin/users/pending/index.js'
import { activeUsers } from './admin/users/active/index.js'
import { journeySelection } from './admin/journey-selection/index.js'
import { accountRequest } from './account_requests/account_request/index.js'
import { accountRequestDetails } from './account_requests/details/index.js'
import { accountRequestEaMainArea } from './account_requests/ea-main-area/index.js'
import { accountRequestEaAdditionalAreas } from './account_requests/ea-additional-areas/index.js'
import { accountRequestEaArea } from './account_requests/ea-area/index.js'
import { accountRequestMainPsoTeam } from './account_requests/main-pso-team/index.js'
import { accountRequestAdditionalPsoTeams } from './account_requests/additional-pso-teams/index.js'
import { accountRequestPsoTeam } from './account_requests/pso-team/index.js'
import { accountRequestMainRma } from './account_requests/main-rma/index.js'
import { accountRequestAdditionalRmas } from './account_requests/additional-rmas/index.js'
import { accountRequestCheckAnswers } from './account_requests/check-answers/index.js'
import { accountRequestConfirmation } from './account_requests/confirmation/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { projectProposalStart } from './project-proposal/start-proposal/index.js'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Authentication routes
      await server.register([
        login,
        logout,
        forgotPassword,
        resetPassword,
        setPassword
      ])

      // Admin routes
      await server.register([
        users,
        pendingUsers,
        activeUsers,
        journeySelection
      ])

      // General user routes
      await server.register([home, archive, download])

      // Account request routes
      await server.register([
        accountRequest,
        accountRequestDetails,
        accountRequestEaMainArea,
        accountRequestEaAdditionalAreas,
        accountRequestEaArea,
        accountRequestMainPsoTeam,
        accountRequestAdditionalPsoTeams,
        accountRequestPsoTeam,
        accountRequestMainRma,
        accountRequestAdditionalRmas,
        accountRequestCheckAnswers,
        accountRequestConfirmation
      ])

      await server.register([
        projectProposalStart
      ])

      // Static assets
      await server.register([serveStaticFiles])
    }
  }
}
