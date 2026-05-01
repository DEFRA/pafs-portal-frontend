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

const MAX_DIGITS = 18

const DIGITS_ONLY_REGEX = /^\d+$/

const validateWlcCostString = (value, helpers) => {
  if (!DIGITS_ONLY_REGEX.test(value)) {
    return helpers.error('string.pattern.base')
  }

  if (value.length > MAX_DIGITS) {
    return helpers.error('string.max')
  }

  return value
}

const WLC_MESSAGE = 'Enter a whole number up to 18 digits (0 is allowed)'

/**
 * A single WLC cost field schema (required variant).
 * Accepts an integer >= 0 with at most 18 digits.
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
 * Accepts an integer >= 0 with at most 18 digits, or blank/null.
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
