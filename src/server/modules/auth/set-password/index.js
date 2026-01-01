import {
  setPasswordController,
  setPasswordPostController,
  setPasswordTokenExpiredController
} from './controller.js'
import { redirectIfAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const setPassword = {
  plugin: {
    name: 'SetPassword',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.SET_PASSWORD,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...setPasswordController
        },
        {
          method: 'POST',
          path: ROUTES.SET_PASSWORD,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...setPasswordPostController
        },
        {
          method: 'GET',
          path: ROUTES.SET_PASSWORD_TOKEN_EXPIRED,
          options: {
            pre: [{ method: redirectIfAuth }]
          },
          ...setPasswordTokenExpiredController
        }
      ])
    }
  }
}
