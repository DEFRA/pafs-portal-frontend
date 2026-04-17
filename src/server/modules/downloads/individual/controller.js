import { config } from '../../../../config/config.js'
import { DOWNLOADS_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getBackLink,
  getSessionData,
  getProjectStateTag
} from '../../projects/helpers/project-utils.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STATUS,
  URGENCY_REASONS
} from '../../../common/constants/projects.js'
import { buildModerationResponse } from '../helpers/moderation-helper.js'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'

const BACKEND_URL = config.get('backendApi.url')

class IndividualDownloadsController {
  _getDownloadViewData(request, options = {}) {
    const { backLink, projectData } = options
    const isLegacy = Boolean(projectData[PROJECT_PAYLOAD_FIELDS.IS_LEGACY])
    const isRevised = Boolean(projectData[PROJECT_PAYLOAD_FIELDS.IS_REVISED])
    const projectState = projectData[PROJECT_PAYLOAD_FIELDS.PROJECT_STATE]

    // Determine which downloads are available based on project type and status
    const showNewTemplate = this._shouldShowNewTemplate(
      isLegacy,
      isRevised,
      projectState
    )
    const showLegacyTemplate = this._shouldShowLegacyTemplate(
      isLegacy,
      isRevised,
      projectState
    )
    const showFundingCalculator = this._shouldShowFundingCalculator(
      isLegacy,
      isRevised,
      projectData
    )
    const showModerationDownload = this._shouldShowModerationDownload(
      isLegacy,
      isRevised,
      projectState,
      projectData
    )

    const referenceNumber = projectData[PROJECT_PAYLOAD_FIELDS.SLUG]
    const fcerm1LegacyDownloadUrl = showLegacyTemplate
      ? ROUTES.DOWNLOADS.FCERM1_LEGACY.replace(
          '{referenceNumber}',
          referenceNumber
        )
      : null

    return {
      pageTitle: request.t('projects.downloads.heading'),
      backLinkURL: backLink.href,
      backLinkText: backLink.text,
      projectData: {
        ...projectData,
        isUrgent:
          projectData[PROJECT_PAYLOAD_FIELDS.URGENCY_REASON] &&
          projectData[PROJECT_PAYLOAD_FIELDS.URGENCY_REASON] !== 'not_urgent'
      },
      projectStateTag: getProjectStateTag(projectState),
      isLegacy,
      isRevised,
      projectState,
      showNewTemplate,
      showLegacyTemplate,
      showFundingCalculator,
      showModerationDownload,
      fcerm1LegacyDownloadUrl,
      hasBenefitAreaFile: Boolean(
        projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]
      ),
      moderationDownloadUrl: ROUTES.DOWNLOADS.MODERATION.replace(
        '{referenceNumber}',
        projectData[PROJECT_PAYLOAD_FIELDS.SLUG]
      ),
      columnWidth: 'two-thirds'
    }
  }

  _shouldShowNewTemplate(isLegacy, isRevised, projectState) {
    // New projects: always show new template
    if (!isLegacy) {
      return true
    }

    // Legacy revised and submitted: show new template (it's now a "new" submission)
    if (isLegacy && isRevised && projectState === PROJECT_STATUS.SUBMITTED) {
      return true
    }

    // Legacy submitted (not revised): do NOT show new template (old template only)
    if (projectState === PROJECT_STATUS.SUBMITTED) {
      return false
    }

    // Legacy draft/archived: show new template
    return true
  }

  _shouldShowLegacyTemplate(isLegacy, isRevised, projectState) {
    // Only legacy projects have legacy template
    if (!isLegacy) {
      return false
    }

    // Legacy revised and submitted: do NOT show legacy template (it's now a "new" submission)
    if (isRevised && projectState === PROJECT_STATUS.SUBMITTED) {
      return false
    }

    // Legacy submitted (not revised): show ONLY legacy template
    if (projectState === PROJECT_STATUS.SUBMITTED) {
      return true
    }

    // Legacy draft/archived: show legacy template alongside new
    return true
  }

  _shouldShowModerationDownload(
    isLegacy,
    isRevised,
    projectState,
    projectData
  ) {
    // Only for urgent projects
    const urgencyReason = projectData[PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]
    if (!urgencyReason || urgencyReason === URGENCY_REASONS.NOT_URGENT) {
      return false
    }

    // Only for legacy submitted (not revised) projects
    if (!isLegacy) {
      return false
    }
    if (isRevised) {
      return false
    }
    if (projectState !== PROJECT_STATUS.SUBMITTED) {
      return false
    }

    return true
  }

  _shouldShowFundingCalculator(isLegacy, isRevised, projectData) {
    // Only legacy projects have funding calculator
    if (!isLegacy) {
      return false
    }

    // Legacy revised and submitted: do NOT show funding calculator (it's now a "new" submission)
    if (
      isRevised &&
      projectData[PROJECT_PAYLOAD_FIELDS.PROJECT_STATE] ===
        PROJECT_STATUS.SUBMITTED
    ) {
      return false
    }

    // Check if funding calculator file exists (uses DB column, not a synthetic S3 key)
    return Boolean(
      projectData[PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_FILE_NAME]
    )
  }

  async get(request, h) {
    const projectData = getSessionData(request)
    const backLink = getBackLink(request, {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.OVERVIEW,
      params: {
        referenceNumber: projectData[PROJECT_PAYLOAD_FIELDS.SLUG]
      }
    })

    // Benefit area download URL and funding calculator download URL are resolved
    // by the backend enrichment pipeline at session load time — no extra API
    // calls needed here.
    const viewData = this._getDownloadViewData(request, {
      backLink,
      projectData
    })

    return h.view(DOWNLOADS_VIEWS.INDIVIDUAL, viewData)
  }

  /**
   * GET /project/{referenceNumber}/downloads/moderation
   * Streams the urgency moderation evidence as a plain-text download.
   * Only served when the project has a non-trivial urgency reason.
   * Delegates all content generation to moderation-helper (reusable by bulk download).
   */
  async downloadModeration(request, h) {
    const { logger } = request.server
    const projectData = getSessionData(request)
    const urgencyReason = projectData[PROJECT_PAYLOAD_FIELDS.URGENCY_REASON]

    // Guard: only serve for genuinely urgent projects
    if (!urgencyReason || urgencyReason === URGENCY_REASONS.NOT_URGENT) {
      logger.warn(
        { urgencyReason },
        'Moderation download requested for non-urgent project; rejecting'
      )
      return h.response('Not found').code(statusCodes.notFound)
    }

    // Area names (rfccName, eaAreaName, psoName) and moderationFilename are
    // resolved by the backend API at session load time — no extra service call needed.
    return buildModerationResponse(h, projectData, logger, statusCodes)
  }

  /**
   * GET /project/{referenceNumber}/downloads/fcerm1/legacy
   * Proxies the FCERM1 legacy Excel report from the backend API.
   * Only served when showLegacyTemplate is true for the project.
   */
  async downloadFcerm1Legacy(request, h) {
    const { logger } = request.server
    const projectData = getSessionData(request)
    const referenceNumber = projectData[PROJECT_PAYLOAD_FIELDS.SLUG]

    const session = getAuthSession(request)
    const accessToken = session?.accessToken

    if (!accessToken) {
      logger.warn('FCERM1 legacy download attempted without access token')
      return h.response('Unauthorised').code(statusCodes.unauthorized)
    }

    const url = `${BACKEND_URL}/api/v1/project/${referenceNumber}/fcerm1/legacy`

    logger.info(
      { referenceNumber },
      'Proxying FCERM1 legacy download from backend'
    )

    let backendResponse
    try {
      backendResponse = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` }
      })
    } catch (err) {
      logger.error(
        { err, referenceNumber },
        'Network error fetching FCERM1 legacy from backend'
      )
      return h
        .response('Error generating download')
        .code(statusCodes.internalServerError)
    }

    if (!backendResponse.ok) {
      logger.warn(
        { status: backendResponse.status, referenceNumber },
        'Backend returned error for FCERM1 legacy download'
      )
      return h.response('Download unavailable').code(backendResponse.status)
    }

    const arrayBuffer = await backendResponse.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const contentDisposition = backendResponse.headers.get(
      'content-disposition'
    )
    const filenameMatch = /filename="([^"]+)"/.exec(contentDisposition ?? '')
    const filename = filenameMatch?.[1] ?? `${referenceNumber}_proposal.xlsx`

    return h
      .response(buffer)
      .code(statusCodes.ok)
      .type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Content-Length', buffer.length)
  }
}

const controller = new IndividualDownloadsController()

export const individualDownloadsController = {
  getHandler: (request, h) => controller.get(request, h),
  downloadModerationHandler: (request, h) =>
    controller.downloadModeration(request, h),
  downloadFcerm1LegacyHandler: (request, h) =>
    controller.downloadFcerm1Legacy(request, h)
}
