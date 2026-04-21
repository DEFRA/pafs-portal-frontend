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
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  getBackLink,
  getSessionData,
  formatDate,
  formatNumberWithCommas,
  buildFinancialYearLabel,
  formatFileSize,
  getProjectStateTag,
  isConfidenceRestrictedProjectType
} from '../helpers/project-utils.js'

class OverviewController {
  _getProjectViewData(request, options = {}) {
    const { backLink, projectData } = options
    const session = getAuthSession(request)
    const isEaUser = Boolean(session?.user?.isEa)
    const isReadOnly =
      !EDITABLE_STATUSES.includes(projectData.projectState) || isEaUser
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

  async get(request, h) {
    const backLink = getBackLink(request, {
      targetURL: ROUTES.PROJECT.HOME
    })
    const projectData = getSessionData(request)
    const viewData = this._getProjectViewData(request, {
      backLink,
      projectData
    })

    return h.view(PROJECT_VIEWS.OVERVIEW, viewData)
  }
}

const controller = new OverviewController()

export const overviewController = {
  getHandler: (request, h) => controller.get(request, h)
}
