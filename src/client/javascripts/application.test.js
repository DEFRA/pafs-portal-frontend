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
  autoSizeInput,
  bindCommaFormattingToInputs,
  setupHeaderNavigation,
  initProgrammeDownloadPolling
} from './application.js'

describe('number formatting helpers', () => {
  it('digitsOnly strips non-digits', () => {
    expect(digitsOnly('123abc456')).toBe('123456')
    expect(digitsOnly('')).toBe('')
    expect(digitsOnly(null)).toBe('')
    expect(digitsOnly(undefined)).toBe('')
    expect(digitsOnly('0')).toBe('0')
  })

  it('digitsOnly preserves leading minus when allowNegative is true', () => {
    expect(digitsOnly('-123abc456', true)).toBe('-123456')
    expect(digitsOnly('-5', true)).toBe('-5')
    expect(digitsOnly('-', true)).toBe('-')
    expect(digitsOnly('123', true)).toBe('123')
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

  it('formatNumberWithCommas handles negative numbers with allowNegative', () => {
    expect(formatNumberWithCommas('-1234567', true)).toBe('-1,234,567')
    expect(formatNumberWithCommas('-5', true)).toBe('-5')
    expect(formatNumberWithCommas('-', true)).toBe('-')
    expect(formatNumberWithCommas('1234', true)).toBe('1,234')
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

  it('formatInputValueWithCommas leaves value unchanged when it contains a decimal point', () => {
    input.value = '1234.56'
    formatInputValueWithCommas(input)
    expect(input.value).toBe('1234.56')
  })

  it('formatInputValueWithCommas does nothing if input is falsy', () => {
    expect(formatInputValueWithCommas(null)).toBeUndefined()
    expect(formatInputValueWithCommas(undefined)).toBeUndefined()
  })

  it('formatInputValueWithCommas restores cursor to end after formatting', () => {
    // Per HTML spec, setting .value programmatically resets cursor to position 0.
    // With text-align:right that scrolls to show the start of the value,
    // hiding the most-recently-typed (rightmost) digits. Cursor must be at end.
    input.value = '1234567'
    formatInputValueWithCommas(input)
    expect(input.value).toBe('1,234,567')
    expect(input.selectionStart).toBe('1,234,567'.length)
    expect(input.selectionEnd).toBe('1,234,567'.length)
  })

  it('unformatInputValue strips only commas, preserving decimal points', () => {
    input.value = '1,234,567'
    unformatInputValue(input)
    expect(input.value).toBe('1234567')
  })

  it('unformatInputValue preserves decimal point so server validation can reject it', () => {
    input.value = '1,234.56'
    unformatInputValue(input)
    expect(input.value).toBe('1234.56')
  })

  it('unformatInputValue does nothing if input is falsy', () => {
    expect(unformatInputValue(null)).toBeUndefined()
    expect(unformatInputValue(undefined)).toBeUndefined()
  })

  it('formatInputValueWithCommas handles negative values with data-allow-negative attribute', () => {
    input.value = '-150000'
    input.dataset.allowNegative = 'true'
    formatInputValueWithCommas(input)
    expect(input.value).toBe('-150,000')
    expect(input.selectionStart).toBe('-150,000'.length)
    expect(input.selectionEnd).toBe('-150,000'.length)
  })
})

describe('autoSizeInput', () => {
  let input
  beforeEach(() => {
    input = document.createElement('input')
  })

  it('sizes by digit count plus 0.5ch per comma plus 0.5ch buffer', () => {
    input.value = '500,000' // 6 digits, 1 comma
    autoSizeInput(input)
    expect(input.style.width).toBe('7ch') // 6 + 1*0.5 + 0.5
  })

  it('also accounts for commas above 6 digits', () => {
    input.value = '1,000,000' // 7 digits, 2 commas
    autoSizeInput(input)
    expect(input.style.width).toBe('8.5ch') // 7 + 2*0.5 + 0.5
  })

  it('enforces minimum width when value is shorter than minSize', () => {
    input.value = '0' // 1 digit, 0 commas
    autoSizeInput(input)
    expect(input.style.width).toBe('5.5ch') // minSize 5 + 0 + 0.5
  })

  it('enforces minimum width when value is empty', () => {
    input.value = ''
    autoSizeInput(input)
    expect(input.style.width).toBe('5.5ch') // minSize 5 + 0 + 0.5
  })

  it('accepts a custom minSize', () => {
    input.value = ''
    autoSizeInput(input, 10)
    expect(input.style.width).toBe('10.5ch') // minSize 10 + 0 + 0.5
  })

  it('handles an 18-digit formatted value', () => {
    input.value = '999,999,999,999,999,999' // 18 digits, 5 commas
    autoSizeInput(input)
    expect(input.style.width).toBe('22ch') // digits(18)>15 → 19 + 5*0.5 + 0.5
  })

  it('does not add overflow at exactly 15 digits', () => {
    input.value = '999,999,999,999,999' // 15 digits, 4 commas
    autoSizeInput(input)
    expect(input.style.width).toBe('17.5ch') // 15 + 4*0.5 + 0.5
  })

  it('adds overflow +1 at 16 digits', () => {
    input.value = '9,999,999,999,999,999' // 16 digits, 5 commas
    autoSizeInput(input)
    expect(input.style.width).toBe('20ch') // digits(16)>15 → 17 + 5*0.5 + 0.5
  })

  it('does nothing if input is falsy', () => {
    expect(autoSizeInput(null)).toBeUndefined()
    expect(autoSizeInput(undefined)).toBeUndefined()
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

  it('treats a cell containing a decimal point as 0 in live totals', async () => {
    // The dot is preserved in the input (not stripped by formatInputValueWithCommas),
    // so parseVal must return 0n rather than throwing from BigInt('1234.56').
    document.body.innerHTML = buildFormHtml({
      numCols: 1,
      rows: [['1234.56']]
    })
    await import('./application.js?decimal')

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

  it('calculates totals exactly for values exceeding Number.MAX_SAFE_INTEGER (17+ digits)', async () => {
    // 17-digit value: 11111111111111111
    // With Number.parseInt this rounds to 11111111111111112 due to IEEE 754 limits.
    // BigInt must preserve the exact value.
    document.body.innerHTML = buildFormHtml({
      numCols: 1,
      rows: [['11111111111111111']]
    })
    await import('./application.js?bigint')

    const grand = document.querySelector('[data-grand-total]')
    expect(grand.textContent).toBe('11,111,111,111,111,111')
  })

  it('ignores extra input cells beyond numCols', async () => {
    // 1 col-total but 2 spend-cell inputs → colIdx 1 should be skipped
    document.body.innerHTML = `
      <form id="estimated-spend-form">
        <table>
          <tbody>
            <tr data-source-row>
              <td><input data-spend-cell value="100"></td>
              <td><input data-spend-cell value="200"></td>
              <td data-row-total>0</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td data-col-total="0">0</td><td data-grand-total>0</td></tr>
          </tfoot>
        </table>
      </form>
    `
    await import('./application.js?extracols')

    const col0 = document.querySelector('[data-col-total="0"]')
    expect(col0.textContent).toBe('100')
    const grand = document.querySelector('[data-grand-total]')
    // grand = col0 total only = 100 (200 not added to any col total)
    expect(grand.textContent).toBe('100')
    // row total includes both
    const rowTotal = document.querySelector('[data-row-total]')
    expect(rowTotal.textContent).toBe('300')
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

// ── initProgrammeDownloadPolling ──────────────────────────────────────────────
// Uses fake timers + vi.stubGlobal for fetch so we can control every async step.

describe('initProgrammeDownloadPolling', () => {
  function buildDOM({
    status = 'generating',
    isAdmin = 'false',
    pollUrl = '/download/poll'
  } = {}) {
    document.body.innerHTML = `
      <div data-module="programme-download"
           data-download-status="${status}"
           data-poll-url="${pollUrl}"
           data-is-admin="${isAdmin}">
        <p id="js-progress-message">Starting...</p>
        <div role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="">
          <div id="js-progress-bar" style="width:0%"></div>
        </div>
        <p id="js-progress-count"></p>
      </div>
    `
  }

  function makeFetch(responses) {
    let call = 0
    return vi.fn(() => {
      const r = responses[Math.min(call++, responses.length - 1)]
      return Promise.resolve({
        ok: r.ok ?? true,
        json: () => Promise.resolve(r.data ?? {})
      })
    })
  }

  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('fetch', vi.fn())
    // jsdom doesn't implement location.reload — stub it
    vi.stubGlobal('location', { reload: vi.fn() })
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('does nothing when no [data-module="programme-download"] element exists', () => {
    initProgrammeDownloadPolling()
    vi.advanceTimersByTime(6000)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does nothing when status is not "generating"', () => {
    buildDOM({ status: 'ready' })
    initProgrammeDownloadPolling()
    vi.advanceTimersByTime(6000)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('does nothing when pollUrl is absent', () => {
    buildDOM({ pollUrl: '' })
    initProgrammeDownloadPolling()
    vi.advanceTimersByTime(6000)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('polls the pollUrl every 3 seconds while still generating', async () => {
    buildDOM()
    vi.stubGlobal(
      'fetch',
      makeFetch([
        { data: { status: 'generating', progressMessage: 'Loading...' } }
      ])
    )

    initProgrammeDownloadPolling()

    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      '/download/poll',
      expect.objectContaining({ credentials: 'same-origin' })
    )

    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('updates js-progress-message with progressMessage from poll response', async () => {
    buildDOM()
    vi.stubGlobal(
      'fetch',
      makeFetch([
        {
          data: {
            status: 'generating',
            progressMessage: 'Processing 5 of 10...'
          }
        }
      ])
    )

    initProgrammeDownloadPolling()
    await vi.advanceTimersByTimeAsync(3000)

    expect(document.getElementById('js-progress-message').textContent).toBe(
      'Processing 5 of 10...'
    )
  })

  it('updates admin progress bar and count when isAdmin=true', async () => {
    buildDOM({ isAdmin: 'true' })
    vi.stubGlobal(
      'fetch',
      makeFetch([
        {
          data: {
            status: 'generating',
            progressMessage: 'Batch 5...',
            progressCurrent: 50,
            progressTotal: 100
          }
        }
      ])
    )

    initProgrammeDownloadPolling()
    await vi.advanceTimersByTimeAsync(3000)

    const bar = document.getElementById('js-progress-bar')
    const count = document.getElementById('js-progress-count')
    expect(bar.style.width).toBe('50%')
    expect(
      bar.closest('[role="progressbar"]').getAttribute('aria-valuenow')
    ).toBe('50')
    expect(count.textContent).toBe('50 of 100 (50%)')
  })

  it('does not update progress bar for non-admin', async () => {
    buildDOM({ isAdmin: 'false' })
    vi.stubGlobal(
      'fetch',
      makeFetch([
        {
          data: {
            status: 'generating',
            progressMessage: 'Working...',
            progressCurrent: 5,
            progressTotal: 10
          }
        }
      ])
    )

    initProgrammeDownloadPolling()
    await vi.advanceTimersByTimeAsync(3000)

    // bar width should remain at its initial value
    expect(document.getElementById('js-progress-bar').style.width).toBe('0%')
  })

  it('reloads the page when status changes from generating to ready', async () => {
    buildDOM()
    vi.stubGlobal('fetch', makeFetch([{ data: { status: 'ready' } }]))

    initProgrammeDownloadPolling()
    await vi.advanceTimersByTimeAsync(3000)

    expect(globalThis.location.reload).toHaveBeenCalled()
  })

  it('reloads the page when status changes to failed', async () => {
    buildDOM()
    vi.stubGlobal('fetch', makeFetch([{ data: { status: 'failed' } }]))

    initProgrammeDownloadPolling()
    await vi.advanceTimersByTimeAsync(3000)

    expect(globalThis.location.reload).toHaveBeenCalled()
  })

  it('stops polling after 3 consecutive non-ok responses', async () => {
    buildDOM()
    vi.stubGlobal('fetch', makeFetch([{ ok: false, data: {} }]))

    initProgrammeDownloadPolling()

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)
    const callsAfter3 = fetch.mock.calls.length

    await vi.advanceTimersByTimeAsync(3000)
    // interval cleared — no further calls
    expect(fetch.mock.calls.length).toBe(callsAfter3)
  })

  it('stops polling after 3 consecutive fetch errors', async () => {
    buildDOM()
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('network error')))
    )

    initProgrammeDownloadPolling()

    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)
    await vi.advanceTimersByTimeAsync(3000)
    const callsAfter3 = fetch.mock.calls.length

    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch.mock.calls.length).toBe(callsAfter3)
  })

  it('resets consecutive error count after a successful poll', async () => {
    buildDOM()
    vi.stubGlobal(
      'fetch',
      makeFetch([
        { ok: false, data: {} },
        { ok: false, data: {} },
        { data: { status: 'generating' } }, // success resets counter
        { ok: false, data: {} }
      ])
    )

    initProgrammeDownloadPolling()

    await vi.advanceTimersByTimeAsync(3000) // fail 1
    await vi.advanceTimersByTimeAsync(3000) // fail 2
    await vi.advanceTimersByTimeAsync(3000) // success → reset
    await vi.advanceTimersByTimeAsync(3000) // fail 1 again (not 3rd)

    // Should still be polling (not stopped)
    const callCount = fetch.mock.calls.length
    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch.mock.calls.length).toBe(callCount + 1)
  })
})
