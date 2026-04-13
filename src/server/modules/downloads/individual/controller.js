import { DOWNLOADS_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getBackLink,
  getSessionData,
  getProjectStateTag
} from '../../projects/helpers/project-utils.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STATUS
} from '../../../common/constants/projects.js'
import { getBenefitAreaDownloadData } from '../../projects/helpers/overview/benefit-area.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { getProjectFundingCalculatorDownloadUrl } from '../../../common/services/project/project-service.js'

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
      hasBenefitAreaFile: Boolean(
        projectData[PROJECT_PAYLOAD_FIELDS.BENEFIT_AREA_FILE_NAME]
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

    const { projectData: enrichedProjectData } =
      await getBenefitAreaDownloadData(request, projectData)

    // Fetch a fresh presigned URL for the funding calculator on every page load
    // (no caching: legacy-only, generated on-demand, no DB write)
    if (
      this._shouldShowFundingCalculator(
        Boolean(enrichedProjectData[PROJECT_PAYLOAD_FIELDS.IS_LEGACY]),
        Boolean(enrichedProjectData[PROJECT_PAYLOAD_FIELDS.IS_REVISED]),
        enrichedProjectData
      )
    ) {
      try {
        const authSession = getAuthSession(request)
        const accessToken = authSession?.accessToken
        const referenceNumber = enrichedProjectData[PROJECT_PAYLOAD_FIELDS.SLUG]
        const response = await getProjectFundingCalculatorDownloadUrl(
          referenceNumber,
          accessToken
        )
        if (response.success && response.data?.data?.downloadUrl) {
          enrichedProjectData[
            PROJECT_PAYLOAD_FIELDS.FUNDING_CALCULATOR_DOWNLOAD_URL
          ] = response.data.data.downloadUrl
        }
      } catch (error) {
        request.server.logger.error(
          { err: error },
          'Failed to fetch funding calculator download URL'
        )
      }
    }

    const viewData = this._getDownloadViewData(request, {
      backLink,
      projectData: enrichedProjectData
    })

    return h.view(DOWNLOADS_VIEWS.INDIVIDUAL, viewData)
  }
}

const controller = new IndividualDownloadsController()

export const individualDownloadsController = {
  getHandler: (request, h) => controller.get(request, h)
}
