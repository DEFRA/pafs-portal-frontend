import { describe, expect, test } from 'vitest'
import { EnvironmentalBenefitsController } from './controller.js'

describe('EnvironmentalBenefitsController normalization', () => {
  test('strips commas from input field values', () => {
    const controller = new EnvironmentalBenefitsController()

    expect(controller._normalizeFieldValue('1,234.5', 'input')).toBe('1234.5')
  })

  test('returns undefined for blank comma-formatted input values', () => {
    const controller = new EnvironmentalBenefitsController()

    expect(controller._normalizeFieldValue('   ', 'input')).toBeUndefined()
  })
})
