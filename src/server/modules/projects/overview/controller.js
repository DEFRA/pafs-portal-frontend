import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  EDITABLE_STATUSES,
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_RISK_TYPES,
  PROJECT_STEPS,
  PROJECT_TYPES,
  PROJECT_VIEW_ERROR_CODES,
  URGENCY_REASONS,
  CONFIDENCE_LEVELS,
  NFM_MEASURES,
  NFM_LANDOWNER_CONSENT_OPTIONS,
  NFM_EXPERIENCE_LEVEL_OPTIONS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getBackLink,
  formatDate,
  formatNumberWithCommas,
  buildFinancialYearLabel,
  formatFileSize,
  getProjectStateTag,
  isConfidenceRestrictedProjectType
} from '../helpers/project-utils.js'
import { getBenefitAreaDownloadData } from '../helpers/overview/benefit-area.js'
import { enrichProjectData } from '../helpers/overview/data-enrichment.js'
import { handleServiceConsumptionError } from '../helpers/project-submission.js'

class OverviewController {
  _getProjectViewData(request, options = {}) {
    const { backLink, projectData } = options
    const isReadOnly = !EDITABLE_STATUSES.includes(projectData.projectState)
    const isLegacy = Boolean(projectData.isLegacy)
    const isConfidenceRestricted = isConfidenceRestrictedProjectType(
      projectData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    )
    return {
      pageTitle: request.t('projects.overview.heading'),
      backLinkURL: backLink.href,
      backLinkText: backLink.text,
      projectData,
      projectStateTag: getProjectStateTag(projectData.projectState),
      isReadOnly,
      isLegacy,
      isConfidenceRestricted,
      ERROR_CODES: PROJECT_VIEW_ERROR_CODES,
      fieldErrors: {},
      errorCode: '',
      columnWidth: 'full',
      PROJECT_TYPES,
      PROJECT_INTERVENTION_TYPES,
      PROJECT_RISK_TYPES,
      PROJECT_PAYLOAD_FIELDS,
      PROJECT_STEPS,
      NFM_MEASURES,
      NFM_LANDOWNER_CONSENT_OPTIONS,
      NFM_EXPERIENCE_LEVEL_OPTIONS,
      URGENCY_REASONS,
      CONFIDENCE_LEVELS,
      buildFinancialYearLabel,
      formatDate,
      formatNumberWithCommas,
      formatFileSize
    }
  }

  _handleOverviewResponse(request, h, options = {}) {
    const overviewTemplate = PROJECT_VIEWS.OVERVIEW
    const { viewData, success = true, error = '' } = options
    if (success) {
      return h.view(overviewTemplate, viewData)
    }
    return handleServiceConsumptionError(
      request,
      h,
      error,
      viewData,
      overviewTemplate
    )
  }

  async get(request, h) {
    const backLink = getBackLink(request, {
      targetURL: ROUTES.PROJECT.HOME
    })
    // Always use fresh backend data from request.pre.projectData (populated by fetchProjectForOverview pre-handler)
    const projectData = request.pre?.projectData
    if (!projectData) {
      // Defensive: fallback to session data if pre-handler failed (should not happen)
      return this._handleOverviewResponse(request, h, {
        viewData: { errorCode: 'NO_PROJECT_DATA' },
        success: false,
        error: 'No project data available.'
      })
    }
    const viewData = this._getProjectViewData(request, {
      backLink,
      projectData
    })

    const enrichmentResult = await enrichProjectData(request, projectData, [
      getBenefitAreaDownloadData
    ])

    viewData.projectData = enrichmentResult.projectData

    return this._handleOverviewResponse(request, h, {
      viewData,
      success: enrichmentResult.success,
      error: enrichmentResult.error
    })
  }
}

const controller = new OverviewController()

export const overviewController = {
  getHandler: (request, h) => controller.get(request, h)
}
