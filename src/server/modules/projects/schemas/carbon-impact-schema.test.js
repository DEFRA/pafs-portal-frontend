import { describe, expect, test } from 'vitest'
import {
  carbonImpactSchema,
  getCarbonImpactSchemaForProjectType,
  CARBON_HIDDEN_PROJECT_TYPES,
  ALL_CARBON_FIELDS,
  CARBON_STEP_SCHEMAS
} from './carbon-impact-schema.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'

const validPayload = {
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '123.45',
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '67.89',
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '10.00',
  [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '5.50',
  [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000',
  [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '150000'
}

describe('carbon-impact-schema', () => {
  describe('getCarbonImpactSchemaForProjectType', () => {
    test('returns schema for non-hidden project type', () => {
      expect(getCarbonImpactSchemaForProjectType(PROJECT_TYPES.DEF)).toBe(
        carbonImpactSchema
      )
      expect(getCarbonImpactSchemaForProjectType(PROJECT_TYPES.REF)).toBe(
        carbonImpactSchema
      )
      expect(getCarbonImpactSchemaForProjectType(PROJECT_TYPES.ELO)).toBe(
        carbonImpactSchema
      )
    })

    test('returns null for hidden project type (STR)', () => {
      expect(getCarbonImpactSchemaForProjectType(PROJECT_TYPES.STR)).toBeNull()
    })

    test('returns null for hidden project type (STU)', () => {
      expect(getCarbonImpactSchemaForProjectType(PROJECT_TYPES.STU)).toBeNull()
    })
  })

  describe('CARBON_HIDDEN_PROJECT_TYPES', () => {
    test('contains STR and STU', () => {
      expect(CARBON_HIDDEN_PROJECT_TYPES).toEqual([
        PROJECT_TYPES.STR,
        PROJECT_TYPES.STU
      ])
    })
  })

  describe('ALL_CARBON_FIELDS', () => {
    test('contains all 6 carbon field constants', () => {
      expect(ALL_CARBON_FIELDS).toHaveLength(6)
      expect(ALL_CARBON_FIELDS).toContain(
        PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
      )
      expect(ALL_CARBON_FIELDS).toContain(
        PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION
      )
      expect(ALL_CARBON_FIELDS).toContain(
        PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED
      )
      expect(ALL_CARBON_FIELDS).toContain(
        PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED
      )
      expect(ALL_CARBON_FIELDS).toContain(
        PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
      )
      expect(ALL_CARBON_FIELDS).toContain(
        PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
      )
    })
  })

  describe('carbonImpactSchema', () => {
    test('accepts valid payload with decimal and integer fields', () => {
      const { error } = carbonImpactSchema.validate(validPayload, {
        abortEarly: false
      })
      expect(error).toBeUndefined()
    })

    test('accepts valid decimal values up to 2 decimal places', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '1234567890123456.99'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeUndefined()
    })

    test('accepts whole numbers in decimal fields', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '12345'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeUndefined()
    })

    test('rejects decimal values with more than 2 decimal places', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '123.456'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Please enter a number with up to 16 digits before the decimal and no more than 2 digits after the decimal.'
      )
    })

    test('rejects non-numeric values in decimal fields', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: 'abc'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Please enter a number with up to 16 digits before the decimal and no more than 2 digits after the decimal.'
      )
    })

    test('rejects decimal values exceeding 16 integer digits', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '12345678901234567.00'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Please enter a number with up to 16 digits before the decimal and no more than 2 digits after the decimal.'
      )
    })

    test('rejects non-integer values in integer fields', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '12.5'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Please enter a whole number with no more than 18 digits.'
      )
    })

    test('rejects integer values exceeding 18 digits', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
          '1234567890123456789'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Please enter a whole number with no more than 18 digits.'
      )
    })

    test('requires carbonOperationalCostForecast', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: ''
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'You must enter a value. If there is no operation or maintenance element enter 0. Otherwise enter an estimate above 0.'
      )
    })

    test('allows empty and null optional tCO₂ fields', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '',
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: null,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '',
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: null,
        [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '',
        [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '100'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeUndefined()
    })

    test('allows unknown properties', () => {
      const payload = {
        ...validPayload,
        extraField: 'keep-me'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeUndefined()
    })

    test('trims whitespace from values', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '  123.45  '
      }

      const { value } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(value[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]).toBe('123.45')
    })

    test('rejects currency symbols in integer fields', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '£1000'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'Please enter a whole number with no more than 18 digits.'
      )
    })
  })

  describe('CARBON_STEP_SCHEMAS', () => {
    describe('CARBON_COST_BUILD per-step schema', () => {
      test('accepts a valid positive decimal value', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '123.45' })
        expect(error).toBeUndefined()
      })

      test('accepts an empty string (optional field)', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '' })
        expect(error).toBeUndefined()
      })

      test('accepts null (optional field)', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: null })
        expect(error).toBeUndefined()
      })

      test('rejects negative values with specific negative error', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '-10.00' })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'The value entered can not be negative'
        )
      })

      test('rejects non-numeric values with invalid error', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: 'abc' })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'Please enter a number with up to 16 digits before the decimal and no more than 2 digits after the decimal.'
        )
      })

      test('allows unknown fields (e.g. crumb token)', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '10',
          crumb: 'some-crumb-token'
        })
        expect(error).toBeUndefined()
      })
    })

    describe('CARBON_COST_OPERATION per-step schema', () => {
      test('accepts a valid positive decimal value', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '50.00'
        })
        expect(error).toBeUndefined()
      })

      test('rejects negative values', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '-5' })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'The value entered can not be negative'
        )
      })

      test('accepts empty string', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION]: '' })
        expect(error).toBeUndefined()
      })
    })

    describe('CARBON_COST_SEQUESTERED per-step schema', () => {
      test('accepts a valid positive decimal value', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '10.5'
        })
        expect(error).toBeUndefined()
      })

      test('rejects negative values', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED]: '-0.01'
        })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'The value entered can not be negative'
        )
      })
    })

    describe('CARBON_COST_AVOIDED per-step schema', () => {
      test('accepts a valid positive decimal value', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '5' })
        expect(error).toBeUndefined()
      })

      test('rejects negative values', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '-100' })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'The value entered can not be negative'
        )
      })

      test('accepts empty string', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED
        ].validate({ [PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED]: '' })
        expect(error).toBeUndefined()
      })
    })

    describe('CARBON_SAVINGS_NET_ECONOMIC_BENEFIT per-step schema', () => {
      test('accepts a valid integer value', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '200000'
        })
        expect(error).toBeUndefined()
      })

      test('accepts empty string (optional field)', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: ''
        })
        expect(error).toBeUndefined()
      })

      test('rejects decimal values', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: '100.5'
        })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'Please enter a whole number with no more than 18 digits.'
        )
      })
    })

    describe('CARBON_OPERATIONAL_COST_FORECAST per-step schema', () => {
      test('accepts a valid integer value', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '150000'
        })
        expect(error).toBeUndefined()
      })

      test('rejects empty string (required field)', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: ''
        })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'You must enter a value. If there is no operation or maintenance element enter 0. Otherwise enter an estimate above 0.'
        )
      })

      test('rejects decimal values', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: '123.45'
        })
        expect(error).toBeDefined()
        expect(error.details[0].message).toBe(
          'Please enter a whole number with no more than 18 digits.'
        )
      })

      test('rejects non-numeric values', () => {
        const { error } = CARBON_STEP_SCHEMAS[
          PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST
        ].validate({
          [PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]: 'abc'
        })
        expect(error).toBeDefined()
      })
    })
  })
})
