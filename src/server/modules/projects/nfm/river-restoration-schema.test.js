import { describe, test, expect } from 'vitest'
import { nfmRiverRestorationSchema } from './river-restoration-schema.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

describe('NFM River Restoration Schema', () => {
  const { NFM_RIVER_RESTORATION_AREA, NFM_RIVER_RESTORATION_VOLUME } =
    PROJECT_PAYLOAD_FIELDS

  describe('Area field validation', () => {
    test('should validate valid area value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10.5,
        [NFM_RIVER_RESTORATION_VOLUME]: null,
        crumb: 'test'
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate area with 2 decimal places', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10.55,
        [NFM_RIVER_RESTORATION_VOLUME]: null,
        crumb: 'test'
      })
      expect(result.error).toBeUndefined()
    })

    test('should reject negative area value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: -5,
        [NFM_RIVER_RESTORATION_VOLUME]: null
      })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain('positive')
    })

    test('should reject zero area value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 0,
        [NFM_RIVER_RESTORATION_VOLUME]: null
      })
      expect(result.error).toBeDefined()
    })

    test('should reject missing area value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_VOLUME]: null
      })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toContain('area')
    })

    test('should reject non-numeric area value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 'not a number',
        [NFM_RIVER_RESTORATION_VOLUME]: null
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Volume field validation', () => {
    test('should allow optional volume value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: null
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow empty string for volume', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: ''
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate valid volume value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: 500.25
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate volume with 2 decimal places', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: 500.99
      })
      expect(result.error).toBeUndefined()
    })

    test('should reject negative volume value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: -50
      })
      expect(result.error).toBeDefined()
    })

    test('should reject zero volume value', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: 0
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Unknown fields', () => {
    test('should allow unknown fields like crumb', () => {
      const result = nfmRiverRestorationSchema.validate({
        [NFM_RIVER_RESTORATION_AREA]: 10,
        [NFM_RIVER_RESTORATION_VOLUME]: null,
        crumb: 'test-csrf-token',
        extraField: 'should be ignored'
      })
      expect(result.error).toBeUndefined()
    })
  })
})
