import {
  downloadGetController,
  downloadGenerateController,
  downloadPollController,
  downloadFileController
} from './controller.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const download = {
  plugin: {
    name: 'Download',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.GENERAL.DOWNLOAD,
          options: { pre: [{ method: requireAuth }] },
          ...downloadGetController
        },
        {
          method: 'POST',
          path: `${ROUTES.GENERAL.DOWNLOAD}/generate`,
          options: { pre: [{ method: requireAuth }] },
          ...downloadGenerateController
        },
        {
          method: 'GET',
          path: `${ROUTES.GENERAL.DOWNLOAD}/poll`,
          options: { pre: [{ method: requireAuth }] },
          ...downloadPollController
        },
        {
          method: 'GET',
          path: `${ROUTES.GENERAL.DOWNLOAD}/file/{type}`,
          options: { pre: [{ method: requireAuth }] },
          ...downloadFileController
        }
      ])
    }
  }
}
