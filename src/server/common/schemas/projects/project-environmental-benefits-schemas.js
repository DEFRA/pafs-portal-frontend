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
 * - Minimum value: 0 (0 allowed as specified in requirements)
 * - Up to 16 digits before decimal, 2 digits after decimal
 * - Accepts both string and number inputs for maximum compatibility
 * - Uses regex pattern validation for large numbers to avoid JS precision issues
 */
const quantitySchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    // Check basic format first
    if (!/^\d+(?:\.\d+)?$/.test(value)) {
      return helpers.error('number.base')
    }

    const [integerPart, decimalPart] = value.split('.')

    // Check 16 digits before decimal constraint
    if (integerPart.length > 16) {
      return helpers.error('number.precision')
    }

    // Check decimal places constraint - must be exactly 1 or 2 digits
    if (decimalPart && decimalPart.length > 2) {
      return helpers.error('number.precision')
    }

    const num = Number.parseFloat(value)
    if (Number.isNaN(num) || num < 0) {
      return helpers.error('number.base')
    }

    // For very large numbers, check if integer part exceeds JavaScript's safe range
    const [integerStr] = value.split('.')
    const integerValue = Number.parseInt(integerStr, 10)
    if (integerValue > Number.MAX_SAFE_INTEGER) {
      return helpers.error('number.precision')
    }

    // Return the original string value to preserve precision for Decimal database fields
    return value
  })
  .required()
  .messages({
    'any.required':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_REQUIRED,
    'number.base':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID,
    'string.pattern.base':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID,
    'number.min':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_MIN,
    'number.max':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION,
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
