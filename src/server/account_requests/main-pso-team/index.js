import { accountRequestMainPsoTeamController } from './controller.js'

export const accountRequestMainPsoTeam = {
  plugin: {
    name: 'Account Request Main PSO Team',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/main-pso-team',
          ...accountRequestMainPsoTeamController
        },
        {
          method: 'POST',
          path: '/account_request/main-pso-team',
          ...accountRequestMainPsoTeamController
        }
      ])
    }
  }
}
