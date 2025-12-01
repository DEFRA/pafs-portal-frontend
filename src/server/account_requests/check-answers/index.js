import { accountRequestCheckAnswersController } from './controller.js'

export const accountRequestCheckAnswers = {
  plugin: {
    name: 'Account Request Check Answers',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/account_request/check-answers',
          ...accountRequestCheckAnswersController
        },
        {
          method: 'POST',
          path: '/account_request/check-answers',
          ...accountRequestCheckAnswersController
        }
      ])
    }
  }
}
