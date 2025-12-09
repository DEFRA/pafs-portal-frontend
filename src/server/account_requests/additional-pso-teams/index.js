import { accountRequestAdditionalPsoTeamsController } from './controller.js'

export const accountRequestAdditionalPsoTeams = {
  plugin: {
    name: 'Account Request Additional PSO Teams',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/additional-pso-teams',
          ...accountRequestAdditionalPsoTeamsController
        },
        {
          method: 'POST',
          path: '/account_request/additional-pso-teams',
          ...accountRequestAdditionalPsoTeamsController
        }
      ])
    }
  }
}
