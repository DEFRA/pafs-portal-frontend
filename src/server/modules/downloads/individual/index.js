import { ROUTES } from '../../../common/constants/routes.js'
import { requireAuth } from '../../../common/helpers/auth/auth-middleware.js'
import {
  fetchProjectForOverview,
  initializeEditSessionPreHandler
} from '../../projects/helpers/project-edit-session.js'
import { individualDownloadsController } from './controller.js'
import { requireViewPermission } from '../../projects/helpers/permissions.js'

// INDIVIDUAL and MODERATION serve content locally:
// - fetchProjectForOverview sets request.pre.projectData for requireViewPermission
// - initializeEditSessionPreHandler refreshes yar session so controllers see saved state
// - requireViewPermission (canViewProposal) is the authoritative access check
const VIEW_PRE_HANDLERS = [
  { method: requireAuth },
  { method: fetchProjectForOverview },
  {
    method: (request, h) =>
      initializeEditSessionPreHandler(request, h, {
        forceRefresh: true
      })
  },
  { method: requireViewPermission }
]

// FCERM1 routes proxy to the backend which enforces validateDownloadPermissions.
// referenceNumber comes from request.params — no session fetch needed.
const DOWNLOAD_PRE_HANDLERS = [{ method: requireAuth }]

export const individualDownloads = {
  plugin: {
    name: 'Downloads - Individual Project',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.INDIVIDUAL,
          options: {
            pre: VIEW_PRE_HANDLERS,
            handler: individualDownloadsController.getHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.MODERATION,
          options: {
            pre: VIEW_PRE_HANDLERS,
            handler: individualDownloadsController.downloadModerationHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.FCERM1_LEGACY,
          options: {
            pre: DOWNLOAD_PRE_HANDLERS,
            handler: individualDownloadsController.downloadFcerm1LegacyHandler
          }
        },
        {
          method: 'GET',
          path: ROUTES.DOWNLOADS.FCERM1_NEW,
          options: {
            pre: DOWNLOAD_PRE_HANDLERS,
            handler: individualDownloadsController.downloadFcerm1NewHandler
          }
        }
      ])
    }
  }
}
