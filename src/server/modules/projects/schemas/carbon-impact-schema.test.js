import { describe, expect, test } from 'vitest'
import {
  carbonImpactSchema,
  getCarbonImpactSchemaForProjectType,
  CARBON_HIDDEN_PROJECT_TYPES,
  ALL_CARBON_FIELDS
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
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '999999999999999999.99'
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
        'Enter a valid number (up to 2 decimal places for tCO₂ fields, whole numbers for £ fields)'
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
        'Enter a valid number (up to 2 decimal places for tCO₂ fields, whole numbers for £ fields)'
      )
    })

    test('rejects decimal values exceeding 18 integer digits', () => {
      const payload = {
        ...validPayload,
        [PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD]: '1234567890123456789.00'
      }

      const { error } = carbonImpactSchema.validate(payload, {
        abortEarly: false
      })
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        'You have exceeded the maximum number of digits allowed. Please re-enter.'
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
        'Enter a valid number (up to 2 decimal places for tCO₂ fields, whole numbers for £ fields)'
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
        'You have exceeded the maximum number of digits allowed. Please re-enter.'
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
      expect(error.details[0].message).toBe('Please enter the value')
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
        'Enter a valid number (up to 2 decimal places for tCO₂ fields, whole numbers for £ fields)'
      )
    })
  })
})
