import Joi from 'joi'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'

const WLB_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS
]

const MAX_DIGITS = 18

const DIGITS_ONLY_REGEX = /^\d+$/

const validateWlbEstimateString = (value, helpers) => {
  if (!DIGITS_ONLY_REGEX.test(value)) {
    return helpers.error('string.pattern.base')
  }

  if (value.length > MAX_DIGITS) {
    return helpers.error('string.max')
  }

  return value
}

const WLB_REQUIRED_FIELD_ERROR = 'Please enter the value'
const WLB_INVALID_FIELD_ERROR =
  'Enter a whole number with no letters, spaces, decimal point, currency symbols or special characters'
const WLB_MAX_DIGITS_ERROR =
  'You have exceeded the maximum number of digits allowed. Please re-enter.'

/**
 * A single WLB estimate field schema (required variant).
 * Accepts an integer >= 0 with at most 18 digits.
 */
const requiredEstimateField = Joi.string()
  .trim()
  .empty('')
  .required()
  .custom(validateWlbEstimateString)
  .messages({
    'string.base': WLB_INVALID_FIELD_ERROR,
    'string.pattern.base': WLB_INVALID_FIELD_ERROR,
    'string.max': WLB_MAX_DIGITS_ERROR,
    'any.required': WLB_REQUIRED_FIELD_ERROR
  })

/**
 * A single WLB estimate field schema (optional variant for ELO/HCR).
 * Accepts an integer >= 0 with at most 18 digits, or blank/null.
 */
const optionalEstimateField = Joi.string()
  .trim()
  .allow(null, '')
  .optional()
  .custom((value, helpers) => {
    if (value === null || value === undefined || value === '') {
      return value
    }
    return validateWlbEstimateString(value, helpers)
  })
  .messages({
    'string.base': WLB_INVALID_FIELD_ERROR,
    'string.pattern.base': WLB_INVALID_FIELD_ERROR,
    'string.max': WLB_MAX_DIGITS_ERROR
  })

const buildSchema = (fieldSchema) =>
  Joi.object(
    Object.fromEntries(WLB_FIELDS.map((field) => [field, fieldSchema]))
  ).options({ allowUnknown: true })

/**
 * Schema used for DEF / REF / REP.
 * First WLB field is required, remaining fields are optional.
 */
export const wlbRequiredSchema = Joi.object({
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: requiredEstimateField,
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]:
    optionalEstimateField,
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]:
    optionalEstimateField,
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]:
    optionalEstimateField,
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]:
    optionalEstimateField
}).options({ allowUnknown: true })

/**
 * Schema used for ELO / HCR.
 * All WLB fields are optional.
 */
export const wlbOptionalSchema = buildSchema(optionalEstimateField)

/**
 * Project types for which WLB is mandatory.
 */
export const WLB_MANDATORY_PROJECT_TYPES = [
  PROJECT_TYPES.DEF,
  PROJECT_TYPES.REF,
  PROJECT_TYPES.REP
]

/**
 * Project types for which WLB is optional.
 */
export const WLB_OPTIONAL_PROJECT_TYPES = [PROJECT_TYPES.ELO, PROJECT_TYPES.HCR]

/**
 * Project types for which WLB is hidden (skip to overview).
 */
export const WLB_HIDDEN_PROJECT_TYPES = [PROJECT_TYPES.STR, PROJECT_TYPES.STU]

/**
 * Returns the appropriate WLB schema for the given project type,
 * or null if WLB is hidden for this project type.
 * @param {string} projectType
 * @returns {import('joi').ObjectSchema|null}
 */
export function getWlbSchemaForProjectType(projectType) {
  if (WLB_MANDATORY_PROJECT_TYPES.includes(projectType)) {
    return wlbRequiredSchema
  }
  if (WLB_OPTIONAL_PROJECT_TYPES.includes(projectType)) {
    return wlbOptionalSchema
  }
  return null
}
