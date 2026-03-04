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
