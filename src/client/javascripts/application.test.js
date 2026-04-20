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
