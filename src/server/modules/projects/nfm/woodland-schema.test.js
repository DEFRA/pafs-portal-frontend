import { describe, test, expect } from 'vitest'
import { nfmWoodlandSchema } from './woodland-schema.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

describe('NFM Woodland Schema', () => {
  describe('Area field validation', () => {
    test('should validate valid area value', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 5.5
      })
      expect(result.error).toBeUndefined()
      expect(result.value[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]).toBe(5.5)
    })

    test('should validate area with 2 decimal places', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 5.25
      })
      expect(result.error).toBeUndefined()
    })

    test('should reject negative area', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: -5
      })
      expect(result.error).toBeDefined()
    })

    test('should reject zero area', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 0
      })
      expect(result.error).toBeDefined()
    })

    test('should reject missing area', () => {
      const result = nfmWoodlandSchema.validate({})
      expect(result.error).toBeDefined()
    })

    test('should reject non-numeric area', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 'not a number'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Complete form validation', () => {
    test('should validate all required fields present', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 10.5
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow unknown fields like crumb', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 10.5,
        crumb: 'test-token'
      })
      expect(result.error).toBeUndefined()
    })

    test('should allow empty crumb', () => {
      const result = nfmWoodlandSchema.validate({
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 10.5,
        crumb: ''
      })
      expect(result.error).toBeUndefined()
    })
  })
})
