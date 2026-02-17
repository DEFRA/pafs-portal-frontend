import Joi from 'joi'
import { SIZE } from '../constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES
} from '../constants/projects.js'

// Financial year constants for timeline validation
const FINANCIAL_YEAR = {
  START_MONTH: SIZE.LENGTH_4, // April
  MIN_YEAR: SIZE.LENGTH_2000,
  MAX_YEAR: SIZE.LENGTH_2100
}

/**
 * Helper: Get current month and year
 * @returns {{month: number, year: number}} Current month (1-12) and year
 */
const getCurrentMonthYear = () => {
  const now = new Date()
  return {
    month: now.getMonth() + SIZE.LENGTH_1,
    year: now.getFullYear()
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
 * Helper: Validate month/year is not in the past and sequential
 */
const validateTimelineDate = (
  monthField,
  yearField,
  prevMonthField,
  prevYearField
) => {
  return (value, helpers) => {
    const data = helpers.state.ancestors[0]
    const month = data[monthField]
    const year = data[yearField]

    if (month === undefined || year === undefined) {
      return value
    }

    const current = getCurrentMonthYear()

    // Check not in past
    if (compareMonthYear(month, year, current.month, current.year) < 0) {
      return helpers.error('date.past')
    }

    // Check sequential ordering if previous stage exists
    if (prevMonthField && prevYearField) {
      const prevMonth = data[prevMonthField]
      const prevYear = data[prevYearField]
      const hasPrevious = prevMonth !== undefined && prevYear !== undefined
      const isNotSequential =
        compareMonthYear(month, year, prevMonth, prevYear) <= 0

      if (hasPrevious && isNotSequential) {
        return helpers.error('date.sequential')
      }
    }

    return value
  }
}

/**
 * Start Outline Business Case schemas
 */
export const startOutlineBusinessCaseMonthSchema = monthSchema
  .custom(
    validateTimelineDate(
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
      null,
      null
    )
  )
  .label(PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH)
  .messages({
    'date.past': PROJECT_VALIDATION_MESSAGES.DATE_IN_PAST,
    'date.sequential': PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })

export const startOutlineBusinessCaseYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
)

/**
 * Complete Outline Business Case schemas
 */
export const completeOutlineBusinessCaseMonthSchema = monthSchema
  .custom(
    validateTimelineDate(
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
    )
  )
  .label(PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH)
  .messages({
    'date.past': PROJECT_VALIDATION_MESSAGES.DATE_IN_PAST,
    'date.sequential': PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })

export const completeOutlineBusinessCaseYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
)

/**
 * Award Contract schemas
 */
export const awardContractMonthSchema = monthSchema
  .custom(
    validateTimelineDate(
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR,
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
      PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
    )
  )
  .label(PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH)
  .messages({
    'date.past': PROJECT_VALIDATION_MESSAGES.DATE_IN_PAST,
    'date.sequential': PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })

export const awardContractYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR
)

/**
 * Start Construction schemas
 */
export const startConstructionMonthSchema = monthSchema
  .custom(
    validateTimelineDate(
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR,
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
      PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR
    )
  )
  .label(PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH)
  .messages({
    'date.past': PROJECT_VALIDATION_MESSAGES.DATE_IN_PAST,
    'date.sequential': PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })

export const startConstructionYearSchema = yearSchema.label(
  PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
)

/**
 * Ready for Service schemas
 */
export const readyForServiceMonthSchema = monthSchema
  .custom(
    validateTimelineDate(
      PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
      PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
      PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
    )
  )
  .label(PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH)
  .messages({
    'date.past': PROJECT_VALIDATION_MESSAGES.DATE_IN_PAST,
    'date.sequential': PROJECT_VALIDATION_MESSAGES.DATE_BEFORE_PREVIOUS_STAGE
  })

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
      .label(PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH)
      .messages({
        'date.past': PROJECT_VALIDATION_MESSAGES.DATE_IN_PAST
      }),
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
