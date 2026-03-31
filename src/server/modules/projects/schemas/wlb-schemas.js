import Joi from 'joi'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VALIDATION_MESSAGES,
  WLB_MANDATORY_PROJECT_TYPES,
  WLB_OPTIONAL_PROJECT_TYPES
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
    'string.base': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_INVALID,
    'string.pattern.base': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_INVALID,
    'string.max': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_OVER_MAX_DIGITS,
    'any.required': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_REQUIRED
  })

/**
 * A single WLB estimate field schema (optional variant for ELO/HCR).
 * Accepts an integer >= 0 with at most 18 digits, or blank/null.
 */
const optionalEstimateField = Joi.string()
  .trim()
  .allow(null, '')
  .optional()
  .custom((value, helpers) => validateWlbEstimateString(value, helpers))
  .messages({
    'string.base': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_INVALID,
    'string.pattern.base': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_INVALID,
    'string.max': PROJECT_VALIDATION_MESSAGES.WLB_FIELD_OVER_MAX_DIGITS
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
