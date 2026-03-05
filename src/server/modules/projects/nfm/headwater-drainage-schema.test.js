import { describe, test, expect } from 'vitest'
import { nfmHeadwaterDrainageSchema } from './headwater-drainage-schema.js'
import { PROJECT_PAYLOAD_FIELDS } from '../../../common/constants/projects.js'

describe('NFM Headwater Drainage Schema', () => {
  describe('Valid payload', () => {
    test('should validate with valid area', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 10.5
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    test('should validate with area having 2 decimal places', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 123.45
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    test('should validate with area having 1 decimal place', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 50.5
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeUndefined()
    })

    test('should validate with whole number area', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 25
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeUndefined()
    })
  })

  describe('Invalid payload', () => {
    test('should reject missing area', () => {
      const payload = {}

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe('Enter the area in hectares')
    })

    test('should reject zero area', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 0
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('positive number')
    })

    test('should reject negative area', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: -10
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('positive number')
    })

    test('should accept area with more than 2 decimal places (Joi rounds)', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 10.567
      }

      const { error, value } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeUndefined()
      // Joi precision() rounds the value to specified decimal places
      expect(value[PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]).toBe(
        10.57
      )
    })

    test('should reject non-numeric area', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 'not a number'
      }

      const { error } = nfmHeadwaterDrainageSchema.validate(payload)
      expect(error).toBeDefined()
      expect(error.details[0].message).toContain('positive number')
    })
  })
})
