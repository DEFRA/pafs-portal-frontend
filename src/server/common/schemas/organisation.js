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
 * Date component schema (day, month, year)
 */
export const dateComponentSchema = Joi.object({
  day: Joi.string().allow('').optional(),
  month: Joi.string().allow('').optional(),
  year: Joi.string().allow('').optional()
})
  .optional()
  .custom((value, helpers) => {
    const { day, month, year } = value

    // If all empty, it's valid (optional date)
    if (!day && !month && !year) {
      return value
    }

    // Check if all parts contain only digits
    if (day && !/^\d+$/.test(day)) {
      return helpers.error('date.invalid')
    }
    if (month && !/^\d+$/.test(month)) {
      return helpers.error('date.invalid')
    }
    if (year && !/^\d+$/.test(year)) {
      return helpers.error('date.invalid')
    }

    // If any part is filled, all must be filled
    if (!day || !month || !year) {
      return helpers.error('date.incomplete')
    }

    const dayNum = parseInt(day, SIZE.LENGTH_10)
    const monthNum = parseInt(month, SIZE.LENGTH_10)
    const yearNum = parseInt(year, SIZE.LENGTH_10)

    // Validate ranges
    if (monthNum < 1 || monthNum > SIZE.LENGTH_12) {
      return helpers.error('date.invalid')
    }

    if (yearNum < SIZE.LENGTH_2000 || yearNum > SIZE.LENGTH_2100) {
      return helpers.error('date.invalid')
    }

    if (dayNum < SIZE.LENGTH_1 || dayNum > SIZE.LENGTH_31) {
      return helpers.error('date.invalid')
    }

    // Check if date is valid (e.g. not Feb 31)
    const date = new Date(yearNum, monthNum - SIZE.LENGTH_1, dayNum)
    if (
      date.getDate() !== dayNum ||
      date.getMonth() !== monthNum - SIZE.LENGTH_1 ||
      date.getFullYear() !== yearNum
    ) {
      return helpers.error('date.invalid')
    }

    return value
  })
  .label('endDate')
  .messages({
    'object.base': AREA_VALIDATION_CODES.DATE_INVALID,
    'date.incomplete': AREA_VALIDATION_CODES.DATE_INVALID,
    'date.invalid': AREA_VALIDATION_CODES.DATE_INVALID
  })
