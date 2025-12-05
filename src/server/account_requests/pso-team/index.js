import { accountRequestPsoTeamController } from './controller.js'

export const accountRequestPsoTeam = {
  plugin: {
    name: 'Account Request PSO Team',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/pso-team',
          ...accountRequestPsoTeamController
        },
        {
          method: 'POST',
          path: '/account_request/pso-team',
          ...accountRequestPsoTeamController
        }
      ])
    }
  }
}
