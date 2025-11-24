import {
  resetPasswordController,
  resetPasswordPostController,
  resetPasswordSuccessController,
  resetPasswordTokenExpiredController
} from './controller.js'
import { redirectIfAuth } from '../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../common/constants/routes.js'

export const resetPassword = {
  plugin: {
    name: 'ResetPassword',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.RESET_PASSWORD,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...resetPasswordController
        },
        {
          method: 'POST',
          path: ROUTES.RESET_PASSWORD,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...resetPasswordPostController
        },
        {
          method: 'GET',
          path: ROUTES.RESET_PASSWORD_SUCCESS,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...resetPasswordSuccessController
        },
        {
          method: 'GET',
          path: ROUTES.RESET_PASSWORD_TOKEN_EXPIRED,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...resetPasswordTokenExpiredController
        }
      ])
    }
  }
}
