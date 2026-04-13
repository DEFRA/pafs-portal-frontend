/// <reference types="vitest" />
// @vitest-environment jsdom

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

  it('withCommas returns short strings (≤3 digits) unchanged', () => {
    expect(withCommas('1')).toBe('1')
    expect(withCommas('12')).toBe('12')
    expect(withCommas('123')).toBe('123')
  })

  it('withCommas handles lengths exactly divisible by 3', () => {
    expect(withCommas('123456')).toBe('123,456')
    expect(withCommas('123456789')).toBe('123,456,789')
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

  it('skips form registration when input has no parent form', () => {
    const standAloneInput = document.createElement('input')
    standAloneInput.setAttribute('data-number-format', 'comma')
    standAloneInput.value = '9876543'
    document.body.appendChild(standAloneInput)

    expect(() =>
      bindCommaFormattingToInputs('[data-number-format="comma"]', {
        unformatOnSubmit: true
      })
    ).not.toThrow()
  })

  it('returns empty array if no inputs found', () => {
    expect(bindCommaFormattingToInputs('.not-found')).toEqual([])
  })
})

describe('setupHeaderNavigation', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('runs without error when no toggle button is in the DOM', () => {
    expect(() => setupHeaderNavigation()).not.toThrow()
  })

  it('removes hidden and sets aria-expanded=false on the toggle button', () => {
    const button = document.createElement('button')
    button.className = 'govuk-js-header-toggle'
    button.setAttribute('hidden', '')
    document.body.appendChild(button)

    setupHeaderNavigation()

    expect(button.hasAttribute('hidden')).toBe(false)
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles aria-expanded from false to true on click', () => {
    const button = document.createElement('button')
    button.className = 'govuk-js-header-toggle'
    document.body.appendChild(button)

    setupHeaderNavigation()

    button.dispatchEvent(new Event('click'))
    expect(button.getAttribute('aria-expanded')).toBe('true')
  })

  it('toggles aria-expanded from true back to false on second click', () => {
    const button = document.createElement('button')
    button.className = 'govuk-js-header-toggle'
    document.body.appendChild(button)

    setupHeaderNavigation()

    button.dispatchEvent(new Event('click'))
    button.dispatchEvent(new Event('click'))
    expect(button.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles the open class on the navigation wrapper when present', () => {
    const button = document.createElement('button')
    button.className = 'govuk-js-header-toggle'
    document.body.appendChild(button)

    const nav = document.createElement('div')
    nav.className = 'govuk-header__navigation-list-wrapper'
    document.body.appendChild(nav)

    setupHeaderNavigation()

    button.dispatchEvent(new Event('click'))
    expect(
      nav.classList.contains('govuk-header__navigation-list-wrapper--open')
    ).toBe(true)

    button.dispatchEvent(new Event('click'))
    expect(
      nav.classList.contains('govuk-header__navigation-list-wrapper--open')
    ).toBe(false)
  })

  it('does not throw on click when navigation wrapper is absent', () => {
    const button = document.createElement('button')
    button.className = 'govuk-js-header-toggle'
    document.body.appendChild(button)

    setupHeaderNavigation()

    expect(() => button.dispatchEvent(new Event('click'))).not.toThrow()
  })
})
