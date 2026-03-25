/// <reference types="vitest" />
// @vitest-environment jsdo

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock govuk-frontend to avoid DOM/HTMLElement errors in Node
vi.mock('govuk-frontend', () => ({ initAll: vi.fn() }))

import {
  digitsOnly,
  withCommas,
  formatNumberWithCommas,
  formatInputValueWithCommas,
  unformatInputValue,
  bindCommaFormattingToInputs,
  setupHeaderNavigation
} from './application.js'

describe('number formatting helpers', () => {
  it('digitsOnly strips non-digits', () => {
    expect(digitsOnly('123abc456')).toBe('123456')
    expect(digitsOnly('')).toBe('')
    expect(digitsOnly(null)).toBe('')
    expect(digitsOnly(undefined)).toBe('')
    expect(digitsOnly('0')).toBe('0')
  })

  it('withCommas adds commas to numbers', () => {
    expect(withCommas('1234567')).toBe('1,234,567')
    expect(withCommas('1000')).toBe('1,000')
    expect(withCommas('')).toBe('')
    expect(withCommas(null)).toBe('')
  })

  it('formatNumberWithCommas combines digitsOnly and withCommas', () => {
    expect(formatNumberWithCommas('12a34b567')).toBe('1,234,567')
    expect(formatNumberWithCommas('1000')).toBe('1,000')
    expect(formatNumberWithCommas('')).toBe('')
    expect(formatNumberWithCommas(null)).toBe('')
  })
})

describe('input formatting helpers', () => {
  let input
  beforeEach(() => {
    input = document.createElement('input')
    input.value = '1234567'
  })

  it('formatInputValueWithCommas formats input value', () => {
    formatInputValueWithCommas(input)
    expect(input.value).toBe('1,234,567')
  })

  it('formatInputValueWithCommas does nothing if input is falsy', () => {
    expect(formatInputValueWithCommas(null)).toBeUndefined()
    expect(formatInputValueWithCommas(undefined)).toBeUndefined()
  })

  it('unformatInputValue strips commas from input value', () => {
    input.value = '1,234,567'
    unformatInputValue(input)
    expect(input.value).toBe('1234567')
  })

  it('unformatInputValue does nothing if input is falsy', () => {
    expect(unformatInputValue(null)).toBeUndefined()
    expect(unformatInputValue(undefined)).toBeUndefined()
  })
})

describe('bindCommaFormattingToInputs', () => {
  let form, input
  beforeEach(() => {
    document.body.innerHTML = ''
    form = document.createElement('form')
    input = document.createElement('input')
    input.value = '1234567'
    form.appendChild(input)
    document.body.appendChild(form)
  })

  it('formats input on bind and on input/blur events', () => {
    input.setAttribute('data-number-format', 'comma')
    bindCommaFormattingToInputs('[data-number-format="comma"]')
    expect(input.value).toBe('1,234,567')
    input.value = '7654321'
    input.dispatchEvent(new Event('input'))
    expect(input.value).toBe('7,654,321')
    input.value = '1000'
    input.dispatchEvent(new Event('blur'))
    expect(input.value).toBe('1,000')
  })

  it('unformats on submit if option set', () => {
    input.setAttribute('data-number-format', 'comma')
    bindCommaFormattingToInputs('[data-number-format="comma"]', {
      unformatOnSubmit: true
    })
    form.dispatchEvent(new Event('submit'))
    expect(input.value).toBe('1234567')
  })

  it('returns empty array if no inputs found', () => {
    expect(bindCommaFormattingToInputs('.not-found')).toEqual([])
  })
})

describe('setupHeaderNavigation', () => {
  it('runs without error in test env (no DOM)', () => {
    expect(() => setupHeaderNavigation()).not.toThrow()
  })
})
