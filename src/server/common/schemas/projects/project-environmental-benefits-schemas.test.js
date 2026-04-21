import { describe, it, expect } from 'vitest'
import { PROJECT_VALIDATION_MESSAGES } from '../../constants/projects.js'
import {
  environmentalBenefitsSchema,
  intertidalHabitatSchema,
  hectaresOfIntertidalHabitatCreatedOrEnhancedSchema,
  woodlandSchema,
  hectaresOfWoodlandHabitatCreatedOrEnhancedSchema,
  wetWoodlandSchema,
  hectaresOfWetWoodlandHabitatCreatedOrEnhancedSchema,
  wetlandOrWetGrasslandSchema,
  hectaresOfWetlandOrWetGrasslandCreatedOrEnhancedSchema,
  grasslandSchema,
  hectaresOfGrasslandHabitatCreatedOrEnhancedSchema,
  heathlandSchema,
  hectaresOfHeathlandCreatedOrEnhancedSchema,
  pondsLakesSchema,
  hectaresOfPondOrLakeHabitatCreatedOrEnhancedSchema,
  arableLandSchema,
  hectaresOfArableLandLakeHabitatCreatedOrEnhancedSchema,
  comprehensiveRestorationSchema,
  kilometresOfWatercourseEnhancedOrCreatedComprehensiveSchema,
  partialRestorationSchema,
  kilometresOfWatercourseEnhancedOrCreatedPartialSchema,
  createHabitatWatercourseSchema,
  kilometresOfWatercourseEnhancedOrCreatedSingleSchema
} from './project-environmental-benefits-schemas.js'

// ---------------------------------------------------------------------------
// booleanSchema tests — validated through environmentalBenefitsSchema
// All the boolean exports share the same underlying schema
// ---------------------------------------------------------------------------
describe('booleanSchema (via environmentalBenefitsSchema)', () => {
  it('accepts true', () => {
    const { error, value } = environmentalBenefitsSchema.validate(true)
    expect(error).toBeUndefined()
    expect(value).toBe(true)
  })

  it('accepts false', () => {
    const { error, value } = environmentalBenefitsSchema.validate(false)
    expect(error).toBeUndefined()
    expect(value).toBe(false)
  })

  it('returns ENVIRONMENTAL_BENEFITS_REQUIRED when value is missing', () => {
    const { error } = environmentalBenefitsSchema.validate(undefined)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_REQUIRED
    )
  })

  it('returns ENVIRONMENTAL_BENEFITS_INVALID for non-boolean string', () => {
    const { error } = environmentalBenefitsSchema.validate('yes')
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_INVALID
    )
  })

  it('returns ENVIRONMENTAL_BENEFITS_INVALID for a number', () => {
    const { error } = environmentalBenefitsSchema.validate(1)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_INVALID
    )
  })
})

// ---------------------------------------------------------------------------
// quantitySchema tests — validated through a representative quantity schema
// All the quantity exports share the same underlying schema
// ---------------------------------------------------------------------------
describe('quantitySchema (via hectaresOfIntertidalHabitatCreatedOrEnhancedSchema)', () => {
  const schema = hectaresOfIntertidalHabitatCreatedOrEnhancedSchema

  it('accepts a valid whole number string', () => {
    const { error, value } = schema.validate('5')
    expect(error).toBeUndefined()
    expect(value).toBe('5')
  })

  it('accepts a valid decimal string with 1 decimal place', () => {
    const { error, value } = schema.validate('15.5')
    expect(error).toBeUndefined()
    expect(value).toBe('15.5')
  })

  it('accepts a valid decimal string with 2 decimal places', () => {
    const { error, value } = schema.validate('15.75')
    expect(error).toBeUndefined()
    expect(value).toBe('15.75')
  })

  it('accepts 0', () => {
    const { error, value } = schema.validate('0')
    expect(error).toBeUndefined()
    expect(value).toBe('0')
  })

  it('accepts a value with 16 integer digits', () => {
    const { error, value } = schema.validate('1234567890123456')
    expect(error).toBeUndefined()
    expect(value).toBe('1234567890123456')
  })

  it('returns PRECISION error for integer value exceeding MAX_SAFE_INTEGER even within 16 digits', () => {
    // 9999999999999999 has 16 digits but > MAX_SAFE_INTEGER (9007199254740991)
    const { error } = schema.validate('9999999999999999')
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION
    )
  })

  it('returns PRECISION error when more than 16 integer digits', () => {
    const { error } = schema.validate('12345678901234567') // 17 digits
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION
    )
  })

  it('returns PRECISION error when more than 2 decimal places', () => {
    const { error } = schema.validate('1.234')
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_PRECISION
    )
  })

  it('returns INVALID error for non-numeric string', () => {
    const { error } = schema.validate('abc')
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID
    )
  })

  it('returns INVALID error for negative number string', () => {
    const { error } = schema.validate('-1')
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID
    )
  })

  it('returns INVALID error for string with non-digit characters', () => {
    const { error } = schema.validate('1.2.3')
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_INVALID
    )
  })

  it('returns REQUIRED error when value is missing', () => {
    const { error } = schema.validate(undefined)
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      PROJECT_VALIDATION_MESSAGES.ENVIRONMENTAL_BENEFITS_QUANTITY_REQUIRED
    )
  })

  it('returns an error for empty string', () => {
    // Joi.string() treats '' as string.empty (not any.required); error is still raised
    const { error } = schema.validate('')
    expect(error).toBeDefined()
  })

  it('trims whitespace before validating', () => {
    const { error, value } = schema.validate('  10.5  ')
    expect(error).toBeUndefined()
    expect(value).toBe('10.5')
  })
})

// ---------------------------------------------------------------------------
// Smoke tests — all remaining exported schemas exist and accept valid values
// ---------------------------------------------------------------------------
describe('all boolean schema exports', () => {
  const booleanSchemas = [
    ['environmentalBenefitsSchema', environmentalBenefitsSchema],
    ['intertidalHabitatSchema', intertidalHabitatSchema],
    ['woodlandSchema', woodlandSchema],
    ['wetWoodlandSchema', wetWoodlandSchema],
    ['wetlandOrWetGrasslandSchema', wetlandOrWetGrasslandSchema],
    ['grasslandSchema', grasslandSchema],
    ['heathlandSchema', heathlandSchema],
    ['pondsLakesSchema', pondsLakesSchema],
    ['arableLandSchema', arableLandSchema],
    ['comprehensiveRestorationSchema', comprehensiveRestorationSchema],
    ['partialRestorationSchema', partialRestorationSchema],
    ['createHabitatWatercourseSchema', createHabitatWatercourseSchema]
  ]

  it.each(booleanSchemas)('%s accepts true', (_name, schema) => {
    const { error } = schema.validate(true)
    expect(error).toBeUndefined()
  })

  it.each(booleanSchemas)('%s rejects missing value', (_name, schema) => {
    const { error } = schema.validate(undefined)
    expect(error).toBeDefined()
  })
})

describe('all quantity schema exports', () => {
  const quantitySchemas = [
    [
      'hectaresOfIntertidalHabitatCreatedOrEnhancedSchema',
      hectaresOfIntertidalHabitatCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfWoodlandHabitatCreatedOrEnhancedSchema',
      hectaresOfWoodlandHabitatCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfWetWoodlandHabitatCreatedOrEnhancedSchema',
      hectaresOfWetWoodlandHabitatCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfWetlandOrWetGrasslandCreatedOrEnhancedSchema',
      hectaresOfWetlandOrWetGrasslandCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfGrasslandHabitatCreatedOrEnhancedSchema',
      hectaresOfGrasslandHabitatCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfHeathlandCreatedOrEnhancedSchema',
      hectaresOfHeathlandCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfPondOrLakeHabitatCreatedOrEnhancedSchema',
      hectaresOfPondOrLakeHabitatCreatedOrEnhancedSchema
    ],
    [
      'hectaresOfArableLandLakeHabitatCreatedOrEnhancedSchema',
      hectaresOfArableLandLakeHabitatCreatedOrEnhancedSchema
    ],
    [
      'kilometresOfWatercourseEnhancedOrCreatedComprehensiveSchema',
      kilometresOfWatercourseEnhancedOrCreatedComprehensiveSchema
    ],
    [
      'kilometresOfWatercourseEnhancedOrCreatedPartialSchema',
      kilometresOfWatercourseEnhancedOrCreatedPartialSchema
    ],
    [
      'kilometresOfWatercourseEnhancedOrCreatedSingleSchema',
      kilometresOfWatercourseEnhancedOrCreatedSingleSchema
    ]
  ]

  it.each(quantitySchemas)('%s accepts a valid value', (_name, schema) => {
    const { error, value } = schema.validate('12.5')
    expect(error).toBeUndefined()
    expect(value).toBe('12.5')
  })

  it.each(quantitySchemas)('%s rejects missing value', (_name, schema) => {
    const { error } = schema.validate(undefined)
    expect(error).toBeDefined()
  })

  it.each(quantitySchemas)(
    '%s rejects value with > 2 decimal places',
    (_name, schema) => {
      const { error } = schema.validate('1.234')
      expect(error).toBeDefined()
    }
  )
})
