import { describe, test, expect } from 'vitest'
import { BOOLEAN_OPTION_VALUES } from '../../../common/constants/common.js'
import {
  nfmInclusionSchema,
  nfmSelectedMeasuresSchema,
  nfmRiverRestorationSchema,
  nfmLeakyBarriersSchema,
  nfmOfflineStorageSchema,
  nfmWoodlandSchema,
  nfmHeadwaterDrainageSchema,
  nfmRunoffManagementSchema,
  nfmSaltmarshSchema,
  nfmSandDuneSchema,
  nfmLandUseChangeSchema,
  nfmLandUseEnclosedArableFarmlandSchema,
  nfmLandownerConsentSchema,
  nfmExperienceLevelSchema,
  nfmProjectReadinessSchema
} from './schema.js'
import {
  NFM_EXPERIENCE_LEVEL_OPTIONS,
  NFM_PROJECT_READINESS_OPTIONS,
  PROJECT_PAYLOAD_FIELDS,
  NFM_LANDOWNER_CONSENT_OPTIONS,
  NFM_MEASURES,
  NFM_LAND_TYPES
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

  test('rejects river restoration when area is undefined', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: undefined,
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: 10.5
    })

    expect(result.error).toBeDefined()
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

  test('rejects saltmarsh with null length', () => {
    const result = nfmSaltmarshSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: 12.34,
      [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: null
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.base')
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

  test('allows empty string for optional volume fields', () => {
    const result = nfmRunoffManagementSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: 10.25,
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: ''
    })

    expect(result.error).toBeUndefined()
  })

  test('allows zero for river restoration optional volume (AC: 0 treated same as empty)', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 45.67,
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: 0
    })

    expect(result.error).toBeUndefined()
  })

  test('allows zero for leaky barriers optional volume (AC: 0 treated same as empty)', () => {
    const result = nfmLeakyBarriersSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: 0,
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: 1.5,
      [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: 2.0
    })

    expect(result.error).toBeUndefined()
  })

  test('allows zero for offline storage optional volume (AC: 0 treated same as empty)', () => {
    const result = nfmOfflineStorageSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: 8.25,
      [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: 0
    })

    expect(result.error).toBeUndefined()
  })

  test('allows zero for runoff management optional volume (AC: 0 treated same as empty)', () => {
    const result = nfmRunoffManagementSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: 10.25,
      [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: 0
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects negative value for river restoration volume', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 45.67,
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: -1
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.min')
  })

  test('rejects area value in scientific notation (fails internal regex)', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '1e5'
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
  })

  test('rejects area whole number exceeding 18 digits (number.integer.max)', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '9'.repeat(19)
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.integer.max')
  })

  test('rejects area with more than 16 digits before the decimal point (number.precision)', () => {
    const result = nfmRiverRestorationSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '1'.repeat(17) + '.5'
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
  })
})

describe('NFM Land-use Schemas', () => {
  test('validates selected land-use types', () => {
    const result = nfmLandUseChangeSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: [
        NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND,
        NFM_LAND_TYPES.WOODLAND
      ]
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects invalid land-use type', () => {
    const result = nfmLandUseChangeSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: ['invalid_land_type']
    })

    expect(result.error).toBeDefined()
  })

  test('validates enclosed arable farmland before and after values', () => {
    const result = nfmLandUseEnclosedArableFarmlandSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: 22.5,
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: 15.25
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects enclosed arable farmland before with more than 2 decimals', () => {
    const result = nfmLandUseEnclosedArableFarmlandSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: 22.555,
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: 15.25
    })

    expect(result.error).toBeDefined()
    expect(result.error.details[0].type).toBe('number.precision')
    expect(result.error.details[0].message).toBe('precision')
  })

  test('shows required messages when before and after are blank', () => {
    const result = nfmLandUseEnclosedArableFarmlandSchema.validate(
      {
        [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: '',
        [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: ''
      },
      { abortEarly: false }
    )

    expect(result.error).toBeDefined()
    expect(result.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'required_before'
        }),
        expect.objectContaining({
          message: 'required_after'
        })
      ])
    )
  })

  test('shows non-negative message for non-numeric or negative values', () => {
    const nonNumericResult = nfmLandUseEnclosedArableFarmlandSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: 'abc',
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: 1
    })

    expect(nonNumericResult.error).toBeDefined()
    expect(nonNumericResult.error.details[0].message).toBe('invalid')

    const negativeResult = nfmLandUseEnclosedArableFarmlandSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: -1,
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: 1
    })

    expect(negativeResult.error).toBeDefined()
    expect(negativeResult.error.details[0].message).toBe('invalid')
  })
})

describe('NFM Landowner Consent Schema', () => {
  test('validates a selected landowner consent option', () => {
    const result = nfmLandownerConsentSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LANDOWNER_CONSENT]:
        NFM_LANDOWNER_CONSENT_OPTIONS.CONSENT_FULLY_SECURED
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects missing landowner consent option', () => {
    const result = nfmLandownerConsentSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_LANDOWNER_CONSENT]: ''
    })

    expect(result.error).toBeDefined()
  })
})

describe('NFM Experience Level Schema', () => {
  test('validates a selected experience option', () => {
    const result = nfmExperienceLevelSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_EXPERIENCE_LEVEL]:
        NFM_EXPERIENCE_LEVEL_OPTIONS.NO_EXPERIENCE
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects missing experience option', () => {
    const result = nfmExperienceLevelSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_EXPERIENCE_LEVEL]: ''
    })

    expect(result.error).toBeDefined()
  })
})

describe('NFM Project Readiness Schema', () => {
  test('validates a selected project readiness option', () => {
    const result = nfmProjectReadinessSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_PROJECT_READINESS]:
        NFM_PROJECT_READINESS_OPTIONS.EARLY_CONCEPT
    })

    expect(result.error).toBeUndefined()
  })

  test('rejects missing project readiness option', () => {
    const result = nfmProjectReadinessSchema.validate({
      [PROJECT_PAYLOAD_FIELDS.NFM_PROJECT_READINESS]: ''
    })

    expect(result.error).toBeDefined()
  })
})

describe('NFM Inclusion Schema', () => {
  const { NATURAL_FLOOD_RISK_MEASURES_INCLUDED } = PROJECT_PAYLOAD_FIELDS

  test('should validate "yes" value', () => {
    const result = nfmInclusionSchema.validate({
      [NATURAL_FLOOD_RISK_MEASURES_INCLUDED]: BOOLEAN_OPTION_VALUES.YES
    })
    expect(result.error).toBeUndefined()
  })

  test('should validate "no" value', () => {
    const result = nfmInclusionSchema.validate({
      [NATURAL_FLOOD_RISK_MEASURES_INCLUDED]: BOOLEAN_OPTION_VALUES.NO
    })
    expect(result.error).toBeUndefined()
  })

  test('should reject missing value', () => {
    const result = nfmInclusionSchema.validate({})
    expect(result.error).toBeDefined()
  })

  test('should reject invalid value', () => {
    const result = nfmInclusionSchema.validate({
      [NATURAL_FLOOD_RISK_MEASURES_INCLUDED]: 'maybe'
    })
    expect(result.error).toBeDefined()
  })

  test('should reject empty string', () => {
    const result = nfmInclusionSchema.validate({
      [NATURAL_FLOOD_RISK_MEASURES_INCLUDED]: ''
    })
    expect(result.error).toBeDefined()
  })
})
