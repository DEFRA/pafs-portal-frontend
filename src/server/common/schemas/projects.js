import Joi from 'joi'
import { SIZE, VALIDATION_PATTERNS } from '../constants/common.js'
import {
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES,
  PROJECT_VALIDATION_MESSAGES
} from '../constants/projects.js'

// Financial year constants
const FINANCIAL_YEAR = {
  START_MONTH: SIZE.LENGTH_4, // April
  MIN_YEAR: SIZE.LENGTH_2000,
  MAX_YEAR: SIZE.LENGTH_2100
}

// Cache for current financial year (recalculated daily)
let cachedFinancialYear = null
let cacheDate = null

/**
 * Project reference number schema - for updates
 * Format: {RFCC_CODE}C501E/{HIGH_COUNTER:3digits}A/{LOW_COUNTER:3digits}A
 * Example: SWC501E/001A/123A
 * Optional by default
 */
export const projectReferenceNumberSchema = Joi.string()
  .trim()
  .pattern(VALIDATION_PATTERNS.PROJECT_REFERENCE_NUMBER)
  .optional()
  .allow('')
  .label(PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER)
  .messages({
    'string.pattern.base':
      PROJECT_VALIDATION_MESSAGES.REFERENCE_NUMBER_INVALID_FORMAT
  })

/**
 * Project name schema - for updates
 */
export const projectNameSchema = Joi.string()
  .trim()
  .pattern(VALIDATION_PATTERNS.NAME_WITH_ALPHANUMERIC_SPACE_UNDERSCORE_DASH)
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.NAME)
  .messages({
    'string.empty': PROJECT_VALIDATION_MESSAGES.NAME_REQUIRED,
    'string.required': PROJECT_VALIDATION_MESSAGES.NAME_REQUIRED,
    'string.pattern.base': PROJECT_VALIDATION_MESSAGES.NAME_INVALID_FORMAT
  })

/**
 * Project Area ID schema - integer area ID from frontend
 */
export const projectAreaIdSchema = Joi.number()
  .integer()
  .positive()
  .label(PROJECT_PAYLOAD_FIELDS.AREA_ID)
  .required()
  .messages({
    'number.base': PROJECT_VALIDATION_MESSAGES.AREA_ID_INVALID,
    'number.positive': PROJECT_VALIDATION_MESSAGES.AREA_ID_INVALID,
    'number.integer': PROJECT_VALIDATION_MESSAGES.AREA_ID_INVALID,
    'any.required': PROJECT_VALIDATION_MESSAGES.AREA_ID_REQUIRED
  })

/**
 * Project type schema - for updates
 */
export const projectTypeSchema = Joi.string()
  .trim()
  .required()
  .valid(...Object.values(PROJECT_TYPES))
  .label(PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE)
  .messages({
    'string.empty': PROJECT_VALIDATION_MESSAGES.PROJECT_TYPE_REQUIRED,
    'any.required': PROJECT_VALIDATION_MESSAGES.PROJECT_TYPE_REQUIRED,
    'any.only': PROJECT_VALIDATION_MESSAGES.PROJECT_TYPE_INVALID
  })

/**
 * Helper: Get valid intervention types based on project type
 * @param {string} projectType - The project type (DEF, REP, REF, etc.)
 * @returns {string[]} Array of valid intervention type values
 */
const getValidInterventionTypes = (projectType) => {
  const defRepTypes = [
    PROJECT_INTERVENTION_TYPES.NFM,
    PROJECT_INTERVENTION_TYPES.PFR,
    PROJECT_INTERVENTION_TYPES.SUDS,
    PROJECT_INTERVENTION_TYPES.OTHER
  ]

  const refTypes = [
    PROJECT_INTERVENTION_TYPES.NFM,
    PROJECT_INTERVENTION_TYPES.SUDS,
    PROJECT_INTERVENTION_TYPES.OTHER
  ]

  if (projectType === PROJECT_TYPES.DEF || projectType === PROJECT_TYPES.REP) {
    return defRepTypes
  }

  if (projectType === PROJECT_TYPES.REF) {
    return refTypes
  }

  return []
}

/**
 * Project intervention type schema - for updates
 * Required only when projectType is DEF, REP, or REF
 * Forbidden for other project types
 * Multiple selection checkbox - array of strings
 * Valid options:
 * - DEF or REP: NFM, PFR, SUDS, OTHER
 * - REF: NFM, SUDS, OTHER
 */
export const projectInterventionTypeSchema = Joi.array()
  .items(Joi.string().trim())
  .when(PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE, {
    is: Joi.string().valid(PROJECT_TYPES.DEF, PROJECT_TYPES.REP),
    then: Joi.array()
      .items(
        Joi.string().valid(...getValidInterventionTypes(PROJECT_TYPES.DEF))
      )
      .min(SIZE.LENGTH_1)
      .required()
      .messages({
        'array.min':
          PROJECT_VALIDATION_MESSAGES.PROJECT_INTERVENTION_TYPE_REQUIRED,
        'any.required':
          PROJECT_VALIDATION_MESSAGES.PROJECT_INTERVENTION_TYPE_REQUIRED,
        'any.only':
          PROJECT_VALIDATION_MESSAGES.PROJECT_INTERVENTION_TYPE_INVALID
      }),
    otherwise: Joi.when(PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE, {
      is: PROJECT_TYPES.REF,
      then: Joi.array()
        .items(
          Joi.string().valid(...getValidInterventionTypes(PROJECT_TYPES.REF))
        )
        .min(SIZE.LENGTH_1)
        .required()
        .messages({
          'array.min':
            PROJECT_VALIDATION_MESSAGES.PROJECT_INTERVENTION_TYPE_REQUIRED,
          'any.required':
            PROJECT_VALIDATION_MESSAGES.PROJECT_INTERVENTION_TYPE_REQUIRED,
          'any.only':
            PROJECT_VALIDATION_MESSAGES.PROJECT_INTERVENTION_TYPE_INVALID
        }),
      otherwise: Joi.forbidden().messages({
        'any.unknown':
          'Project Intervention Types should not be provided for this project type'
      })
    })
  })
  .label(PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES)

/**
 * Helper: Validate main intervention type is in selected intervention types
 * @param {string} value - The main intervention type value
 * @param {Object} helpers - Joi validation helpers
 * @returns {string|Error} The value if valid, or Joi error
 */
const validateMainInterventionType = (value, helpers) => {
  const projectInterventionType =
    helpers.state.ancestors[0]?.[
      PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES
    ]

  if (!projectInterventionType || !Array.isArray(projectInterventionType)) {
    return value
  }

  if (!projectInterventionType.includes(value)) {
    return helpers.error('any.only', {
      value,
      validValues: projectInterventionType.join(', ')
    })
  }

  return value
}

/**
 * Project main intervention type schema - for updates
 * Required when projectType is DEF, REP, or REF AND projectInterventionType is provided
 * Forbidden for other project types
 * Must be one of the values selected in projectInterventionType
 */
export const projectMainInterventionTypeSchema = Joi.string()
  .trim()
  .when(PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE, {
    is: Joi.string().valid(
      PROJECT_TYPES.DEF,
      PROJECT_TYPES.REP,
      PROJECT_TYPES.REF
    ),
    then: Joi.when(PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES, {
      is: Joi.array().min(SIZE.LENGTH_1),
      then: Joi.string()
        .required()
        .custom(validateMainInterventionType)
        .messages({
          'string.empty':
            PROJECT_VALIDATION_MESSAGES.PROJECT_MAIN_INTERVENTION_TYPE_REQUIRED,
          'any.required':
            PROJECT_VALIDATION_MESSAGES.PROJECT_MAIN_INTERVENTION_TYPE_REQUIRED,
          'any.only':
            PROJECT_VALIDATION_MESSAGES.PROJECT_MAIN_INTERVENTION_TYPE_INVALID
        }),
      otherwise: Joi.string().optional()
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown':
        'Main Intervention Type should not be provided for this project type'
    })
  })
  .label(PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE)

/**
 * Get current financial year (April to March)
 * Financial year starts in April, so if current month is Jan-Mar, financial year is previous year
 * Results are cached per day for performance optimization
 * @returns {number} Current financial year (e.g., 2024)
 */
const getCurrentFinancialYear = () => {
  const now = new Date()
  const today = now.toDateString()

  // Return cached value if still valid for today
  if (cachedFinancialYear !== null && cacheDate === today) {
    return cachedFinancialYear
  }

  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + SIZE.LENGTH_1

  // Financial year calculation: if month < April, use previous year
  const financialYear =
    currentMonth >= FINANCIAL_YEAR.START_MONTH
      ? currentYear
      : currentYear - SIZE.LENGTH_1

  // Update cache
  cachedFinancialYear = financialYear
  cacheDate = today

  return financialYear
}

/**
 * Helper: Validate financial year is not in the past
 * @param {number} year - The year to validate
 * @param {Object} helpers - Joi validation helpers
 * @returns {number|Error} The year if valid, or Joi error
 */
const validateFinancialStartYear = (year, helpers) => {
  const currentFinancialYear = getCurrentFinancialYear()
  if (year < currentFinancialYear) {
    return helpers.error('number.min', {
      limit: currentFinancialYear,
      value: year
    })
  }

  // Check start year is < end year
  const endYear = helpers.state.ancestors[0]?.financialEndYear
  if (endYear && endYear < year) {
    return helpers.error('number.custom', {
      startYear: year,
      endYear
    })
  }
  return year
}

/**
 * Project financial start year schema - for updates
 * Must be a 4-digit year between 2000-2100 and >= current financial year
 */
export const projectFinancialStartYearSchema = Joi.number()
  .integer()
  .min(FINANCIAL_YEAR.MIN_YEAR)
  .max(FINANCIAL_YEAR.MAX_YEAR)
  .custom(validateFinancialStartYear)
  .required()
  .messages({
    'number.base': PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_REQUIRED,
    'number.min':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_SHOULD_BE_IN_FUTURE,
    'number.max': PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_INVALID,
    'number.custom':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_SHOULD_BE_LESS_THAN_END_YEAR,
    'any.required': PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_REQUIRED
  })
  .label(PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR)

/**
 * Helper: Validate financial end year constraints
 * @param {number} endYear - The end year to validate
 * @param {Object} helpers - Joi validation helpers
 * @returns {number|Error} The year if valid, or Joi error
 */
const validateFinancialEndYear = (endYear, helpers) => {
  const currentFinancialYear = getCurrentFinancialYear()

  // Check end year is not in the past
  if (endYear < currentFinancialYear) {
    return helpers.error('number.min', {
      limit: currentFinancialYear,
      value: endYear
    })
  }

  // Check end year is > start year
  const startYear = helpers.state.ancestors[0]?.financialStartYear
  if (startYear && endYear < startYear) {
    return helpers.error('number.custom', {
      startYear,
      endYear
    })
  }

  return endYear
}

/**
 * Project financial end year schema - for updates
 * Must be a 4-digit year between 2000-2100 and >= current financial year and >= financial start year
 */
export const projectFinancialEndYearSchema = Joi.number()
  .integer()
  .min(FINANCIAL_YEAR.MIN_YEAR)
  .max(FINANCIAL_YEAR.MAX_YEAR)
  .custom(validateFinancialEndYear)
  .required()
  .messages({
    'number.base': PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_REQUIRED,
    'number.min':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_SHOULD_BE_IN_FUTURE,
    'number.custom':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_SHOULD_BE_GREATER_THAN_START_YEAR,
    'number.max': PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_INVALID,
    'any.required': PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_REQUIRED
  })
  .label(PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR)
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
  if (year1 < year2) return -1
  if (year1 > year2) return 1
  if (month1 < month2) return -1
  if (month1 > month2) return 1
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

      if (prevMonth !== undefined && prevYear !== undefined) {
        if (compareMonthYear(month, year, prevMonth, prevYear) <= 0) {
          return helpers.error('date.sequential')
        }
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
