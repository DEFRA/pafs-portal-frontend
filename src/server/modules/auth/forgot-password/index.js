import {
  forgotPasswordController,
  forgotPasswordPostController,
  forgotPasswordConfirmationController
} from './controller.js'
import { redirectIfAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const forgotPassword = {
  plugin: {
    name: 'ForgotPassword',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.FORGOT_PASSWORD,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...forgotPasswordController
        },
        {
          method: 'POST',
          path: ROUTES.FORGOT_PASSWORD,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...forgotPasswordPostController
        },
        {
          method: 'GET',
          path: ROUTES.FORGOT_PASSWORD_CONFIRMATION,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...forgotPasswordConfirmationController
        }
      ])
    }
  }
}
