import Joi from 'joi'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'

const CARBON_NEGATIVE_ERROR = 'The value entered can not be negative'

const CARBON_DECIMAL_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD,
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION,
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED,
  PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED
]

const CARBON_INTEGER_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
]

export const ALL_CARBON_FIELDS = [
  ...CARBON_DECIMAL_FIELDS,
  ...CARBON_INTEGER_FIELDS
]

const MAX_DIGITS = 18
const DECIMAL_REGEX = /^\d+(\.\d{1,2})?$/
const INTEGER_REGEX = /^\d+$/

const CARBON_INVALID_ERROR =
  'Enter a valid number (up to 2 decimal places for tCO₂ fields, whole numbers for £ fields)'
const CARBON_MAX_DIGITS_ERROR =
  'You have exceeded the maximum number of digits allowed. Please re-enter.'
const CARBON_REQUIRED_ERROR = 'Please enter the value'

const validateCarbonDecimal = (value, helpers) => {
  if (!DECIMAL_REGEX.test(value)) {
    return helpers.error('string.pattern.base')
  }
  const intPart = value.split('.')[0]
  if (intPart.length > MAX_DIGITS) {
    return helpers.error('string.max')
  }
  return value
}

const validateCarbonInteger = (value, helpers) => {
  if (!INTEGER_REGEX.test(value)) {
    return helpers.error('string.pattern.base')
  }
  if (value.length > MAX_DIGITS) {
    return helpers.error('string.max')
  }
  return value
}

const optionalDecimalField = Joi.string()
  .trim()
  .allow(null, '')
  .optional()
  .custom((value, helpers) => {
    if (value === null || value === undefined || value === '') {
      return value
    }
    return validateCarbonDecimal(value, helpers)
  })
  .messages({
    'string.base': CARBON_INVALID_ERROR,
    'string.pattern.base': CARBON_INVALID_ERROR,
    'string.max': CARBON_MAX_DIGITS_ERROR
  })

const optionalIntegerField = Joi.string()
  .trim()
  .allow(null, '')
  .optional()
  .custom((value, helpers) => {
    if (value === null || value === undefined || value === '') {
      return value
    }
    return validateCarbonInteger(value, helpers)
  })
  .messages({
    'string.base': CARBON_INVALID_ERROR,
    'string.pattern.base': CARBON_INVALID_ERROR,
    'string.max': CARBON_MAX_DIGITS_ERROR
  })

const requiredIntegerField = Joi.string()
  .trim()
  .empty('')
  .required()
  .custom(validateCarbonInteger)
  .messages({
    'string.base': CARBON_INVALID_ERROR,
    'string.pattern.base': CARBON_INVALID_ERROR,
    'string.max': CARBON_MAX_DIGITS_ERROR,
    'any.required': CARBON_REQUIRED_ERROR
  })

/**
 * Optional decimal field with a specific error for negative values.
 * - Blank / null → allowed (optional field)
 * - Starts with '-' → CARBON_NEGATIVE_ERROR
 * - Non-numeric / too many dp → CARBON_INVALID_ERROR
 * - Exceeds MAX_DIGITS integer part → CARBON_MAX_DIGITS_ERROR
 */
const optionalDecimalFieldNegativeCheck = Joi.string()
  .trim()
  .allow(null, '')
  .optional()
  .custom((value, helpers) => {
    if (value === null || value === undefined || value === '') {
      return value
    }
    if (value.startsWith('-')) {
      return helpers.error('string.negative')
    }
    return validateCarbonDecimal(value, helpers)
  })
  .messages({
    'string.base': CARBON_INVALID_ERROR,
    'string.negative': CARBON_NEGATIVE_ERROR,
    'string.pattern.base': CARBON_INVALID_ERROR,
    'string.max': CARBON_MAX_DIGITS_ERROR
  })

/**
 * Per-step validation schemas for carbon input pages.
 * Maps step field name → Joi object schema (with allowUnknown for CSRF crumb etc.)
 */
export const CARBON_STEP_SCHEMAS = {
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]:
      optionalDecimalFieldNegativeCheck
  }).options({ allowUnknown: true }),
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]:
      optionalDecimalFieldNegativeCheck
  }).options({ allowUnknown: true }),
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]:
      optionalDecimalFieldNegativeCheck
  }).options({ allowUnknown: true }),
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]:
      optionalDecimalFieldNegativeCheck
  }).options({ allowUnknown: true }),
  [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
      optionalIntegerField
  }).options({ allowUnknown: true }),
  [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: Joi.object({
    [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]:
      requiredIntegerField
  }).options({ allowUnknown: true })
}

/**
 * Build the carbon impact Joi schema.
 * All tCO₂ fields and net economic benefit are optional.
 * Operational cost forecast is required.
 */
export const carbonImpactSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: optionalDecimalField,
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: optionalDecimalField,
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: optionalDecimalField,
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: optionalDecimalField,
  [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
    optionalIntegerField,
  [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]:
    requiredIntegerField
}).options({ allowUnknown: true })

/**
 * Project types for which Carbon Impact is hidden (STR, STU).
 */
export const CARBON_HIDDEN_PROJECT_TYPES = [
  PROJECT_TYPES.STR,
  PROJECT_TYPES.STU
]

/**
 * Returns the carbon impact schema or null if hidden.
 * @param {string} projectType
 * @returns {import('joi').ObjectSchema|null}
 */
export function getCarbonImpactSchemaForProjectType(projectType) {
  if (CARBON_HIDDEN_PROJECT_TYPES.includes(projectType)) {
    return null
  }
  return carbonImpactSchema
}
