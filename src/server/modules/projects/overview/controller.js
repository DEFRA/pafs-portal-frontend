import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STATUS,
  PROJECT_STEPS,
  PROJECT_TYPES,
  PROJECT_VIEW_ERROR_CODES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  getBackLink,
  getSessionData,
  formatDate,
  buildFinancialYearLabel
} from '../helpers/project-utils.js'

class OverviewController {
  _getProjectStateTag(projectState) {
    if (projectState === PROJECT_STATUS.DRAFT) {
      return 'govuk-tag--light-blue'
    }
    return 'govuk-tag--grey'
  }

  async get(request, h) {
    const backLink = getBackLink(request, {
      targetURL: ROUTES.PROJECT.HOME
    })
    const projectData = getSessionData(request)
    return h.view(PROJECT_VIEWS.OVERVIEW, {
      pageTitle: request.t('projects.overview.heading'),
      backLinkURL: backLink.href,
      backLinkText: backLink.text,
      projectData,
      projectStateTag: this._getProjectStateTag(projectData.projectState),
      ERROR_CODES: PROJECT_VIEW_ERROR_CODES,
      fieldErrors: {},
      errorCode: '',
      columnWidth: 'full',
      PROJECT_TYPES,
      PROJECT_INTERVENTION_TYPES,
      PROJECT_PAYLOAD_FIELDS,
      PROJECT_STEPS,
      buildFinancialYearLabel,
      formatDate
    })
  }
}

const controller = new OverviewController()

export const overviewController = {
  getHandler: (request, h) => controller.get(request, h)
}
