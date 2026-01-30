import { describe, test, expect } from 'vitest'
import {
  organisationNameSchema,
  organisationIdentifierSchema,
  areaTypeSchema,
  dateComponentSchema
} from './organisation.js'
import { AREAS_RESPONSIBILITIES_MAP } from '../constants/common.js'

describe('Organisation Schemas', () => {
  describe('organisationNameSchema', () => {
    test('validates valid organisation name', () => {
      const result = organisationNameSchema.validate('Test Authority')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('Test Authority')
    })

    test('trims whitespace', () => {
      const result = organisationNameSchema.validate('  Test Authority  ')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('Test Authority')
    })

    test('rejects empty name', () => {
      const result = organisationNameSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('NAME_REQUIRED')
    })

    test('rejects name with only whitespace', () => {
      const result = organisationNameSchema.validate('   ')
      expect(result.error).toBeDefined()
      // After trim, becomes empty which triggers NAME_REQUIRED
      expect(result.error.message).toContain('NAME_REQUIRED')
    })

    test('rejects name longer than 255 characters', () => {
      const longName = 'a'.repeat(256)
      const result = organisationNameSchema.validate(longName)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('NAME_TOO_LONG')
    })

    test('accepts name with exactly 255 characters', () => {
      const maxName = 'a'.repeat(255)
      const result = organisationNameSchema.validate(maxName)
      expect(result.error).toBeUndefined()
    })

    test('accepts name with minimum 1 character', () => {
      const result = organisationNameSchema.validate('A')
      expect(result.error).toBeUndefined()
    })
  })

  describe('organisationIdentifierSchema', () => {
    test('validates valid identifier', () => {
      const result = organisationIdentifierSchema.validate('AUTH001')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('AUTH001')
    })

    test('trims whitespace', () => {
      const result = organisationIdentifierSchema.validate('  AUTH001  ')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('AUTH001')
    })

    test('allows undefined identifier', () => {
      const result = organisationIdentifierSchema.validate(undefined)
      expect(result.error).toBeUndefined()
    })

    test('rejects identifier longer than 100 characters', () => {
      const longId = 'a'.repeat(101)
      const result = organisationIdentifierSchema.validate(longId)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('IDENTIFIER_TOO_LONG')
    })

    test('accepts identifier with exactly 100 characters', () => {
      const maxId = 'a'.repeat(100)
      const result = organisationIdentifierSchema.validate(maxId)
      expect(result.error).toBeUndefined()
    })
  })

  describe('areaTypeSchema', () => {
    test('validates Authority type', () => {
      const result = areaTypeSchema.validate(
        AREAS_RESPONSIBILITIES_MAP.AUTHORITY
      )
      expect(result.error).toBeUndefined()
    })

    test('validates PSO Area type', () => {
      const result = areaTypeSchema.validate(AREAS_RESPONSIBILITIES_MAP.PSO)
      expect(result.error).toBeUndefined()
    })

    test('validates RMA type', () => {
      const result = areaTypeSchema.validate(AREAS_RESPONSIBILITIES_MAP.RMA)
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = areaTypeSchema.validate('  Authority  ')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('Authority')
    })

    test('rejects invalid type', () => {
      const result = areaTypeSchema.validate('InvalidType')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('TYPE_INVALID')
    })

    test('rejects empty type', () => {
      const result = areaTypeSchema.validate('')
      expect(result.error).toBeDefined()
      // Empty string after trim triggers TYPE_INVALID (not in valid list)
      expect(result.error.message).toContain('TYPE_INVALID')
    })

    test('rejects undefined type', () => {
      const result = areaTypeSchema.validate(undefined)
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain('TYPE_REQUIRED')
    })
  })

  describe('dateComponentSchema', () => {
    test('validates complete valid date', () => {
      const date = { day: '15', month: '3', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('validates empty date (all fields empty)', () => {
      const date = { day: '', month: '', year: '' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('validates undefined date', () => {
      const result = dateComponentSchema.validate(undefined)
      expect(result.error).toBeUndefined()
    })

    test('rejects incomplete date (missing day)', () => {
      const date = { day: '', month: '3', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects incomplete date (missing month)', () => {
      const date = { day: '15', month: '', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects incomplete date (missing year)', () => {
      const date = { day: '15', month: '3', year: '' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects invalid month (0)', () => {
      const date = { day: '15', month: '0', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects invalid month (13)', () => {
      const date = { day: '15', month: '13', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects invalid day (0)', () => {
      const date = { day: '0', month: '3', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects invalid day (32)', () => {
      const date = { day: '32', month: '3', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects invalid year (too early)', () => {
      const date = { day: '15', month: '3', year: '1999' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects invalid year (too late)', () => {
      const date = { day: '15', month: '3', year: '2101' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('accepts year 2000', () => {
      const date = { day: '15', month: '3', year: '2000' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('accepts year 2100', () => {
      const date = { day: '15', month: '3', year: '2100' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('rejects February 30', () => {
      const date = { day: '30', month: '2', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects February 29 in non-leap year', () => {
      const date = { day: '29', month: '2', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('accepts February 29 in leap year', () => {
      const date = { day: '29', month: '2', year: '2024' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('rejects April 31 (month with 30 days)', () => {
      const date = { day: '31', month: '4', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('accepts April 30', () => {
      const date = { day: '30', month: '4', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('accepts December 31', () => {
      const date = { day: '31', month: '12', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })

    test('rejects non-numeric day', () => {
      const date = { day: 'abc', month: '3', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects non-numeric month', () => {
      const date = { day: '15', month: 'abc', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('rejects non-numeric year', () => {
      const date = { day: '15', month: '3', year: 'abcd' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('DATE_INVALID')
    })

    test('handles single digit day and month', () => {
      const date = { day: '5', month: '3', year: '2025' }
      const result = dateComponentSchema.validate(date)
      expect(result.error).toBeUndefined()
    })
  })
})
