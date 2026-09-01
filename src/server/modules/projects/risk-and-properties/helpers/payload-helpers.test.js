import { describe, expect, test } from 'vitest'
import { normalizeNumericFields, processPayload } from './payload-helpers.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'

describe('risk-and-properties payload helpers', () => {
  test('normalizeNumericFields strips commas and converts blanks to null', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS]: '1,234',
      [PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS]: ''
    }

    normalizeNumericFields(payload, [
      PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS,
      PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS
    ])

    expect(payload[PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS]).toBe(
      '1234'
    )
    expect(
      payload[PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS]
    ).toBeNull()
  })

  test('processPayload strips commas from deprived percentage fields', () => {
    const payload = {
      [PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED]: '1,234.5'
    }

    processPayload(PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED, payload, {})

    expect(
      payload[PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED]
    ).toBe('1234.5')
  })
})
