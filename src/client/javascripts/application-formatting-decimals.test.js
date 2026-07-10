/// <reference types="vitest" />
// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest'

vi.mock('govuk-frontend', () => ({ initAll: vi.fn() }))

import {
  formatInputValueWithCommas,
  formatNumberWithCommas
} from './application.js'

describe('application decimal comma formatting', () => {
  it('formats decimal values with thousand separators', () => {
    expect(formatNumberWithCommas('1234.56')).toBe('1,234.56')
    expect(formatNumberWithCommas('.75')).toBe('0.75')
    expect(formatNumberWithCommas('-1234.56', true)).toBe('-1,234.56')
  })

  it('formats decimal input values while preserving the decimal portion', () => {
    const input = document.createElement('input')
    input.value = '1234.56'

    formatInputValueWithCommas(input)

    expect(input.value).toBe('1,234.56')
  })
})
