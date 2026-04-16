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

  it('sets up toggle button when .govuk-js-header-toggle exists', () => {
    document.body.innerHTML = `
      <button class="govuk-js-header-toggle" hidden></button>
      <nav><ul class="govuk-header__navigation-list-wrapper"></ul></nav>
    `
    setupHeaderNavigation()
    const btn = document.querySelector('.govuk-js-header-toggle')
    expect(btn.hasAttribute('hidden')).toBe(false)
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('toggles aria-expanded and open class on click', () => {
    document.body.innerHTML = `
      <button class="govuk-js-header-toggle" hidden></button>
      <nav><ul class="govuk-header__navigation-list-wrapper"></ul></nav>
    `
    setupHeaderNavigation()
    const btn = document.querySelector('.govuk-js-header-toggle')
    const nav = document.querySelector('.govuk-header__navigation-list-wrapper')

    btn.dispatchEvent(new Event('click'))
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    expect(
      nav.classList.contains('govuk-header__navigation-list-wrapper--open')
    ).toBe(true)

    btn.dispatchEvent(new Event('click'))
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    expect(
      nav.classList.contains('govuk-header__navigation-list-wrapper--open')
    ).toBe(false)
  })

  it('handles click when navigationWrapper is absent', () => {
    document.body.innerHTML = `
      <button class="govuk-js-header-toggle" hidden></button>
    `
    setupHeaderNavigation()
    const btn = document.querySelector('.govuk-js-header-toggle')
    expect(() => btn.dispatchEvent(new Event('click'))).not.toThrow()
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })
})

describe('withCommas edge cases', () => {
  it('handles exactly 3 digits', () => {
    expect(withCommas('123')).toBe('123')
  })

  it('handles exactly 6 digits', () => {
    expect(withCommas('123456')).toBe('123,456')
  })

  it('handles 4 digits', () => {
    expect(withCommas('1234')).toBe('1,234')
  })

  it('handles 7 digits', () => {
    expect(withCommas('1234567')).toBe('1,234,567')
  })
})

describe('bindCommaFormattingToInputs with unformatOnSubmit and no form', () => {
  it('handles input not attached to a form', () => {
    document.body.innerHTML = ''
    const input = document.createElement('input')
    input.setAttribute('data-number-format', 'comma')
    input.value = '1000'
    document.body.appendChild(input) // not inside a form

    expect(() =>
      bindCommaFormattingToInputs('[data-number-format="comma"]', {
        unformatOnSubmit: true
      })
    ).not.toThrow()
  })
})

describe('server-side guard (document undefined)', () => {
  beforeEach(() => {
    vi.stubGlobal('document', undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('formatInputValueWithCommas returns undefined when document is undefined', () => {
    const fakeInput = { value: '1234' }
    expect(formatInputValueWithCommas(fakeInput)).toBeUndefined()
  })

  it('unformatInputValue returns undefined when document is undefined', () => {
    const fakeInput = { value: '1,234' }
    expect(unformatInputValue(fakeInput)).toBeUndefined()
  })

  it('bindCommaFormattingToInputs returns empty array when document is undefined', () => {
    expect(bindCommaFormattingToInputs('[data-number-format="comma"]')).toEqual(
      []
    )
  })
})

describe('initEstimatedSpend (progressive enhancement)', () => {
  function buildFormHtml({
    withHint = true,
    withBtn = true,
    numCols = 2,
    rows = []
  } = {}) {
    const hints = withHint ? '<p id="no-js-totals-hint">hint</p>' : ''
    const btn = withBtn ? '<button id="update-totals-btn">Update</button>' : ''
    const colTotals = Array.from(
      { length: numCols },
      (_, i) => `<td data-col-total="${i}">0</td>`
    ).join('')
    const grandTotal = '<td data-grand-total>0</td>'
    const rowsHtml = rows
      .map(
        (cols) =>
          `<tr data-source-row>${cols.map((v) => `<td><input data-spend-cell value="${v}"></td>`).join('')}<td data-row-total>0</td></tr>`
      )
      .join('')
    return `
      <form id="estimated-spend-form">
        ${hints}${btn}
        <table>
          <tbody>${rowsHtml}</tbody>
          <tfoot><tr>${colTotals}${grandTotal}</tr></tfoot>
        </table>
      </form>
    `
  }

  beforeEach(() => {
    vi.resetModules()
    document.body.innerHTML = ''
  })

  it('does nothing when form is absent (no error)', async () => {
    document.body.innerHTML = '<div></div>'
    await import('./application.js?nocols')
    expect(document.getElementById('estimated-spend-form')).toBeNull()
  })

  it('hides no-js hint and update button, runs recalc', async () => {
    document.body.innerHTML = buildFormHtml({
      numCols: 2,
      rows: [['1000', '2000']]
    })
    await import('./application.js?full')

    const noJsHint = document.getElementById('no-js-totals-hint')
    const updateBtn = document.getElementById('update-totals-btn')
    expect(noJsHint.style.display).toBe('none')
    expect(updateBtn.style.display).toBe('none')

    const rowTotal = document.querySelector('[data-row-total]')
    expect(rowTotal.textContent).toBe('3,000')
    const col0 = document.querySelector('[data-col-total="0"]')
    expect(col0.textContent).toBe('1,000')
    const col1 = document.querySelector('[data-col-total="1"]')
    expect(col1.textContent).toBe('2,000')
    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('3,000')
  })

  it('works without hint and button elements present', async () => {
    document.body.innerHTML = buildFormHtml({
      withHint: false,
      withBtn: false,
      numCols: 1,
      rows: [['500']]
    })
    await import('./application.js?nohint')

    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('500')
  })

  it('returns early when numCols is 0', async () => {
    document.body.innerHTML = `
      <form id="estimated-spend-form">
        <table><tbody></tbody></table>
      </form>
    `
    await import('./application.js?zerocols')
    // no error thrown and grand-total element absent
    expect(document.querySelector('[data-grand-total]')).toBeNull()
  })

  it('recalculates on input event', async () => {
    document.body.innerHTML = buildFormHtml({
      numCols: 1,
      rows: [['0']]
    })
    await import('./application.js?inputevt')

    const inp = document.querySelector('[data-spend-cell]')
    inp.value = '999'
    inp.dispatchEvent(new Event('input'))

    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('999')
  })

  it('handles empty / non-numeric cell values as 0 in recalc', async () => {
    document.body.innerHTML = buildFormHtml({
      numCols: 2,
      rows: [['', 'abc']]
    })
    await import('./application.js?empty')

    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('0')
  })

  it('registers DOMContentLoaded listener when readyState is loading', async () => {
    document.body.innerHTML = buildFormHtml({
      numCols: 1,
      rows: [['42']]
    })

    // Fake readyState = 'loading' so the IIFE takes the addEventListener path
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      configurable: true
    })

    await import('./application.js?loading')

    // Restore
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      configurable: true
    })

    // Fire DOMContentLoaded to trigger init()
    document.dispatchEvent(new Event('DOMContentLoaded'))

    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('42')
  })

  it('formatNum returns formatted number for non-zero', async () => {
    document.body.innerHTML = buildFormHtml({ numCols: 1, rows: [['1234']] })
    await import('./application.js?fmt')
    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('1,234')
  })
})
