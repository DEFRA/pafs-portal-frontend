import {
  adminDownloadGetController,
  adminDownloadGenerateController,
  adminDownloadPollController,
  adminDownloadFileController
} from './controller.js'
import { requireAdmin } from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const adminProgrammeDownload = {
  plugin: {
    name: 'Admin Programme Download',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.ADMIN,
          options: { pre: [{ method: requireAdmin }] },
          ...adminDownloadGetController
        },
        {
          method: 'POST',
          path: `${ROUTES.DOWNLOADS.ADMIN}/generate`,
          options: { pre: [{ method: requireAdmin }] },
          ...adminDownloadGenerateController
        },
        {
          method: 'GET',
          path: `${ROUTES.DOWNLOADS.ADMIN}/poll`,
          options: { pre: [{ method: requireAdmin }] },
          ...adminDownloadPollController
        },
        {
          method: 'GET',
          path: `${ROUTES.DOWNLOADS.ADMIN}/file`,
          options: { pre: [{ method: requireAdmin }] },
          ...adminDownloadFileController
        }
      ])
    }
  }
}
