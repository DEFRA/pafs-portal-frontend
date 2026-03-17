import Joi from 'joi'
import { SIZE, VALIDATION_PATTERNS } from '../../constants/common.js'
import {
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES,
  PROJECT_VALIDATION_MESSAGES
} from '../../constants/projects.js'

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
  .replace(/\s+/g, ' ')
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
