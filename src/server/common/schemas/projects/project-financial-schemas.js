import Joi from 'joi'
import { SIZE } from '../../constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES
} from '../../constants/projects.js'

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
    'number.base': PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_INVALID,
    'number.min':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_SHOULD_BE_IN_FUTURE,
    'number.max': PROJECT_VALIDATION_MESSAGES.FINANCIAL_START_YEAR_OUT_OF_RANGE,
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
    'number.base': PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_INVALID,
    'number.min':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_SHOULD_BE_IN_FUTURE,
    'number.custom':
      PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_SHOULD_BE_GREATER_THAN_START_YEAR,
    'number.max': PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_OUT_OF_RANGE,
    'any.required': PROJECT_VALIDATION_MESSAGES.FINANCIAL_END_YEAR_REQUIRED
  })
  .label(PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR)
