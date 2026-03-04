import { describe, test, expect } from 'vitest'
import { nfmLeakyBarriersSchema } from './leaky-barriers-schema.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

describe('NFM Leaky Barriers Schema', () => {
  const {
    NFM_LEAKY_BARRIERS_VOLUME,
    NFM_LEAKY_BARRIERS_LENGTH,
    NFM_LEAKY_BARRIERS_WIDTH
  } = PROJECT_PAYLOAD_FIELDS

  describe('Volume field validation', () => {
    test('should allow optional volume value', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow empty string for volume', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: '',
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate valid volume value', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: 100.5,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate volume with 2 decimal places', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: 100.99,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should reject negative volume', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: -50,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeDefined()
    })

    test('should reject zero volume', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: 0,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Length field validation', () => {
    test('should validate valid length value', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5.5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate length with 2 decimal places', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5.99,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeUndefined()
    })

    test('should reject negative length', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: -5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeDefined()
    })

    test('should reject zero length', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 0,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeDefined()
    })

    test('should reject missing length', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain('length')
    })

    test('should reject non-numeric length', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 'not a number',
        [NFM_LEAKY_BARRIERS_WIDTH]: 2
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Width field validation', () => {
    test('should validate valid width value', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2.5
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate width with 2 decimal places', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2.99
      })
      expect(result.error).toBeUndefined()
    })

    test('should reject negative width', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: -2
      })
      expect(result.error).toBeDefined()
    })

    test('should reject zero width', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 0
      })
      expect(result.error).toBeDefined()
    })

    test('should reject missing width', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5
      })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain('width')
    })

    test('should reject non-numeric width', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 'not a number'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Combined validation', () => {
    test('should validate all required fields present', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5.5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2.5
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate all fields with valid values including optional volume', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: 100.5,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5.5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2.5
      })
      expect(result.error).toBeUndefined()
    })
  })

  describe('Unknown fields', () => {
    test('should allow unknown fields like crumb', () => {
      const result = nfmLeakyBarriersSchema.validate({
        [NFM_LEAKY_BARRIERS_VOLUME]: null,
        [NFM_LEAKY_BARRIERS_LENGTH]: 5,
        [NFM_LEAKY_BARRIERS_WIDTH]: 2,
        crumb: 'test-csrf-token',
        extraField: 'should be ignored'
      })
      expect(result.error).toBeUndefined()
    })
  })
})
