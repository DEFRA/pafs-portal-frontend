import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { IMPORTANT_DATES_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  updateSessionData,
  validatePayload,
  navigateToProjectOverview,
  formatDate
} from '../helpers/project-utils.js'

// Previous stage mappings for date validation
const PREVIOUS_STAGE_MAP = {
  [PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE]: {
    monthField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
  },
  [PROJECT_STEPS.AWARD_MAIN_CONTRACT]: {
    monthField: PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
  },
  [PROJECT_STEPS.START_WORK]: {
    monthField: PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR
  },
  [PROJECT_STEPS.START_BENEFITS]: {
    monthField: PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
  }
}

// Payload level mappings for API submission
const PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]:
    PROJECT_PAYLOAD_LEVELS.START_OUTLINE_BUSINESS_CASE,
  [PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE]:
    PROJECT_PAYLOAD_LEVELS.COMPLETE_OUTLINE_BUSINESS_CASE,
  [PROJECT_STEPS.AWARD_MAIN_CONTRACT]:
    PROJECT_PAYLOAD_LEVELS.AWARD_MAIN_CONTRACT,
  [PROJECT_STEPS.START_WORK]: PROJECT_PAYLOAD_LEVELS.START_WORK,
  [PROJECT_STEPS.START_BENEFITS]: PROJECT_PAYLOAD_LEVELS.START_BENEFITS,
  [PROJECT_STEPS.COULD_START_EARLY]: PROJECT_PAYLOAD_LEVELS.COULD_START_EARLY,
  [PROJECT_STEPS.EARLIEST_START_DATE]:
    PROJECT_PAYLOAD_LEVELS.EARLIEST_START_DATE
}

// Step sequence for navigation flow
const STEP_SEQUENCE = {
  [PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]:
    ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE,
  [PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE]:
    ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT,
  [PROJECT_STEPS.AWARD_MAIN_CONTRACT]: ROUTES.PROJECT.EDIT.START_WORK,
  [PROJECT_STEPS.START_WORK]: ROUTES.PROJECT.EDIT.START_BENEFITS,
  [PROJECT_STEPS.START_BENEFITS]: ROUTES.PROJECT.EDIT.COULD_START_EARLY,
  [PROJECT_STEPS.COULD_START_EARLY]: ROUTES.PROJECT.EDIT.EARLIEST_START_DATE,
  [PROJECT_STEPS.EARLIEST_START_DATE]: ROUTES.PROJECT.OVERVIEW
}

/**
 * Important Dates Controller
 * Handles all important dates fields (date fields and could start earlier radio)
 * Only update mode - always requires referenceNumber
 */
class ImportantDatesController {
  _getConfig(step) {
    return IMPORTANT_DATES_CONFIG[step]
  }

  _getPreviousStageData(step, sessionData) {
    const previousStage = PREVIOUS_STAGE_MAP[step]
    if (!previousStage) {
      return null
    }

    const month = sessionData[previousStage.monthField]
    const year = sessionData[previousStage.yearField]

    return formatDate(month, year)
  }

  _getFinancialYearDates(sessionData) {
    const financialStartYear =
      sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]
    const financialEndYear =
      sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]

    return {
      financialYearStart: financialStartYear
        ? formatDate('4', financialStartYear)
        : '',
      financialYearEnd: financialEndYear
        ? formatDate('3', financialEndYear)
        : ''
    }
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const sessionData = getSessionData(request)
    const {
      backLinkOptions,
      localKeyPrefix,
      fieldType,
      monthField,
      yearField,
      fieldName
    } = config

    const previousStageDate = this._getPreviousStageData(step, sessionData)
    const { financialYearStart, financialYearEnd } =
      this._getFinancialYearDates(sessionData)

    const additionalData = {
      step,
      projectSteps: PROJECT_STEPS,
      fieldType,
      monthField,
      yearField,
      fieldName,
      sectionHint: request.t(localKeyPrefix + '.hint'),
      dateHint: request.t('projects.common.date_hint'),
      previousStageDate: previousStageDate || '',
      financialYearStart: financialYearStart || '',
      financialYearEnd: financialYearEnd || ''
    }

    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions,
      additionalData
    })
  }

  _getPayloadLevel(step) {
    return PAYLOAD_LEVEL_MAP[step]
  }

  _postRedirect(request, h) {
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData
    const step = getProjectStep(request)

    // Handle COULD_START_EARLY step - conditional branching
    if (step === PROJECT_STEPS.COULD_START_EARLY) {
      const couldStartEarly = request.payload?.couldStartEarly
      if (couldStartEarly === 'true' || couldStartEarly === true) {
        return h
          .redirect(
            ROUTES.PROJECT.EDIT.EARLIEST_START_DATE.replace(
              '{referenceNumber}',
              referenceNumber
            )
          )
          .takeover()
      }
      // If answer is no, return to overview
      return navigateToProjectOverview(referenceNumber, h)
    }

    // For all other cases, move to the next step in sequence
    const nextRoute = STEP_SEQUENCE[step]
    if (nextRoute) {
      return h
        .redirect(nextRoute.replace('{referenceNumber}', referenceNumber))
        .takeover()
    }

    // Fallback to overview
    return navigateToProjectOverview(referenceNumber, h)
  }

  async get(request, h) {
    return h.view(PROJECT_VIEWS.IMPORTANT_DATES, this._getViewData(request))
  }

  async _postSubmission(request, h) {
    const step = getProjectStep(request)
    const viewData = this._getViewData(request)
    const level = this._getPayloadLevel(step)

    return saveProjectWithErrorHandling(
      request,
      h,
      level,
      viewData,
      PROJECT_VIEWS.IMPORTANT_DATES
    )
  }

  async post(request, h) {
    // Save form data to session
    updateSessionData(request, request.payload)
    const viewData = this._getViewData(request)
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const { schema } = config

    try {
      const validationError = validatePayload(request, h, {
        template: PROJECT_VIEWS.IMPORTANT_DATES,
        schema,
        viewData
      })
      if (validationError) {
        return validationError
      }

      const response = await this._postSubmission(request, h)
      if (response) {
        return response
      }

      return this._postRedirect(request, h)
    } catch (error) {
      request.logger.error('Error important dates POST', error)
      return h.view(PROJECT_VIEWS.IMPORTANT_DATES, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new ImportantDatesController()

export const importantDatesController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
