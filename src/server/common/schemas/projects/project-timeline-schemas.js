import Joi from 'joi'
import { SIZE } from '../../constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES
} from '../../constants/projects.js'

// Financial year constants for timeline validation
const FINANCIAL_YEAR = {
  START_MONTH: SIZE.LENGTH_4, // April
  END_MONTH: SIZE.LENGTH_3, // March
  MIN_YEAR: SIZE.LENGTH_2000,
  MAX_YEAR: SIZE.LENGTH_2100
}

/**
 * Helper: Get current financial month and year
 * Financial year starts in April, so if current month is Jan-Mar, financial year is previous year
 * @returns {{month: number, year: number}} Current month (1-12) and current financial year
 */
const getCurrentFinancialMonthYear = () => {
  const now = new Date()
  const currentMonth = now.getMonth() + SIZE.LENGTH_1 // getMonth() returns 0-11
  const currentYear = now.getFullYear()

  // If we're before April (months 1-3), we're in the previous financial year
  const currentFinancialYear =
    currentMonth < FINANCIAL_YEAR.START_MONTH
      ? currentYear - SIZE.LENGTH_1
      : currentYear

  return {
    month: currentMonth,
    year: currentFinancialYear
  }
}

/**
 * Helper: Compare two month/year dates
 * @param {number} month1 - Month (1-12)
 * @param {number} year1 - Year
 * @param {number} month2 - Month (1-12)
 * @param {number} year2 - Year
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
const compareMonthYear = (month1, year1, month2, year2) => {
  if (year1 < year2) {
    return -1
  }
  if (year1 > year2) {
    return 1
  }
  if (month1 < month2) {
    return -1
  }
  if (month1 > month2) {
    return 1
  }
  return 0
}

/**
 * Helper: Check if date is within financial year range
 * Financial year runs from April (startYear) to March (endYear + 1)
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {number} financialStartYear - Financial start year
 * @param {number} financialEndYear - Financial end year
 * @returns {boolean} True if within range
 */
const isWithinFinancialYearRange = (
  month,
  year,
  financialStartYear,
  financialEndYear
) => {
  if (!financialStartYear || !financialEndYear) {
    return true // If financial years not set, don't validate
  }

  if (
    year < financialStartYear ||
    (year === financialStartYear && month < FINANCIAL_YEAR.START_MONTH)
  ) {
    return false
  }

  // Financial year ends in March of the NEXT year
  // e.g., FY 2030 = April 2030 to March 2031
  const actualEndYear = financialEndYear + 1
  if (
    year > actualEndYear ||
    (year === actualEndYear && month > FINANCIAL_YEAR.END_MONTH)
  ) {
    return false
  }

  return true
}

/**
 * Generic month schema - validates 1-12
 */
const monthSchema = Joi.number()
  .integer()
  .min(SIZE.LENGTH_1)
  .max(SIZE.LENGTH_12)
  .empty('')
  .required()
  .messages({
    'any.required': PROJECT_VALIDATION_MESSAGES.MONTH_REQUIRED,
    'number.base': PROJECT_VALIDATION_MESSAGES.MONTH_INVALID,
    'number.min': PROJECT_VALIDATION_MESSAGES.MONTH_INVALID,
    'number.max': PROJECT_VALIDATION_MESSAGES.MONTH_INVALID
  })

/**
 * Generic year schema - validates 2000-2100
 */
const yearSchema = Joi.number()
  .integer()
  .min(FINANCIAL_YEAR.MIN_YEAR)
  .max(FINANCIAL_YEAR.MAX_YEAR)
  .empty('')
  .required()
  .messages({
    'any.required': PROJECT_VALIDATION_MESSAGES.YEAR_REQUIRED,
    'number.base': PROJECT_VALIDATION_MESSAGES.YEAR_INVALID,
    'number.min': PROJECT_VALIDATION_MESSAGES.YEAR_INVALID,
    'number.max': PROJECT_VALIDATION_MESSAGES.YEAR_INVALID
  })

/**
 * Validate standard timeline dates (within financial year range and sequential)
 */
const validateStandardTimelineDate = (
  monthField,
  yearField,
  prevMonthField,
  prevYearField,
  stageName
) => {
  return (value, helpers) => {
    const data = helpers.state.ancestors[0]
    const month = Number(data[monthField])
    const year = Number(data[yearField])
    const financialStartYear = Number(data.financialStartYear)
    const financialEndYear = Number(data.financialEndYear)

    // Both month and year must be present for validation
    if (Number.isNaN(month) || Number.isNaN(year)) {
      return value
    }

    // Check within financial year range
    if (
      !isWithinFinancialYearRange(
        month,
        year,
        financialStartYear,
        financialEndYear
      )
    ) {
      return helpers.error('custom.date_outside_financial_range', {
        stageName,
        financialStartYear,
        financialEndYear
      })
    }

    // Check sequential ordering if previous stage exists
    if (prevMonthField && prevYearField) {
      const prevMonth = Number(data[prevMonthField])
      const prevYear = Number(data[prevYearField])
      const prevDataExists = !Number.isNaN(prevMonth) && !Number.isNaN(prevYear)

      if (prevDataExists) {
        const comparison = compareMonthYear(month, year, prevMonth, prevYear)
        // Require strictly greater than previous stage (not equal)
        // To allow equal dates, change <= to < below
        if (comparison <= 0) {
          return helpers.error('custom.date_not_after_previous_stage', {
            stageName
          })
        }
      }
    }

    return value
  }
}

/**
 * Validate EARLIEST_WITH_GIA date (must be before START_OUTLINE_BUSINESS_CASE)
 * Range: Current financial month/year to START_OUTLINE_BUSINESS_CASE month/year
 */
const validateEarliestWithGiaDate = (monthField, yearField) => {
  return (value, helpers) => {
    const data = helpers.state.ancestors[0]
    const month = Number(data[monthField])
    const year = Number(data[yearField])
    const startOBCMonth = Number(data.startOutlineBusinessCaseMonth)
    const startOBCYear = Number(data.startOutlineBusinessCaseYear)

    // Both month and year must be present for validation
    if (Number.isNaN(month) || Number.isNaN(year)) {
      return value
    }

    // Must have START_OUTLINE_BUSINESS_CASE date to validate against
    if (Number.isNaN(startOBCMonth) || Number.isNaN(startOBCYear)) {
      return value
    }

    // Check date is before START_OUTLINE_BUSINESS_CASE
    const comparison = compareMonthYear(
      month,
      year,
      startOBCMonth,
      startOBCYear
    )
    if (comparison >= 0) {
      return helpers.error('custom.earliest_gia_after_start_obc')
    }

    // Check within range: Current financial month/year to START_OUTLINE_BUSINESS_CASE
    const currentFinancial = getCurrentFinancialMonthYear()

    // Before current financial start (before April of current financial year)
    if (
      year < currentFinancial.year ||
      (year === currentFinancial.year && month < FINANCIAL_YEAR.START_MONTH)
    ) {
      return helpers.error('custom.earliest_gia_before_current_financial', {
        currentFinancialYear: currentFinancial.year
      })
    }

    return value
  }
}

/**
 * Start Outline Business Case schemas
 */
export const startOutlineBusinessCaseMonthSchema = monthSchema
  .custom(
    validateStandardTimelineDate(
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
      null,
      null,
      'Start Outline Business Case'
    )
  )
  .messages({
    'custom.date_outside_financial_range':
      PROJECT_VALIDATION_MESSAGES.DATE_OUTSIDE_FINANCIAL_RANGE
  })
  .label(PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH)

export const startOutlineBusinessCaseYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
)

/**
 * Complete Outline Business Case schemas
 */
export const completeOutlineBusinessCaseMonthSchema = monthSchema
  .custom(
    validateStandardTimelineDate(
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
      'Complete Outline Business Case'
    )
  )
  .messages({
    'custom.date_outside_financial_range':
      PROJECT_VALIDATION_MESSAGES.DATE_OUTSIDE_FINANCIAL_RANGE,
    'custom.date_not_after_previous_stage':
      PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })
  .label(PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH)

export const completeOutlineBusinessCaseYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
)

/**
 * Award Contract schemas
 */
export const awardContractMonthSchema = monthSchema
  .custom(
    validateStandardTimelineDate(
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR,
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
      'Award Contract'
    )
  )
  .messages({
    'custom.date_outside_financial_range':
      PROJECT_VALIDATION_MESSAGES.DATE_OUTSIDE_FINANCIAL_RANGE,
    'custom.date_not_after_previous_stage':
      PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })
  .label(PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH)

export const awardContractYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR
)

/**
 * Start Construction schemas
 */
export const startConstructionMonthSchema = monthSchema
  .custom(
    validateStandardTimelineDate(
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR,
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR,
      'Start Construction'
    )
  )
  .messages({
    'custom.date_outside_financial_range':
      PROJECT_VALIDATION_MESSAGES.DATE_OUTSIDE_FINANCIAL_RANGE,
    'custom.date_not_after_previous_stage':
      PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })
  .label(PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH)

export const startConstructionYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
)

/**
 * Ready for Service schemas
 */
export const readyForServiceMonthSchema = monthSchema
  .custom(
    validateStandardTimelineDate(
      PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
      PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR,
      'Ready for Service'
    )
  )
  .messages({
    'custom.date_outside_financial_range':
      PROJECT_VALIDATION_MESSAGES.DATE_OUTSIDE_FINANCIAL_RANGE,
    'custom.date_not_after_previous_stage':
      PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })
  .label(PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH)

export const readyForServiceYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR
)

/**
 * Could Start Early schema - boolean field
 */
export const couldStartEarlySchema = Joi.boolean()
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY)
  .messages({
    'boolean.base': PROJECT_VALIDATION_MESSAGES.COULD_START_EARLY_INVALID,
    'any.required': PROJECT_VALIDATION_MESSAGES.COULD_START_EARLY_REQUIRED
  })

/**
 * Earliest With GIA schemas - conditional on couldStartEarly
 */
export const earliestWithGiaMonthSchema = Joi.when(
  PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY,
  {
    is: Joi.alternatives().try(
      Joi.boolean().valid(true),
      Joi.string().valid('true')
    ),
    then: monthSchema
      .custom(
        validateEarliestWithGiaDate(
          PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
          PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR
        )
      )
      .messages({
        'custom.earliest_gia_after_start_obc':
          PROJECT_VALIDATION_MESSAGES.DATE_AFTER_OBC_START,
        'custom.earliest_gia_before_current_financial':
          PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_FINANCIAL_START
      })
      .label(PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH),
    otherwise: Joi.forbidden()
  }
)

export const earliestWithGiaYearSchema = Joi.when(
  PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY,
  {
    is: Joi.alternatives().try(
      Joi.boolean().valid(true),
      Joi.string().valid('true')
    ),
    then: yearSchema.label(PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR),
    otherwise: Joi.forbidden()
  }
)
