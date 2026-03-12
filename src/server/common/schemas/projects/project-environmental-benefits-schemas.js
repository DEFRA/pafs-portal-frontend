import Joi from 'joi'
import { PROJECT_VALIDATION_MESSAGES } from '../../constants/projects.js'

/**
 * Environmental Benefits Schemas
 * Validation schemas for environmental benefits gate (yes/no) and quantity fields
 */

/**
 * Boolean schema for environmental benefits gate fields
 * Used for yes/no questions about habitat types
 */
const booleanSchema = Joi.boolean().required().messages({
  'any.required': PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_REQUIRED,
  'boolean.base': PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_INVALID
})

/**
 * Number schema for environmental benefits quantity fields
 * - Minimum value: 0.01
 * - Maximum 2 decimal places
 * - No automatic rounding (strict validation)
 */
const quantitySchema = Joi.number()
  .min(0.01)
  .precision(2)
  .required()
  .strict()
  .prefs({ convert: false })
  .messages({
    'any.required':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_REQUIRED,
    'number.base':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID,
    'number.min':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_MIN,
    'number.precision':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION
  })

// Main environmental benefits gate
export const environmentalBenefitsSchema = booleanSchema

// Intertidal habitat
export const intertidalHabitatSchema = booleanSchema
export const hectaresOfIntertidalHabitatCreatedOrEnhancedSchema = quantitySchema

// Woodland
export const woodlandSchema = booleanSchema
export const hectaresOfWoodlandHabitatCreatedOrEnhancedSchema = quantitySchema

// Wet woodland
export const wetWoodlandSchema = booleanSchema
export const hectaresOfWetWoodlandHabitatCreatedOrEnhancedSchema =
  quantitySchema

// Wetland or wet grassland
export const wetlandOrWetGrasslandSchema = booleanSchema
export const hectaresOfWetlandOrWetGrasslandCreatedOrEnhancedSchema =
  quantitySchema

// Grassland
export const grasslandSchema = booleanSchema
export const hectaresOfGrasslandHabitatCreatedOrEnhancedSchema = quantitySchema

// Heathland
export const heathlandSchema = booleanSchema
export const hectaresOfHeathlandCreatedOrEnhancedSchema = quantitySchema

// Ponds and lakes
export const pondsLakesSchema = booleanSchema
export const hectaresOfPondOrLakeHabitatCreatedOrEnhancedSchema = quantitySchema

// Arable land
export const arableLandSchema = booleanSchema
export const hectaresOfArableLandLakeHabitatCreatedOrEnhancedSchema =
  quantitySchema

// Comprehensive restoration
export const comprehensiveRestorationSchema = booleanSchema
export const kilometresOfWatercourseEnhancedOrCreatedComprehensiveSchema =
  quantitySchema

// Partial restoration
export const partialRestorationSchema = booleanSchema
export const kilometresOfWatercourseEnhancedOrCreatedPartialSchema =
  quantitySchema

// Create habitat watercourse
export const createHabitatWatercourseSchema = booleanSchema
export const kilometresOfWatercourseEnhancedOrCreatedSingleSchema =
  quantitySchema
