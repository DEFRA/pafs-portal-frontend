import { describe, test, expect } from 'vitest'
import { nfmSelectedMeasuresSchema } from './schema.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  NFM_MEASURES
} from '../../../common/constants/projects.js'

describe('NFM Selected Measures Schema', () => {
  const { NFM_SELECTED_MEASURES } = PROJECT_PAYLOAD_FIELDS

  describe('Valid selections', () => {
    test('should validate single measure selection', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: [NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION]
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate multiple measure selections', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: [
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION,
          NFM_MEASURES.LEAKY_BARRIERS
        ]
      })
      expect(result.error).toBeUndefined()
    })

    test('should validate all measure types', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: [
          NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION,
          NFM_MEASURES.LEAKY_BARRIERS,
          NFM_MEASURES.OFFLINE_STORAGE,
          NFM_MEASURES.WOODLAND,
          NFM_MEASURES.HEADWATER_DRAINAGE,
          NFM_MEASURES.RUNOFF_MANAGEMENT,
          NFM_MEASURES.SALTMARSH_MANAGEMENT,
          NFM_MEASURES.SAND_DUNE_MANAGEMENT
        ]
      })
      expect(result.error).toBeUndefined()
    })
  })

  describe('Invalid selections', () => {
    test('should reject empty array', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: []
      })
      expect(result.error).toBeDefined()
    })

    test('should reject missing field', () => {
      const result = nfmSelectedMeasuresSchema.validate({})
      expect(result.error).toBeDefined()
    })

    test('should reject null value', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: null
      })
      expect(result.error).toBeDefined()
    })

    test('should reject invalid measure type', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: ['invalid_measure_type']
      })
      expect(result.error).toBeDefined()
    })

    test('should reject non-array value', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: 'not_an_array'
      })
      expect(result.error).toBeDefined()
    })
  })

  describe('Unknown fields', () => {
    test('should allow unknown fields like crumb', () => {
      const result = nfmSelectedMeasuresSchema.validate({
        [NFM_SELECTED_MEASURES]: [NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION],
        crumb: 'test-csrf-token'
      })
      expect(result.error).toBeUndefined()
    })
  })
})
