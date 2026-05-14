import { statusCodes } from '../../../common/constants/status-codes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getUserProgrammeStatus,
  generateUserProgramme,
  getUserProgrammeFileUrl,
  getAdminProgrammeStatus,
  generateAdminProgramme,
  getAdminProgrammeFileUrl
} from '../../../common/services/downloads/programme-download-service.js'

/**
 * Choose the correct backend API functions based on whether the user is an admin.
 * Admin users in the user journey see the system-wide download.
 * Regular users see their own area-specific download.
 */
function resolveDownloadService(isAdmin) {
  if (isAdmin) {
    return {
      getStatus: getAdminProgrammeStatus,
      generate: generateAdminProgramme
    }
  }
  return {
    getStatus: getUserProgrammeStatus,
    generate: generateUserProgramme
  }
}

/**
 * GET /download
 * Renders the area programme download page with current status and proposal counts.
 * Admin users see the system-wide download; regular users see their area download.
 */
export const downloadGetController = {
  handler: async (request, h) => {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const isAdmin = Boolean(session?.user?.admin)
    const svc = resolveDownloadService(isAdmin)

    let downloadStatus = null

    try {
      const result = await svc.getStatus(accessToken)
      if (result.success) {
        downloadStatus = result.data
      }
    } catch (err) {
      request.server.logger.warn({ err }, 'Failed to fetch programme status')
    }

    const titleKey = isAdmin
      ? 'download.admin.title'
      : 'download.programme.title'
    const headingKey = isAdmin
      ? 'download.admin.heading'
      : 'download.programme.heading'

    return h.view('modules/downloads/programme-download/index', {
      pageTitle: request.t(titleKey),
      heading: request.t(headingKey),
      user: session?.user,
      isAdmin,
      downloadStatus,
      flash: request.yar.flash('notification')?.[0] ?? null,
      routes: {
        generate: `${ROUTES.DOWNLOADS.PROGRAMME}/generate`,
        poll: `${ROUTES.DOWNLOADS.PROGRAMME}/poll`,
        fcerm1: `${ROUTES.DOWNLOADS.PROGRAMME}/file/fcerm1`,
        benefitAreas: `${ROUTES.DOWNLOADS.PROGRAMME}/file/benefit-areas`,
        moderations: `${ROUTES.DOWNLOADS.PROGRAMME}/file/moderations`
      }
    })
  }
}

/**
 * POST /download/generate
 * Triggers area programme generation and redirects back to the download page.
 * Works without JS (plain form POST).
 */
export const downloadGenerateController = {
  handler: async (request, h) => {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const isAdmin = Boolean(session?.user?.admin)
    const svc = resolveDownloadService(isAdmin)

    try {
      const result = await svc.generate(accessToken)

      if (!result.success) {
        request.yar.flash('notification', {
          type: 'error',
          text: request.t('download.programme.generate_error')
        })
      }
    } catch (err) {
      request.server.logger.error(
        { err },
        'Failed to trigger programme generation'
      )
      request.yar.flash('notification', {
        type: 'error',
        text: request.t('download.programme.generate_error')
      })
    }

    return h.redirect(ROUTES.DOWNLOADS.PROGRAMME)
  }
}

/**
 * GET /download/poll
 * JSON endpoint polled by client-side JS to check generation progress.
 * Returns status + progress so the browser can update the UI without a full reload.
 */
export const downloadPollController = {
  handler: async (request, h) => {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const isAdmin = Boolean(session?.user?.admin)
    const svc = resolveDownloadService(isAdmin)

    try {
      const result = await svc.getStatus(accessToken)

      if (result.success) {
        return h.response(result.data).code(statusCodes.ok)
      }

      return h.response({ status: 'empty' }).code(statusCodes.ok)
    } catch (err) {
      request.server.logger.warn({ err }, 'Poll failed')
      return h.response({ status: 'empty' }).code(statusCodes.ok)
    }
  }
}

/**
 * GET /download/file/{type}
 * Fetches a presigned S3 URL from the backend and redirects the browser to it,
 * triggering a direct file download.
 * Admin users only have an fcerm1 file; type is ignored and defaults to fcerm1.
 */
export const downloadFileController = {
  handler: async (request, h) => {
    const session = getAuthSession(request)
    const accessToken = session?.accessToken
    const isAdmin = Boolean(session?.user?.admin)
    const { type } = request.params

    try {
      let result
      if (isAdmin) {
        result = await getAdminProgrammeFileUrl(accessToken, type)
      } else {
        result = await getUserProgrammeFileUrl(accessToken, type)
      }

      if (result.success && result.data?.downloadUrl) {
        return h.redirect(result.data.downloadUrl)
      }
    } catch (err) {
      request.server.logger.error({ err, type }, 'Failed to get file URL')
    }

    request.yar.flash('notification', {
      type: 'error',
      text: request.t('download.programme.file_error')
    })
    return h.redirect(ROUTES.DOWNLOADS.PROGRAMME)
  }
}
