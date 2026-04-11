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

    // Check if funding calculator file exists
    return Boolean(projectData.fundingCalculatorS3Key)
  }

  async get(request, h) {
    const projectData = getSessionData(request)
    const backLink = getBackLink(request, {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      params: {
        referenceNumber: projectData[PROJECT_PAYLOAD_FIELDS.SLUG]
      }
    })

    const viewData = this._getDownloadViewData(request, {
      backLink,
      projectData
    })

    return h.view(DOWNLOADS_VIEWS.INDIVIDUAL, viewData)
  }
}

const controller = new IndividualDownloadsController()

export const individualDownloadsController = {
  getHandler: (request, h) => controller.get(request, h)
}
