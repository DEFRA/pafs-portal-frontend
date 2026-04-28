import {
  downloadGetController,
  downloadGenerateController,
  downloadPollController,
  downloadFileController
} from './controller.js'
import {
  requireAuth,
  requireAdmin
} from '../../../common/helpers/auth/auth-middleware.js'
import { ROUTES } from '../../../common/constants/routes.js'

export const programmeDownload = {
  plugin: {
    name: 'Programme Download',
    register(server) {
      server.route([
        // ── Programme download routes ─────────────────────────────────────
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.PROGRAMME,
          options: { pre: [{ method: requireAuth }] },
          ...downloadGetController
        },
        {
          method: 'POST',
          path: `${ROUTES.DOWNLOADS.PROGRAMME}/generate`,
          options: { pre: [{ method: requireAuth }] },
          ...downloadGenerateController
        },
        {
          method: 'GET',
          path: `${ROUTES.DOWNLOADS.PROGRAMME}/poll`,
          options: { pre: [{ method: requireAuth }] },
          ...downloadPollController
        },
        {
          method: 'GET',
          path: `${ROUTES.DOWNLOADS.PROGRAMME}/file/{type}`,
          options: { pre: [{ method: requireAuth }] },
          ...downloadFileController
        },
        // ── Admin backwards-compat redirects (/admin/downloads → /download) ──
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.ADMIN,
          options: { pre: [{ method: requireAdmin }] },
          handler: (_request, h) =>
            h.redirect(ROUTES.DOWNLOADS.PROGRAMME).permanent()
        },
        {
          method: 'POST',
          path: `${ROUTES.DOWNLOADS.ADMIN}/generate`,
          options: { pre: [{ method: requireAdmin }] },
          handler: (_request, h) =>
            h.redirect(ROUTES.DOWNLOADS.PROGRAMME).permanent()
        },
        {
          method: 'GET',
          path: `${ROUTES.DOWNLOADS.ADMIN}/poll`,
          options: { pre: [{ method: requireAdmin }] },
          handler: (_request, h) =>
            h.redirect(ROUTES.DOWNLOADS.PROGRAMME).permanent()
        },
        {
          method: 'GET',
          path: `${ROUTES.DOWNLOADS.ADMIN}/file`,
          options: { pre: [{ method: requireAdmin }] },
          handler: (_request, h) =>
            h.redirect(ROUTES.DOWNLOADS.PROGRAMME).permanent()
        }
      ])
    }
  }
}
