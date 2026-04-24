import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { extractApiError } from '../../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview
} from '../../helpers/project-utils.js'

const REFERENCE_NUMBER_PARAM = '{referenceNumber}'

class FinancialYearWarningController {
  _getBackLinkUrl(request) {
    const sessionData = getSessionData(request)
    const { referenceNumber } = request.params
    const pendingStep = sessionData.pendingFinancialYearStep

    if (
      pendingStep === PROJECT_STEPS.FINANCIAL_START_YEAR ||
      pendingStep === PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL
    ) {
      const route =
        pendingStep === PROJECT_STEPS.FINANCIAL_START_YEAR
          ? ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR
          : ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL
      return route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
    }

    if (
      pendingStep === PROJECT_STEPS.FINANCIAL_END_YEAR ||
      pendingStep === PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL
    ) {
      const route =
        pendingStep === PROJECT_STEPS.FINANCIAL_END_YEAR
          ? ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR
          : ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL
      return route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
    }

    // Fallback to overview
    return ROUTES.PROJECT.OVERVIEW.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )
  }

  async get(request, h) {
    const backLinkURL = this._getBackLinkUrl(request)

    const viewData = buildViewData(request, {
      localKeyPrefix: 'projects.financial_year.warning',
      backLinkOptions: { targetURL: backLinkURL, conditionalRedirect: false },
      additionalData: {}
    })

    return h.view(PROJECT_VIEWS.FINANCIAL_YEAR_WARNING, viewData)
  }

  async post(request, h) {
    const { referenceNumber } = request.params
    const sessionData = getSessionData(request)
    const pendingStep = sessionData.pendingFinancialYearStep

    const isStartYear = [
      PROJECT_STEPS.FINANCIAL_START_YEAR,
      PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL
    ].includes(pendingStep)

    const level = isStartYear
      ? PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR
      : PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR

    const backLinkURL = this._getBackLinkUrl(request)
    const viewData = buildViewData(request, {
      localKeyPrefix: 'projects.financial_year.warning',
      backLinkOptions: { targetURL: backLinkURL, conditionalRedirect: false },
      additionalData: {}
    })

    try {
      const response = await saveProjectWithErrorHandling(
        request,
        h,
        level,
        viewData,
        PROJECT_VIEWS.FINANCIAL_YEAR_WARNING
      )

      if (response) {
        return response
      }

      return navigateToProjectOverview(referenceNumber, h)
    } catch (error) {
      request.logger.error('Error financial year warning POST', error)
      return h.view(PROJECT_VIEWS.FINANCIAL_YEAR_WARNING, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new FinancialYearWarningController()

export const financialYearWarningController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
