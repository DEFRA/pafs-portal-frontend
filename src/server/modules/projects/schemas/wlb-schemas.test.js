import { describe, expect, it } from 'vitest'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES,
  PROJECT_VALIDATION_MESSAGES,
  WLB_MANDATORY_PROJECT_TYPES,
  WLB_OPTIONAL_PROJECT_TYPES,
  WLB_HIDDEN_PROJECT_TYPES
} from '../../../common/constants/projects.js'
import {
  getWlbSchemaForProjectType,
  wlbRequiredSchema,
  wlbOptionalSchema
} from './wlb-schemas.js'

const validWlbPayload = {
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '123',
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '456',
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: '789',
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]: '10',
  [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: '11'
}

describe('wlb-schemas', () => {
  describe('exported project type groups', () => {
    it('should expose mandatory project types', () => {
      expect(WLB_MANDATORY_PROJECT_TYPES).toEqual([
        PROJECT_TYPES.DEF,
        PROJECT_TYPES.REF,
        PROJECT_TYPES.REP
      ])
    })

    it('should expose optional project types', () => {
      expect(WLB_OPTIONAL_PROJECT_TYPES).toEqual([
        PROJECT_TYPES.ELO,
        PROJECT_TYPES.HCR
      ])
    })

    it('should expose hidden project types', () => {
      expect(WLB_HIDDEN_PROJECT_TYPES).toEqual([
        PROJECT_TYPES.STR,
        PROJECT_TYPES.STU
      ])
    })
  })

  describe('wlbRequiredSchema', () => {
    it('should validate when first field is present and valid', () => {
      const { error, value } = wlbRequiredSchema.validate(validWlbPayload)
      expect(error).toBeUndefined()
      expect(value).toMatchObject(validWlbPayload)
    })

    it('should fail when first field is missing', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '456'
      }

      const { error } = wlbRequiredSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        PROJECT_VALIDATION_MESSAGES.WLB_FIELD_REQUIRED
      )
    })

    it('should fail when first field is empty string', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: ''
      }

      const { error } = wlbRequiredSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        PROJECT_VALIDATION_MESSAGES.WLB_FIELD_REQUIRED
      )
    })

    it('should fail when first field contains non-digits', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '£12,345'
      }

      const { error } = wlbRequiredSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        PROJECT_VALIDATION_MESSAGES.WLB_FIELD_INVALID
      )
    })

    it('should fail when first field exceeds 18 digits', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]:
          '1234567890123456789'
      }

      const { error } = wlbRequiredSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        PROJECT_VALIDATION_MESSAGES.WLB_FIELD_OVER_MAX_DIGITS
      )
    })

    it('should accept exactly 18 digits', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]:
          '123456789012345678'
      }

      const { error } = wlbRequiredSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should trim first field before validation', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '  123  '
      }

      const { error, value } = wlbRequiredSchema.validate(payload)

      expect(error).toBeUndefined()
      expect(value[PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]).toBe(
        '123'
      )
    })

    it('should allow optional fields to be blank/null', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '123',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: null
      }

      const { error } = wlbRequiredSchema.validate(payload)

      expect(error).toBeUndefined()
    })

    it('should allow unknown fields', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '123',
        anotherField: 'kept'
      }

      const { error, value } = wlbRequiredSchema.validate(payload)

      expect(error).toBeUndefined()
      expect(value.anotherField).toBe('kept')
    })
  })

  describe('wlbOptionalSchema', () => {
    it('should validate an empty payload', () => {
      const { error } = wlbOptionalSchema.validate({})
      expect(error).toBeUndefined()
    })

    it('should allow all fields as empty strings', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: '',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: '',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]: '',
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: ''
      }

      const { error } = wlbOptionalSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('should allow all fields as null', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: null,
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED]: null,
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS]: null,
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS]: null,
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS]: null
      }

      const { error } = wlbOptionalSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('should allow explicit undefined values for optional fields', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: undefined
      }

      const { error } = wlbOptionalSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    it('should fail for decimal values', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '123.45'
      }

      const { error } = wlbOptionalSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        PROJECT_VALIDATION_MESSAGES.WLB_FIELD_INVALID
      )
    })

    it('should fail when value exceeds 18 digits', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]:
          '1234567890123456789'
      }

      const { error } = wlbOptionalSchema.validate(payload)

      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        PROJECT_VALIDATION_MESSAGES.WLB_FIELD_OVER_MAX_DIGITS
      )
    })

    it('should trim valid numeric strings', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]: '  999  '
      }

      const { error, value } = wlbOptionalSchema.validate(payload)

      expect(error).toBeUndefined()
      expect(value[PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS]).toBe(
        '999'
      )
    })

    it('should allow unknown fields', () => {
      const payload = {
        unknown: 'value'
      }

      const { error, value } = wlbOptionalSchema.validate(payload)

      expect(error).toBeUndefined()
      expect(value.unknown).toBe('value')
    })
  })

  describe('getWlbSchemaForProjectType', () => {
    it('should return required schema for DEF', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.DEF)).toBe(
        wlbRequiredSchema
      )
    })

    it('should return required schema for REF', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.REF)).toBe(
        wlbRequiredSchema
      )
    })

    it('should return required schema for REP', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.REP)).toBe(
        wlbRequiredSchema
      )
    })

    it('should return optional schema for ELO', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.ELO)).toBe(
        wlbOptionalSchema
      )
    })

    it('should return optional schema for HCR', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.HCR)).toBe(
        wlbOptionalSchema
      )
    })

    it('should return null for STR', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.STR)).toBeNull()
    })

    it('should return null for STU', () => {
      expect(getWlbSchemaForProjectType(PROJECT_TYPES.STU)).toBeNull()
    })

    it('should return null for unknown type', () => {
      expect(getWlbSchemaForProjectType('UNKNOWN')).toBeNull()
    })

    it('should return null for null/undefined', () => {
      expect(getWlbSchemaForProjectType(null)).toBeNull()
      expect(getWlbSchemaForProjectType(undefined)).toBeNull()
    })
  })
})
