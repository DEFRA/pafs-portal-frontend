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

const ERR_PRECISION = 'number.precision'
const ERR_WHOLE_NUMBER_PRECISION = 'number.integer.max'
const ERR_BASE = 'number.base'

/**
 * Maximum digits allowed for whole-number values — matches Decimal(20,2) DB column
 */
const MAX_WHOLE_NUMBER_DIGITS = 18

/**
 * Maximum digits allowed before the decimal point for decimal values
 * (leaves 2 digits for the fractional part within Decimal(20,2))
 */
const MAX_INTEGER_PART_DIGITS = 16

/**
 * Number schema for environmental benefits quantity fields
 * - Whole numbers (no decimal): up to 18 digits — matches Decimal(20,2) DB column
 * - Decimal numbers: up to 16 digits before decimal, up to 2 digits after
 * - Accepts string inputs to avoid JS precision issues for large numbers
 */
const quantitySchema = Joi.string()
  .trim()
  .custom((value, helpers) => {
    // Check basic format first
    if (!/^\d+(?:\.\d+)?$/.test(value)) {
      return helpers.error(ERR_BASE)
    }

    const [integerPart, decimalPart] = value.split('.')

    if (decimalPart === undefined) {
      // Whole number: max 18 digits
      if (integerPart.length > MAX_WHOLE_NUMBER_DIGITS) {
        return helpers.error(ERR_WHOLE_NUMBER_PRECISION)
      }
    } else if (
      integerPart.length > MAX_INTEGER_PART_DIGITS ||
      decimalPart.length > 2
    ) {
      // Decimal number: max 16 digits before decimal, max 2 after
      return helpers.error(ERR_PRECISION)
    } else {
      // Decimal is within precision limits — no error
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
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION,
    'number.integer.max':
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_WHOLE_NUMBER_PRECISION
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
