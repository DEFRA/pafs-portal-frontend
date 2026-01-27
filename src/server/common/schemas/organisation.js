import Joi from 'joi'
import { AREA_VALIDATION_CODES } from '../constants/organisations.js'
import { AREAS_RESPONSIBILITIES_MAP, SIZE } from '../constants/common.js'

/**
 * Organisation name schema
 */
export const organisationNameSchema = Joi.string()
  .trim()
  .min(1)
  .max(SIZE.LENGTH_255)
  .required()
  .label('name')
  .messages({
    'any.required': AREA_VALIDATION_CODES.NAME_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.NAME_REQUIRED,
    'string.min': AREA_VALIDATION_CODES.NAME_TOO_SHORT,
    'string.max': AREA_VALIDATION_CODES.NAME_TOO_LONG
  })

/**
 * Organisation identifier schema (Authority Code, etc.)
 */
export const organisationIdentifierSchema = Joi.string()
  .trim()
  .max(SIZE.LENGTH_100)
  .label('identifier')
  .messages({
    'string.max': AREA_VALIDATION_CODES.IDENTIFIER_TOO_LONG
  })

/**
 * Area type schema
 */
export const areaTypeSchema = Joi.string()
  .trim()
  .valid(
    AREAS_RESPONSIBILITIES_MAP.AUTHORITY,
    AREAS_RESPONSIBILITIES_MAP.PSO,
    AREAS_RESPONSIBILITIES_MAP.RMA
  )
  .required()
  .label('areaType')
  .messages({
    'any.required': AREA_VALIDATION_CODES.TYPE_REQUIRED,
    'string.empty': AREA_VALIDATION_CODES.TYPE_REQUIRED,
    'any.only': AREA_VALIDATION_CODES.TYPE_INVALID
  })

/**
 * Helper function to check if date fields are empty
 * @param {string} day - Day component
 * @param {string} month - Month component
 * @param {string} year - Year component
 * @returns {boolean} True if all fields are empty
 */
const isDateEmpty = (day, month, year) => {
  return !day && !month && !year
}

/**
 * Helper function to validate if date parts contain only digits
 * @param {string} day - Day component
 * @param {string} month - Month component
 * @param {string} year - Year component
 * @returns {boolean} True if all non-empty parts are numeric
 */
const areDigitsValid = (day, month, year) => {
  const digitPattern = /^\d+$/
  if (day && !digitPattern.test(day)) {
    return false
  }
  if (month && !digitPattern.test(month)) {
    return false
  }
  if (year && !digitPattern.test(year)) {
    return false
  }
  return true
}

/**
 * Helper function to check if all date parts are filled
 * @param {string} day - Day component
 * @param {string} month - Month component
 * @param {string} year - Year component
 * @returns {boolean} True if all parts are filled
 */
const areAllPartsFilled = (day, month, year) => {
  return day && month && year
}

/**
 * Helper function to validate date ranges
 * @param {number} dayNum - Day as number
 * @param {number} monthNum - Month as number
 * @param {number} yearNum - Year as number
 * @returns {boolean} True if all ranges are valid
 */
const areDateRangesValid = (dayNum, monthNum, yearNum) => {
  if (monthNum < 1 || monthNum > SIZE.LENGTH_12) {
    return false
  }
  if (yearNum < SIZE.LENGTH_2000 || yearNum > SIZE.LENGTH_2100) {
    return false
  }
  if (dayNum < SIZE.LENGTH_1 || dayNum > SIZE.LENGTH_31) {
    return false
  }
  return true
}

/**
 * Helper function to check if date is calendar-valid
 * @param {number} dayNum - Day as number
 * @param {number} monthNum - Month as number
 * @param {number} yearNum - Year as number
 * @returns {boolean} True if date exists in calendar
 */
const isCalendarDateValid = (dayNum, monthNum, yearNum) => {
  const date = new Date(yearNum, monthNum - SIZE.LENGTH_1, dayNum)
  return (
    date.getDate() === dayNum &&
    date.getMonth() === monthNum - SIZE.LENGTH_1 &&
    date.getFullYear() === yearNum
  )
}

/**
 * Date component schema (day, month, year)
 */
export const dateComponentSchema = Joi.object({
  day: Joi.string().allow('').optional(),
  month: Joi.string().allow('').optional(),
  year: Joi.string().allow('').optional()
})
  .optional()
  .custom((value, helpers) => {
    const DATE_INVALID_ERROR = 'date.invalid'
    const DATE_INCOMPLETE_ERROR = 'date.incomplete'
    const { day, month, year } = value

    // If all empty, it's valid (optional date)
    if (isDateEmpty(day, month, year)) {
      return value
    }

    // Check if all parts contain only digits
    if (!areDigitsValid(day, month, year)) {
      return helpers.error(DATE_INVALID_ERROR)
    }

    // If any part is filled, all must be filled
    if (!areAllPartsFilled(day, month, year)) {
      return helpers.error(DATE_INCOMPLETE_ERROR)
    }

    const dayNum = Number.parseInt(day, SIZE.LENGTH_10)
    const monthNum = Number.parseInt(month, SIZE.LENGTH_10)
    const yearNum = Number.parseInt(year, SIZE.LENGTH_10)

    // Validate ranges
    if (!areDateRangesValid(dayNum, monthNum, yearNum)) {
      return helpers.error(DATE_INVALID_ERROR)
    }

    // Check if date is valid (e.g. not Feb 31)
    if (!isCalendarDateValid(dayNum, monthNum, yearNum)) {
      return helpers.error(DATE_INVALID_ERROR)
    }

    return value
  })
  .label('endDate')
  .messages({
    'object.base': AREA_VALIDATION_CODES.DATE_INVALID,
    'date.incomplete': AREA_VALIDATION_CODES.DATE_INVALID,
    'date.invalid': AREA_VALIDATION_CODES.DATE_INVALID
  })
