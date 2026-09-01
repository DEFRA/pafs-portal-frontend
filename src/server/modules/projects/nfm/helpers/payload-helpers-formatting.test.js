import { describe, expect, test } from 'vitest'
import { processPayload, sanitizeNumericPayload } from './payload-helpers.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'

describe('NFM payload helper formatting', () => {
  test('sanitizeNumericPayload strips commas from direct measure fields', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '1,234.5',
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: '6,789.01'
    }

    sanitizeNumericPayload(PROJECT_STEPS.NFM_RIVER_RESTORATION, payload)

    expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
      '1234.5'
    )
    expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]).toBe(
      '6789.01'
    )
  })

  test('sanitizeNumericPayload strips commas from land use detail fields', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]: '1,000.25',
      [PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]: '250.75'
    }

    sanitizeNumericPayload(
      PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND,
      payload
    )

    expect(
      payload[PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE]
    ).toBe('1000.25')
    expect(
      payload[PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER]
    ).toBe('250.75')
  })

  test('processPayload preserves decimal strings after commas are removed', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]: '1,234.25'
    }

    processPayload(PROJECT_STEPS.NFM_WOODLAND, payload)

    expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_AREA]).toBe('1234.25')
  })

  test('sanitizeNumericPayload leaves non-string values untouched', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: 1234.5,
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]: null
    }

    sanitizeNumericPayload(PROJECT_STEPS.NFM_RIVER_RESTORATION, payload)

    expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
      1234.5
    )
    expect(
      payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_VOLUME]
    ).toBeNull()
  })

  test('sanitizeNumericPayload leaves payload unchanged for an unrelated step', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]: '1,234.5'
    }

    sanitizeNumericPayload(PROJECT_STEPS.NFM_LANDOWNER_CONSENT, payload)

    expect(payload[PROJECT_PAYLOAD_FIELDS.NFM_RIVER_RESTORATION_AREA]).toBe(
      '1,234.5'
    )
  })
})
