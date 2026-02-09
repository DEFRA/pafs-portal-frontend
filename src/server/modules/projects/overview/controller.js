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
  buildFinancialYearLabel,
  formatFileSize
} from '../helpers/project-utils.js'
import { getBenefitAreaDownloadData } from '../helpers/overview/benefit-area.js'
import { enrichProjectData } from '../helpers/overview/data-enrichment.js'
import { handleServiceConsumptionError } from '../helpers/project-submission.js'

class OverviewController {
  _getProjectStateTag(projectState) {
    if (projectState === PROJECT_STATUS.DRAFT) {
      return 'govuk-tag--light-blue'
    }
    return 'govuk-tag--grey'
  }

  _getProjectViewData(request, options = {}) {
    const { backLink, projectData } = options
    return {
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
      formatDate,
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
    const projectData = getSessionData(request)
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
