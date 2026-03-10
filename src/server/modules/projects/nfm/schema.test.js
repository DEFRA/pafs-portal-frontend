import { describe, test, expect } from 'vitest'
import {
  nfmSelectedMeasuresSchema,
  nfmRiverRestorationSchema,
  nfmLeakyBarriersSchema,
  nfmOfflineStorageSchema,
  nfmWoodlandSchema,
  nfmHeadwaterDrainageSchema,
  nfmRunoffManagementSchema,
  nfmSaltmarshSchema,
  nfmSandDuneSchema
} from './schema.js'
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

describe('NFM Measure Schemas', () => {
  test('validates river restoration with 2 decimal places and optional empty volume', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 45.67,
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: ''
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects river restoration area with more than 2 decimal places', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 45.678,
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: 10.5
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
  })

  test('requires leaky barriers length and width', () => {
    const result = nfmLeakyBarriersSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: 4.5
    })

    expect(result.error).toBeDefined()
  })

  test('validates leaky barriers with 2 decimal places', () => {
    const result = nfmLeakyBarriersSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: 4.5,
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: 1.25,
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: 3.5
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects runoff management volume with more than 2 decimal places', () => {
    const result = nfmRunoffManagementSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: 20.5,
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: 100.123
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
  })

  test('validates offline storage with null optional volume', () => {
    const result = nfmOfflineStorageSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: 8.25,
      [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: null
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects woodland area when negative', () => {
    const result = nfmWoodlandSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: -1
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.positive')
  })

  test('rejects headwater drainage area with more than 2 decimal places', () => {
    const result = nfmHeadwaterDrainageSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 3.456
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
  })

  test('validates saltmarsh with optional null length', () => {
    const result = nfmSaltmarshSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: 12.34,
      [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: null
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects sand dune area with more than 2 decimal places', () => {
    const result = nfmSandDuneSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: 9.999,
      [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: 1.5
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
  })

  test('allows unknown fields on measure schemas', () => {
    const result = nfmSandDuneSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: 9.99,
      [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: 1.5,
      crumb: 'csrf-token'
    })

    expect(result.error).toBeUndefined()
  })

  test('allows explicitly undefined optional values', () => {
    const result = nfmRunoffManagementSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: 10.25,
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: undefined
    })

    expect(result.error).toBeUndefined()
  })
})
