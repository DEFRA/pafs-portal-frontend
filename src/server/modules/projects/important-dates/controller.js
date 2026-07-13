import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  PROJECT_TYPES,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { IMPORTANT_DATES_CONFIG } from '../helpers/project-config.js'
import { validateStartBenefitsSimplified } from '../schema.js'
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

// Project types that use the simplified 2-date journey (start + end only).
const STR_STU_SIMPLIFIED_TYPES = new Set([PROJECT_TYPES.STR, PROJECT_TYPES.STU])

// Steps that are shown only in the full journey — STR/STU skip these and land on START_BENEFITS.
const FULL_JOURNEY_ONLY_STEPS = new Set([
  PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE,
  PROJECT_STEPS.AWARD_MAIN_CONTRACT,
  PROJECT_STEPS.START_WORK
])

// Config overrides for the two steps that differ in the simplified journey.
// Each entry replaces only the keys that need to change; the rest come from IMPORTANT_DATES_CONFIG.
const SIMPLIFIED_CONFIG_OVERRIDES = {
  [PROJECT_TYPES.STU]: {
    [PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]: {
      localKeyPrefix: 'projects.important_dates.study_start'
    },
    [PROJECT_STEPS.START_BENEFITS]: {
      localKeyPrefix: 'projects.important_dates.study_end',
      schema: validateStartBenefitsSimplified,
      useObcAsPreviousStage: true,
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
        conditionalRedirect: false
      }
    }
  },
  [PROJECT_TYPES.STR]: {
    [PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]: {
      localKeyPrefix: 'projects.important_dates.strategy_start'
    },
    [PROJECT_STEPS.START_BENEFITS]: {
      localKeyPrefix: 'projects.important_dates.strategy_end',
      schema: validateStartBenefitsSimplified,
      useObcAsPreviousStage: true,
      backLinkOptions: {
        targetURL: ROUTES.PROJECT.OVERVIEW,
        targetEditURL: ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
        conditionalRedirect: false
      }
    }
  }
}

// Previous-stage mapping for the simplified journey's end-date step.
// For STR/STU, the previous stage is the study/strategy start (OBC start).
const SIMPLIFIED_PREVIOUS_STAGE_MAP = {
  [PROJECT_STEPS.START_BENEFITS]: {
    monthField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
  }
}
// Financial-year boundary months, named so the month numbers used throughout
// this controller are self-documenting rather than unexplained "magic" values.
const FINANCIAL_YEAR_START_MONTH = 4 // April
const FINANCIAL_YEAR_END_MONTH = 3 // March

// Number of months in a year, used for month arithmetic (calendar constant).
const MONTHS_IN_YEAR = 12

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

// Step sequence for the full journey (DEF / REF / REP / ELO / HCR)
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

// Step sequence for the simplified journey (STR / STU)
const SIMPLIFIED_STEP_SEQUENCE = {
  [PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]:
    ROUTES.PROJECT.EDIT.START_BENEFITS,
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
  _isSimplifiedType(projectType) {
    return STR_STU_SIMPLIFIED_TYPES.has(projectType)
  }

  _getConfig(step, projectType) {
    const base = IMPORTANT_DATES_CONFIG[step]
    const overrides = SIMPLIFIED_CONFIG_OVERRIDES[projectType]?.[step]
    if (!overrides) {
      return base
    }
    return { ...base, ...overrides }
  }

  _getPreviousStageData(step, sessionData) {
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const stageMap = this._isSimplifiedType(projectType)
      ? SIMPLIFIED_PREVIOUS_STAGE_MAP
      : PREVIOUS_STAGE_MAP
    const previousStage = stageMap[step]
    if (!previousStage) {
      return null
    }

    const month = sessionData[previousStage.monthField]
    const year = sessionData[previousStage.yearField]

    return formatDate(month, year)
  }

  /**
   * Get the previous stage's month/year as numbers (or null when not set).
   * Used to compute the "1 month after the previous stage" range start.
   * Project-type aware: STR/STU use the simplified previous-stage map so the
   * end date's lower bound is 1 month after the study/strategy start date
   * (rather than the full-journey start-construction date, which they skip).
   */
  _getPreviousStageRaw(step, sessionData) {
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const stageMap = this._isSimplifiedType(projectType)
      ? SIMPLIFIED_PREVIOUS_STAGE_MAP
      : PREVIOUS_STAGE_MAP
    const previousStage = stageMap[step]
    if (!previousStage) {
      return null
    }

    const month = sessionData[previousStage.monthField]
    const year = sessionData[previousStage.yearField]

    if (!month || !year) {
      return null
    }

    return { month: Number(month), year: Number(year) }
  }

  _getFinancialYearDates(sessionData) {
    const financialStartYear =
      sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]
    const financialEndYear =
      sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR]

    // Financial year ends in March of the NEXT year
    // e.g., FY 2030 runs from April 2030 to March 2031
    return {
      financialYearStart: financialStartYear
        ? formatDate(FINANCIAL_YEAR_START_MONTH, financialStartYear)
        : '',
      financialYearEnd: financialEndYear
        ? formatDate(FINANCIAL_YEAR_END_MONTH, Number(financialEndYear) + 1)
        : ''
    }
  }

  _getObcStartDate(sessionData) {
    const month = sessionData.startOutlineBusinessCaseMonth
    const year = sessionData.startOutlineBusinessCaseYear

    if (!month || !year) {
      return null
    }

    return formatDate(month, year)
  }

  /**
   * Get the outline business case start month/year as numbers (or null).
   * Used to compute the upper bound of the earliest start date range.
   */
  _getObcStartRaw(sessionData) {
    const month =
      sessionData[PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH]
    const year =
      sessionData[PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR]

    if (!month || !year) {
      return null
    }

    return { month: Number(month), year: Number(year) }
  }

  /**
   * Add (or subtract, with a negative delta) whole months to a month/year
   * pair, handling year rollover in both directions.
   * @param {number|string} month - Month (1-12)
   * @param {number|string} year - Year
   * @param {number} delta - Number of months to add (may be negative)
   * @returns {{month: number, year: number}}
   */
  _addMonths(month, year, delta) {
    const zeroBasedTotal = Number(month) - 1 + delta
    const yearOffset = Math.floor(zeroBasedTotal / MONTHS_IN_YEAR)
    const normalisedMonth =
      ((zeroBasedTotal % MONTHS_IN_YEAR) + MONTHS_IN_YEAR) % MONTHS_IN_YEAR
    return { month: normalisedMonth + 1, year: Number(year) + yearOffset }
  }

  /**
   * Compute the raw minimum accepted month/year (the lower bound of the
   * acceptable range) for the current date question.
   * - Earliest start date: current financial year start (April of the
   *   current financial year).
   * - Timeline dates: 1 month after the previous stage when it exists,
   *   otherwise the financial year start (April of financialStartYear).
   * Returns null for non-date questions or when the bound can't be resolved.
   */
  _getRangeStartRaw(step, config, sessionData) {
    const { fieldType, monthField } = config

    if (fieldType !== 'date') {
      return null
    }

    // Earliest start date: lower bound is the current financial year start
    if (monthField === PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH) {
      return {
        month: FINANCIAL_YEAR_START_MONTH,
        year: this._getCurrentFinancialStartYear()
      }
    }

    // Timeline dates: 1 month after the previous stage when available
    const previousStageRaw = this._getPreviousStageRaw(step, sessionData)
    if (previousStageRaw) {
      return this._addMonths(previousStageRaw.month, previousStageRaw.year, 1)
    }

    // Otherwise the financial year start (April of financialStartYear)
    const financialStartYear =
      sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR]
    if (!financialStartYear) {
      return null
    }
    return {
      month: FINANCIAL_YEAR_START_MONTH,
      year: Number(financialStartYear)
    }
  }

  /**
   * Build the dynamic "acceptable range" hint for a date question.
   * - Timeline dates: (financial year start OR 1 month after the previous
   *   stage) to the financial year end (March of financialEndYear + 1).
   * - Earliest start date: current financial year start to 1 month before the
   *   outline business case start date.
   * - Radio questions have no date range, so an empty string is returned.
   */
  _getRangeHint(request, context) {
    const { config, sessionData, rangeStartRaw, financialYearEnd } = context
    const { fieldType, monthField, localKeyPrefix } = config

    // Only date questions with a resolvable lower bound get a range hint
    if (fieldType !== 'date' || !rangeStartRaw) {
      return ''
    }

    const rangeStart = formatDate(rangeStartRaw.month, rangeStartRaw.year)

    // Earliest start date: upper bound is 1 month before OBC start
    if (monthField === PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH) {
      const obcStartRaw = this._getObcStartRaw(sessionData)
      if (!obcStartRaw) {
        return ''
      }
      const upperBound = this._addMonths(
        obcStartRaw.month,
        obcStartRaw.year,
        -1
      )
      return request.t(`${localKeyPrefix}.range_hint`, {
        rangeStart,
        rangeEnd: formatDate(upperBound.month, upperBound.year)
      })
    }

    // Standard timeline dates always end at the financial year end
    if (!financialYearEnd) {
      return ''
    }

    return request.t(`${localKeyPrefix}.range_hint`, {
      rangeStart,
      rangeEnd: financialYearEnd
    })
  }

  /**
   * Build the dynamic "For example, M YYYY" hint from the minimum accepted
   * input (the lower bound of the acceptable range). Falls back to the
   * generic example when the lower bound can't be resolved.
   */
  _getDateHint(request, rangeStartRaw) {
    if (!rangeStartRaw) {
      return request.t('projects.common.date_hint')
    }
    return request.t('projects.important_dates.date_hint', {
      month: rangeStartRaw.month,
      year: rangeStartRaw.year
    })
  }

  _getCurrentFinancialStartYear() {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // If we're before April (months 1-3), we're in the previous financial year
    return currentMonth < FINANCIAL_YEAR_START_MONTH
      ? currentYear - 1
      : currentYear
  }

  _getCurrentFinancialYearStart() {
    // Financial year starts in April
    return formatDate(
      FINANCIAL_YEAR_START_MONTH,
      this._getCurrentFinancialStartYear()
    )
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const sessionData = getSessionData(request)
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const config = this._getConfig(step, projectType)
    const {
      backLinkOptions,
      localKeyPrefix,
      fieldType,
      monthField,
      yearField,
      fieldName,
      useObcAsPreviousStage = false
    } = config

    const previousStageDate = this._getPreviousStageData(step, sessionData)
    const { financialYearStart, financialYearEnd } =
      this._getFinancialYearDates(sessionData)
    const obcStartDate = this._getObcStartDate(sessionData)
    const currentFinancialYearStart = this._getCurrentFinancialYearStart()

    const rangeStartRaw = this._getRangeStartRaw(step, config, sessionData)
    const rangeHint = this._getRangeHint(request, {
      config,
      sessionData,
      rangeStartRaw,
      financialYearEnd
    })
    const dateHint = this._getDateHint(request, rangeStartRaw)

    const additionalData = {
      step,
      projectSteps: PROJECT_STEPS,
      fieldType,
      monthField,
      yearField,
      fieldName,
      useObcAsPreviousStage,
      sectionHint: request.t(localKeyPrefix + '.hint'),
      dateHint,
      rangeHint: rangeHint || '',
      previousStageDate: previousStageDate || '',
      financialYearStart: financialYearStart || '',
      financialYearEnd: financialYearEnd || '',
      obcStartDateFormatted: obcStartDate || '',
      currentFinancialYearStart: currentFinancialYearStart || ''
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
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const isSimplified = this._isSimplifiedType(projectType)

    // Handle COULD_START_EARLY step - conditional branching (same for all types)
    if (step === PROJECT_STEPS.COULD_START_EARLY) {
      const couldStartEarly = request.payload?.couldStartEarly
      if (couldStartEarly === 'true' || couldStartEarly === true) {
        return h
          .redirect(
            ROUTES.PROJECT.EDIT.EARLIEST_START_DATE.replace(
              REFERENCE_NUMBER_PARAM,
              referenceNumber
            )
          )
          .takeover()
      }
      return navigateToProjectOverview(referenceNumber, h)
    }

    const sequence = isSimplified ? SIMPLIFIED_STEP_SEQUENCE : STEP_SEQUENCE
    const nextRoute = sequence[step]
    if (nextRoute) {
      return h
        .redirect(nextRoute.replace(REFERENCE_NUMBER_PARAM, referenceNumber))
        .takeover()
    }

    return navigateToProjectOverview(referenceNumber, h)
  }

  async get(request, h) {
    const sessionData = getSessionData(request)
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const step = getProjectStep(request)

    // STR/STU skip the 3 middle steps — redirect to the end-date step
    if (
      this._isSimplifiedType(projectType) &&
      FULL_JOURNEY_ONLY_STEPS.has(step)
    ) {
      const referenceNumber = sessionData.slug
      return h
        .redirect(
          ROUTES.PROJECT.EDIT.START_BENEFITS.replace(
            REFERENCE_NUMBER_PARAM,
            referenceNumber
          )
        )
        .takeover()
    }

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
    const sessionData = getSessionData(request)
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const step = getProjectStep(request)
    const viewData = this._getViewData(request)
    const config = this._getConfig(step, projectType)
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
