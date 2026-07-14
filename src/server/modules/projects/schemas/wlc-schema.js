import Joi from 'joi'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'

const WLC_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS,
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS,
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_RISK_CONTINGENCY_COSTS,
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS
]

// Maximum accepted value: 100 billion (inclusive).
const MAX_VALUE = 100_000_000_000

const DIGITS_ONLY_REGEX = /^\d+$/

const validateWlcCostString = (value, helpers) => {
  if (!DIGITS_ONLY_REGEX.test(value)) {
    return helpers.error('string.pattern.base')
  }

  if (Number(value) > MAX_VALUE) {
    return helpers.error('string.max')
  }

  return value
}

const WLC_MESSAGE =
  'Please enter a whole number less than or equal to 100 billion, (0 allowed)'

/**
 * A single WLC cost field schema (required variant).
 * Accepts an integer >= 0 up to and including 100 billion.
 */
const requiredCostField = Joi.string()
  .trim()
  .empty('')
  .required()
  .custom(validateWlcCostString)
  .messages({
    'string.base': WLC_MESSAGE,
    'string.pattern.base': WLC_MESSAGE,
    'string.max': WLC_MESSAGE,
    'any.required': WLC_MESSAGE
  })

/**
 * A single WLC cost field schema (optional variant for ELO/HCR).
 * Accepts an integer >= 0 up to and including 100 billion, or blank/null.
 */
const optionalCostField = Joi.string()
  .trim()
  .allow(null, '')
  .optional()
  .custom((value, helpers) => {
    if (value === null || value === undefined || value === '') {
      return value
    }
    return validateWlcCostString(value, helpers)
  })
  .messages({
    'string.base': WLC_MESSAGE,
    'string.pattern.base': WLC_MESSAGE,
    'string.max': WLC_MESSAGE
  })

const buildSchema = (fieldSchema) =>
  Joi.object(
    Object.fromEntries(WLC_FIELDS.map((field) => [field, fieldSchema]))
  ).options({ allowUnknown: true })

/**
 * Schema used for mandatory project types: DEF, REF, REP.
 * All four WLC cost fields are required.
 */
export const wlcRequiredSchema = buildSchema(requiredCostField)

/**
 * Schema used for optional project types: ELO, HCR.
 * All four WLC cost fields are optional.
 */
export const wlcOptionalSchema = buildSchema(optionalCostField)

/**
 * Project types for which WLC is mandatory.
 */
export const WLC_MANDATORY_PROJECT_TYPES = [
  PROJECT_TYPES.DEF,
  PROJECT_TYPES.REF,
  PROJECT_TYPES.REP
]

/**
 * Project types for which WLC is optional.
 */
export const WLC_OPTIONAL_PROJECT_TYPES = [PROJECT_TYPES.ELO, PROJECT_TYPES.HCR]

/**
 * Project types for which WLC is hidden (skip to overview).
 */
export const WLC_HIDDEN_PROJECT_TYPES = [PROJECT_TYPES.STR, PROJECT_TYPES.STU]

/**
 * Returns the appropriate WLC schema for the given project type,
 * or null if WLC is hidden for this project type.
 * @param {string} projectType
 * @returns {import('joi').ObjectSchema|null}
 */
export function getWlcSchemaForProjectType(projectType) {
  if (WLC_MANDATORY_PROJECT_TYPES.includes(projectType)) {
    return wlcRequiredSchema
  }
  if (WLC_OPTIONAL_PROJECT_TYPES.includes(projectType)) {
    return wlcOptionalSchema
  }
  return null
}
