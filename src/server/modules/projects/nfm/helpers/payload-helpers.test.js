import { describe, test, expect } from 'vitest'
import { processPayload } from './payload-helpers.js'
import {
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS
} from '../../../../common/constants/projects.js'

describe('NFM Payload Helpers', () => {
  describe('processPayload - NFM_SELECTED_MEASURES', () => {
    test('should convert array to comma-separated string', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: [
          'river_floodplain_restoration',
          'leaky_barriers'
        ]
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe(
        'river_floodplain_restoration,leaky_barriers'
      )
    })

    test('should handle single item array', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: [
          'river_floodplain_restoration'
        ]
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe(
        'river_floodplain_restoration'
      )
    })

    test('should handle empty array', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: []
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe('')
    })

    test('should not modify if already a string', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration,leaky_barriers'
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe(
        'river_floodplain_restoration,leaky_barriers'
      )
    })
  })

  describe('processPayload - NFM_RIVER_RESTORATION', () => {
    test('should convert string values to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '10.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: '500.25'
      }

      processPayload(PROJECT_STEPS.NFM_RIVER_RESTORATION, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
        10.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]).toBe(
        500.25
      )
    })

    test('should convert empty string to null for optional volume', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '10.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: ''
      }

      processPayload(PROJECT_STEPS.NFM_RIVER_RESTORATION, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
        10.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]).toBe(
        null
      )
    })

    test('should handle numeric values without conversion', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 10.5,
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: 500.25
      }

      processPayload(PROJECT_STEPS.NFM_RIVER_RESTORATION, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
        10.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]).toBe(
        500.25
      )
    })

    test('should preserve null values', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '10.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: null
      }

      processPayload(PROJECT_STEPS.NFM_RIVER_RESTORATION, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
        10.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]).toBe(
        null
      )
    })
  })

  describe('processPayload - NFM_LEAKY_BARRIERS', () => {
    test('should convert string values to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: '100.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: '5.25',
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: '2.75'
      }

      processPayload(PROJECT_STEPS.NFM_LEAKY_BARRIERS, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]).toBe(
        100.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]).toBe(
        5.25
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]).toBe(
        2.75
      )
    })

    test('should convert empty string to null for optional volume', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: '',
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: '5.25',
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: '2.75'
      }

      processPayload(PROJECT_STEPS.NFM_LEAKY_BARRIERS, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]).toBe(
        5.25
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]).toBe(
        2.75
      )
    })

    test('should handle numeric values without conversion', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: 100.5,
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: 5.25,
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: 2.75
      }

      processPayload(PROJECT_STEPS.NFM_LEAKY_BARRIERS, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]).toBe(
        100.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]).toBe(
        5.25
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]).toBe(
        2.75
      )
    })

    test('should preserve null volume', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: null,
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: '5.25',
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: '2.75'
      }

      processPayload(PROJECT_STEPS.NFM_LEAKY_BARRIERS, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]).toBe(
        5.25
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]).toBe(
        2.75
      )
    })
  })

  describe('processPayload - NFM_OFFLINE_STORAGE', () => {
    test('should convert area and volume strings to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: '12.75',
        [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: '350.5'
      }

      processPayload(PROJECT_STEPS.NFM_OFFLINE_STORAGE, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]).toBe(
        12.75
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]).toBe(
        350.5
      )
    })

    test('should convert empty offline storage volume to null', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: '12.75',
        [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: ''
      }

      processPayload(PROJECT_STEPS.NFM_OFFLINE_STORAGE, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]).toBe(
        12.75
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]).toBe(
        null
      )
    })
  })

  describe('processPayload - NFM_WOODLAND', () => {
    test('should convert woodland area string to float', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: '7.25'
      }

      processPayload(PROJECT_STEPS.NFM_WOODLAND, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]).toBe(7.25)
    })
  })

  describe('processPayload - selected measures change cleanup', () => {
    test('should clear removed measure fields when selected measures change', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: [
          'offline_storage',
          'woodland'
        ],
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 10,
        [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: 100,
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]: 200,
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]: 2,
        [PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]: 3,
        [PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]: 4
      }

      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration,leaky_barriers,offline_storage,woodland,headwater_drainage'
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe(
        'offline_storage,woodland'
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_VOLUME]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_LENGTH]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LEAKY_BARRIERS_WIDTH]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_HEADWATER_DRAINAGE_AREA]).toBe(
        null
      )
    })

    test('should handle selected measures provided as comma-separated string', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'woodland,headwater_drainage'
      }
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'woodland,headwater_drainage'
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe(
        'woodland,headwater_drainage'
      )
    })

    test('should clear offline storage and woodland fields when those measures are removed', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: [
          'river_floodplain_restoration'
        ],
        [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]: 9,
        [PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]: 90,
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: 8
      }

      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration,offline_storage,woodland'
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe(
        'river_floodplain_restoration'
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_AREA]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_OFFLINE_STORAGE_VOLUME]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]).toBe(null)
    })

    test('should ignore unknown removed measures and normalize unsupported payload type', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: {
          unexpected: true
        }
      }

      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: 'unknown_measure'
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]).toBe('')
    })

    test('should clear runoff, saltmarsh and sand dune fields when deselected', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]: [
          'river_floodplain_restoration'
        ],
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: 12,
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: 120,
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: 8,
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: 2,
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: 5,
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: 1.5
      }

      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SELECTED_MEASURES]:
          'river_floodplain_restoration,runoff_management,saltmarsh_management,sand_dune_management'
      }

      processPayload(PROJECT_STEPS.NFM_SELECTED_MEASURES, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]).toBe(null)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]).toBe(null)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]).toBe(null)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]).toBe(null)
    })
  })

  describe('processPayload - NFM_LAND_USE_CHANGE', () => {
    test('should normalize selected land types and clear deselected land-use details', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: [
          'enclosed_arable_farmland'
        ],
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_BEFORE]: 22,
        [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_AFTER]: 18
      }

      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]:
          'enclosed_arable_farmland,woodland'
      }

      processPayload(PROJECT_STEPS.NFM_LAND_USE_CHANGE, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]).toBe(
        'enclosed_arable_farmland'
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_BEFORE]).toBe(
        null
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_AFTER]).toBe(
        null
      )
    })

    test('should ignore unknown deselected land-use types without throwing', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: []
      }
      const sessionData = {
        [PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]: 'unknown_land_type'
      }

      processPayload(PROJECT_STEPS.NFM_LAND_USE_CHANGE, payload, sessionData)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_LAND_USE_CHANGE]).toBe('')
    })
  })

  describe('processPayload - NFM land-use detail steps', () => {
    test('should parse enclosed arable before/after values to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: '11.2',
        [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: '9.4'
      }

      processPayload(
        PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND,
        payload
      )

      expect(
        payload[PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]
      ).toBe(11.2)
      expect(
        payload[PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]
      ).toBe(9.4)
    })
  })

  describe('processPayload - NFM_RUNOFF_MANAGEMENT', () => {
    test('should convert string values to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: '15.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: '750.25'
      }

      processPayload(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]).toBe(
        15.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]).toBe(
        750.25
      )
    })

    test('should convert empty string to null for optional volume', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: '15.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: ''
      }

      processPayload(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]).toBe(
        15.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]).toBe(
        null
      )
    })

    test('should preserve null values', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]: '15.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]: null
      }

      processPayload(PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_AREA]).toBe(
        15.5
      )
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RUNOFF_MANAGEMENT_VOLUME]).toBe(
        null
      )
    })
  })

  describe('processPayload - NFM_SALTMARSH', () => {
    test('should convert string values to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: '20.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: '3.75'
      }

      processPayload(PROJECT_STEPS.NFM_SALTMARSH, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]).toBe(20.5)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]).toBe(3.75)
    })

    test('should convert empty string to null for optional length', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: '20.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: ''
      }

      processPayload(PROJECT_STEPS.NFM_SALTMARSH, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]).toBe(20.5)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]).toBe(null)
    })

    test('should preserve null values', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]: '20.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]: null
      }

      processPayload(PROJECT_STEPS.NFM_SALTMARSH, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_AREA]).toBe(20.5)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SALTMARSH_LENGTH]).toBe(null)
    })
  })

  describe('processPayload - NFM_SAND_DUNE', () => {
    test('should convert string values to floats', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: '25.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: '4.25'
      }

      processPayload(PROJECT_STEPS.NFM_SAND_DUNE, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]).toBe(25.5)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]).toBe(4.25)
    })

    test('should convert empty string to null for optional length', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: '25.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: ''
      }

      processPayload(PROJECT_STEPS.NFM_SAND_DUNE, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]).toBe(25.5)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]).toBe(null)
    })

    test('should preserve null values', () => {
      const payload = {
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]: '25.5',
        [PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]: null
      }

      processPayload(PROJECT_STEPS.NFM_SAND_DUNE, payload)

      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_AREA]).toBe(25.5)
      expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_SAND_DUNE_LENGTH]).toBe(null)
    })
  })

  describe('processPayload - Unknown step', () => {
    test('should not modify payload for unknown step', () => {
      const payload = {
        someField: 'value'
      }
      const originalPayload = { ...payload }

      processPayload('UNKNOWN_STEP', payload)

      expect(payload).toEqual(originalPayload)
    })
  })
})
