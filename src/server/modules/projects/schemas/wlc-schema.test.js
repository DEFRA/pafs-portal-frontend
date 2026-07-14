import { describe, expect, test } from 'vitest'
import {
  getWlcSchemaForProjectType,
  wlcOptionalSchema,
  wlcRequiredSchema
} from './wlc-schema.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_TYPES
} from '../../../common/constants/projects.js'

const validPayload = {
  [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '123456',
  [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS]: '234567',
  [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_RISK_CONTINGENCY_COSTS]: '345678',
  [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS]: '456789'
}

describe('wlc-schema', () => {
  test('returns required schema for mandatory project type', () => {
    expect(getWlcSchemaForProjectType(PROJECT_TYPES.DEF)).toBe(
      wlcRequiredSchema
    )
    expect(getWlcSchemaForProjectType(PROJECT_TYPES.REF)).toBe(
      wlcRequiredSchema
    )
  })

  test('returns optional schema for optional project type', () => {
    expect(getWlcSchemaForProjectType(PROJECT_TYPES.ELO)).toBe(
      wlcOptionalSchema
    )
    expect(getWlcSchemaForProjectType(PROJECT_TYPES.HCR)).toBe(
      wlcOptionalSchema
    )
  })

  test('returns null for hidden project type', () => {
    expect(getWlcSchemaForProjectType(PROJECT_TYPES.STR)).toBeNull()
    expect(getWlcSchemaForProjectType(PROJECT_TYPES.STU)).toBeNull()
  })

  test('required schema accepts values up to and including 100 billion', () => {
    const payload = {
      ...validPayload,
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '100000000000'
    }

    const { error } = wlcRequiredSchema.validate(payload, { abortEarly: false })
    expect(error).toBeUndefined()
  })

  test('required schema rejects non-digit values with invalid message', () => {
    const payload = {
      ...validPayload,
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '12.5'
    }

    const { error } = wlcRequiredSchema.validate(payload, { abortEarly: false })
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'Please enter a whole number less than or equal to 100 billion (0 allowed)'
    )
  })

  test('required schema rejects values greater than 100 billion', () => {
    const payload = {
      ...validPayload,
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '100000000001'
    }

    const { error } = wlcRequiredSchema.validate(payload, { abortEarly: false })
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'Please enter a whole number less than or equal to 100 billion (0 allowed)'
    )
  })

  test('required schema rejects empty values with required message', () => {
    const payload = {
      ...validPayload,
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: ''
    }

    const { error } = wlcRequiredSchema.validate(payload, { abortEarly: false })
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'Please enter a whole number less than or equal to 100 billion (0 allowed)'
    )
  })

  test('optional schema allows empty and null values', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS]: '',
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS]: null,
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_RISK_CONTINGENCY_COSTS]: '',
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS]: null
    }

    const { error } = wlcOptionalSchema.validate(payload, { abortEarly: false })
    expect(error).toBeUndefined()
  })

  test('optional schema rejects invalid non-digit input', () => {
    const payload = {
      ...validPayload,
      [PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS]: '£1000'
    }

    const { error } = wlcOptionalSchema.validate(payload, { abortEarly: false })
    expect(error).toBeDefined()
    expect(error.details[0].message).toBe(
      'Please enter a whole number less than or equal to 100 billion (0 allowed)'
    )
  })

  test('schemas allow unknown properties', () => {
    const payload = {
      ...validPayload,
      extraField: 'keep-me'
    }

    const { error } = wlcRequiredSchema.validate(payload, { abortEarly: false })
    expect(error).toBeUndefined()
  })
})
