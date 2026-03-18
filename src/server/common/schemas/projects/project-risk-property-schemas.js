import Joi from 'joi'
import { SIZE } from '../../constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_RISK_TYPES,
  PROJECT_VALIDATION_MESSAGES,
  FLOOD_RISK_LEVELS,
  COASTAL_EROSION_RISK_LEVELS
} from '../../constants/projects.js'

/**
 * Risks schema - array of selected risk types
 * At least one risk must be selected
 */
export const risksSchema = Joi.array()
  .items(Joi.string().valid(...Object.values(PROJECT_RISK_TYPES)))
  .min(SIZE.LENGTH_1)
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.RISKS)
  .messages({
    'array.min': PROJECT_VALIDATION_MESSAGES.RISKS_REQUIRED,
    'any.required': PROJECT_VALIDATION_MESSAGES.RISKS_REQUIRED,
    'any.only': PROJECT_VALIDATION_MESSAGES.RISKS_INVALID
  })

/**
 * Main risk schema - single selected main risk
 * Must be one of the risks selected in the risks array
 */
export const mainRiskSchema = Joi.string()
  .valid(...Object.values(PROJECT_RISK_TYPES))
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.MAIN_RISK)
  .messages({
    'string.empty': PROJECT_VALIDATION_MESSAGES.MAIN_RISK_REQUIRED,
    'any.required': PROJECT_VALIDATION_MESSAGES.MAIN_RISK_REQUIRED,
    'any.only': PROJECT_VALIDATION_MESSAGES.MAIN_RISK_INVALID
  })

/**
 * Property value schema - non-negative integer or empty string
 */
const propertyValueSchema = Joi.alternatives()
  .try(Joi.number().integer().min(0), Joi.string().allow('').pattern(/^\d*$/))
  .optional()
  .label('Property Value')
  .messages({
    'number.min': PROJECT_VALIDATION_MESSAGES.PROPERTY_VALUE_INVALID,
    'number.integer': PROJECT_VALIDATION_MESSAGES.PROPERTY_VALUE_INVALID,
    'string.pattern.base': PROJECT_VALIDATION_MESSAGES.PROPERTY_VALUE_INVALID
  })

/**
 * No properties at risk checkbox schema
 */
export const noPropertiesAtRiskSchema = Joi.alternatives()
  .try(Joi.boolean(), Joi.string().valid('true', 'false'))
  .optional()
  .label(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK)

/**
 * Property affected flooding schemas
 */
export const maintainingExistingAssetsSchema = propertyValueSchema.label(
  PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS
)

export const reducingFloodRisk50PlusSchema = propertyValueSchema.label(
  PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS
)

export const reducingFloodRiskLess50Schema = propertyValueSchema.label(
  PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50
)

export const increasingFloodResilienceSchema = propertyValueSchema.label(
  PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE
)

/**
 * Property affected coastal erosion schemas
 */
export const noPropertiesAtCoastalErosionRiskSchema = Joi.alternatives()
  .try(Joi.boolean(), Joi.string().valid('true', 'false'))
  .optional()
  .label(PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK)

export const propertiesBenefitMaintainingAssetsCoastalSchema =
  propertyValueSchema.label(
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL
  )

export const propertiesBenefitInvestmentCoastalErosionSchema =
  propertyValueSchema.label(
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION
  )

/**
 * Percentage schema - accepts 0-100 with up to 2 decimal places
 * Can be number or string representation
 * No negatives, no values above 100, numbers only (no text or symbols)
 */

const percentageSchemaRequired = (errorMessages) =>
  Joi.string()
    .pattern(/^(?:100(?:\.0{1,2})?|[1-9]?\d(?:\.\d{1,2})?)$/)
    .required()
    .label('Percentage')
    .messages(errorMessages)

/**
 * Percent properties in 20% most deprived areas schema
 */
export const percentProperties20PercentDeprivedSchema =
  percentageSchemaRequired({
    'string.pattern.base':
      PROJECT_VALIDATION_MESSAGES.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED_INVALID,
    'any.required':
      PROJECT_VALIDATION_MESSAGES.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED_REQUIRED,
    'string.empty':
      PROJECT_VALIDATION_MESSAGES.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED_REQUIRED
  }).label(PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED)

/**
 * Percent properties in 40% most deprived areas schema
 */
export const percentProperties40PercentDeprivedSchema =
  percentageSchemaRequired({
    'string.pattern.base':
      PROJECT_VALIDATION_MESSAGES.PERCENT_PROPERTIES_40_PERCENT_DEPRIVED_INVALID,
    'any.required':
      PROJECT_VALIDATION_MESSAGES.PERCENT_PROPERTIES_40_PERCENT_DEPRIVED_REQUIRED,
    'string.empty':
      PROJECT_VALIDATION_MESSAGES.PERCENT_PROPERTIES_40_PERCENT_DEPRIVED_REQUIRED
  }).label(PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_40_PERCENT_DEPRIVED)

/**
 * Current flood risk schema (for fluvial, tidal, sea flooding)
 * Valid values: high, medium, low, very_low
 */
export const currentFloodFluvialRiskSchema = Joi.string()
  .valid(...Object.values(FLOOD_RISK_LEVELS))
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.CURRENT_FLOOD_FLUVIAL_RISK)
  .messages({
    'any.required':
      PROJECT_VALIDATION_MESSAGES.CURRENT_FLOOD_FLUVIAL_RISK_REQUIRED,
    'any.only': PROJECT_VALIDATION_MESSAGES.CURRENT_FLOOD_FLUVIAL_RISK_INVALID
  })

/**
 * Current flood surface water risk schema
 * Valid values: high, medium, low, very_low
 */
export const currentFloodSurfaceWaterRiskSchema = Joi.string()
  .valid(...Object.values(FLOOD_RISK_LEVELS))
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.CURRENT_FLOOD_SURFACE_WATER_RISK)
  .messages({
    'any.required':
      PROJECT_VALIDATION_MESSAGES.CURRENT_FLOOD_SURFACE_WATER_RISK_REQUIRED,
    'any.only':
      PROJECT_VALIDATION_MESSAGES.CURRENT_FLOOD_SURFACE_WATER_RISK_INVALID
  })

/**
 * Current coastal erosion risk schema
 * Valid values: medium_term, longer_term
 */
export const currentCoastalErosionRiskSchema = Joi.string()
  .valid(...Object.values(COASTAL_EROSION_RISK_LEVELS))
  .required()
  .label(PROJECT_PAYLOAD_FIELDS.CURRENT_COASTAL_EROSION_RISK)
  .messages({
    'any.required':
      PROJECT_VALIDATION_MESSAGES.CURRENT_COASTAL_EROSION_RISK_REQUIRED,
    'any.only': PROJECT_VALIDATION_MESSAGES.CURRENT_COASTAL_EROSION_RISK_INVALID
  })
