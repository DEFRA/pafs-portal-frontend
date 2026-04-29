import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { FINANCIAL_YEAR_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getCurrentFinancialYearStartYear,
  isYearBeyondRange,
  getProjectStep,
  getSessionData,
  updateSessionData,
  validatePayload,
  buildFinancialYearOptions,
  getAfterMarchYear,
  navigateToProjectOverview,
  requiredInterventionTypesForProjectType
} from '../helpers/project-utils.js'

const REFERENCE_NUMBER_PARAM = '{referenceNumber}'

/**
 * Important dates payload fields that indicate the project has date data.
 */
const IMPORTANT_DATES_FIELDS = [
  'startOutlineBusinessCaseMonth',
  'startOutlineBusinessCaseYear',
  'completeOutlineBusinessCaseMonth',
  'completeOutlineBusinessCaseYear',
  'awardContractMonth',
  'awardContractYear',
  'startConstructionMonth',
  'startConstructionYear',
  'readyForServiceMonth',
  'readyForServiceYear'
]

/**
 * Funding source boolean fields that indicate at least one source has been selected.
 */
const FUNDING_SOURCE_BOOLEAN_FIELDS = [
  'fcermGia',
  'localLevy',
  'publicContributions',
  'privateContributions',
  'otherEaContributions',
  'notYetIdentified',
  'additionalFcermGia',
  'assetReplacementAllowance',
  'environmentStatutoryFunding',
  'frequentlyFloodedCommunities',
  'otherAdditionalGrantInAid',
  'otherGovernmentDepartment',
  'recovery',
  'summerEconomicFund'
]

/**
 * Checks whether the project has any Important Dates or Funding Sources data
 * that would be affected by a financial year range change.
 * @param {Object} sessionData - Project session data
 * @returns {boolean}
 */
function hasDateOrFundingData(sessionData) {
  // Check important dates
  const hasImportantDates = IMPORTANT_DATES_FIELDS.some((field) => {
    const value = sessionData[field]
    return value !== undefined && value !== null && value !== ''
  })

  if (hasImportantDates) {
    return true
  }

  // Check funding source selection booleans
  const hasFundingSourceSelected = FUNDING_SOURCE_BOOLEAN_FIELDS.some(
    (field) => sessionData[field] === true
  )

  if (hasFundingSourceSelected) {
    return true
  }

  // Check funding values (session format after estimated-spend save)
  const fundingValues = sessionData.fundingValues
  if (Array.isArray(fundingValues) && fundingValues.length > 0) {
    return true
  }

  // Check raw DB funding value rows (loaded from API before estimated-spend visit)
  const dbFundingValues = sessionData.pafs_core_funding_values
  if (Array.isArray(dbFundingValues) && dbFundingValues.length > 0) {
    return true
  }

  // Check raw DB contributor rows (legacy projects store names here)
  const dbContributors = sessionData.pafs_core_funding_contributors
  if (Array.isArray(dbContributors) && dbContributors.length > 0) {
    return true
  }

  return false
}

class FinancialYearController {
  _isFinancialStartYearStep(step) {
    return [
      PROJECT_STEPS.FINANCIAL_START_YEAR,
      PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL
    ].includes(step)
  }

  _isFinancialEndYearStep(step) {
    return [
      PROJECT_STEPS.FINANCIAL_END_YEAR,
      PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL
    ].includes(step)
  }

  /**
   * Get dynamic back link URL based on project session data
   * @private
   */
  _getBackLinkUrl(request, step) {
    const isEditMode = !!request.params?.referenceNumber
    const sessionData = getSessionData(request)
    // For start year steps in create mode, determine based on intervention types
    if (!isEditMode && this._isFinancialStartYearStep(step)) {
      const { projectType, projectInterventionTypes } = sessionData

      if (requiredInterventionTypesForProjectType(projectType)) {
        // If intervention types are required
        return projectInterventionTypes?.length === 1
          ? ROUTES.PROJECT.INTERVENTION_TYPE
          : ROUTES.PROJECT.PRIMARY_INTERVENTION_TYPE
      }
    }

    return ROUTES.PROJECT.TYPE
  }

  _getConfig(step) {
    return FINANCIAL_YEAR_CONFIG[step]
  }

  _getManualLinkUrl(request, step) {
    const isEditMode = !!request.params?.referenceNumber
    if (step === PROJECT_STEPS.FINANCIAL_START_YEAR) {
      return isEditMode
        ? ROUTES.PROJECT.EDIT.FINANCIAL_START_YEAR_MANUAL.replace(
            REFERENCE_NUMBER_PARAM,
            request.params.referenceNumber
          )
        : ROUTES.PROJECT.FINANCIAL_START_YEAR_MANUAL
    }
    if (step === PROJECT_STEPS.FINANCIAL_END_YEAR) {
      return isEditMode
        ? ROUTES.PROJECT.EDIT.FINANCIAL_END_YEAR_MANUAL.replace(
            REFERENCE_NUMBER_PARAM,
            request.params.referenceNumber
          )
        : ROUTES.PROJECT.FINANCIAL_END_YEAR_MANUAL
    }
    return ''
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const { localKeyPrefix, fieldName } = config
    const currentFinancialYear = getCurrentFinancialYearStartYear()
    const afterMarchYear = getAfterMarchYear(currentFinancialYear)

    // Get dynamic back link
    const backLinkURL = this._getBackLinkUrl(request, step)

    const additionalData = {
      step,
      projectSteps: PROJECT_STEPS,
      yearOptions: buildFinancialYearOptions(currentFinancialYear),
      afterMarchYear,
      fieldName,
      ...((step === PROJECT_STEPS.FINANCIAL_START_YEAR ||
        step === PROJECT_STEPS.FINANCIAL_END_YEAR) && {
        afterMarchLinkText: request.t(localKeyPrefix + '.after_march_link', {
          afterMarchYear
        }),
        afterMarchLinkHref: this._getManualLinkUrl(request, step)
      })
    }

    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions: { targetURL: backLinkURL, conditionalRedirect: true },
      additionalData
    })
  }

  _postRedirect(request, h) {
    const step = getProjectStep(request)
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData
    const isEditMode = !!referenceNumber

    // In create mode, start year steps go to end year
    if (!isEditMode && this._isFinancialStartYearStep(step)) {
      return h.redirect(ROUTES.PROJECT.FINANCIAL_END_YEAR).takeover()
    }

    // In edit mode, check if project has data that could be affected
    if (isEditMode && hasDateOrFundingData(sessionData)) {
      // Store which step triggered the warning for back link
      updateSessionData(request, { pendingFinancialYearStep: step })

      return h
        .redirect(
          ROUTES.PROJECT.EDIT.FINANCIAL_YEAR_WARNING.replace(
            REFERENCE_NUMBER_PARAM,
            referenceNumber
          )
        )
        .takeover()
    }

    // In edit mode or end year steps, go to overview
    if (isEditMode || this._isFinancialEndYearStep(step)) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    // Fallback (should not reach here)
    return navigateToProjectOverview(referenceNumber, h)
  }

  async get(request, h) {
    const step = getProjectStep(request)

    // Check if we need to redirect to manual step
    if (
      step === PROJECT_STEPS.FINANCIAL_START_YEAR ||
      step === PROJECT_STEPS.FINANCIAL_END_YEAR
    ) {
      const sessionData = getSessionData(request)
      const currentYear = getCurrentFinancialYearStartYear()
      const { financialStartYear, financialEndYear } = sessionData
      const selectedYear =
        step === PROJECT_STEPS.FINANCIAL_START_YEAR
          ? financialStartYear
          : financialEndYear
      const url = this._getManualLinkUrl(request, step)

      if (isYearBeyondRange(selectedYear, currentYear)) {
        return h.redirect(url).takeover()
      }
    }

    return h.view(PROJECT_VIEWS.FINANCIAL_YEAR, this._getViewData(request))
  }

  async _postSubmission(request, h) {
    const referenceNumber = request.params?.referenceNumber || ''
    const isEditMode = !!referenceNumber
    const step = getProjectStep(request)
    const viewData = this._getViewData(request)

    // Skip submission in create mode for start year steps
    if (!isEditMode && this._isFinancialStartYearStep(step)) {
      return null
    }

    // In edit mode, skip submission if data exists (warning page will handle save)
    if (isEditMode) {
      const sessionData = getSessionData(request)
      if (hasDateOrFundingData(sessionData)) {
        return null
      }
    }

    // Determine level for edit mode
    let level = PROJECT_PAYLOAD_LEVELS.INITIAL_SAVE
    if (isEditMode) {
      level = this._isFinancialStartYearStep(step)
        ? PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR
        : PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR
    }

    return saveProjectWithErrorHandling(
      request,
      h,
      level,
      viewData,
      PROJECT_VIEWS.FINANCIAL_YEAR
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
        template: PROJECT_VIEWS.FINANCIAL_YEAR,
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
      request.logger.error('Error financial year POST', error)
      return h.view(PROJECT_VIEWS.FINANCIAL_YEAR, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new FinancialYearController()

export const financialYearController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
