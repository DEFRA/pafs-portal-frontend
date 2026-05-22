const GROUP_SIZE = 3
const MAX_INPUT_LENGTH = 15
import { initAll } from 'govuk-frontend'

export function setupHeaderNavigation() {
  initAll()

  // Custom header navigation toggle for mobile (v5-style navigation in v6)
  const ARIA_EXPANDED = 'aria-expanded'
  const headerToggleButton =
    typeof document === 'undefined'
      ? null
      : document.querySelector('.govuk-js-header-toggle')
  if (headerToggleButton) {
    const navigationWrapper = document.querySelector(
      '.govuk-header__navigation-list-wrapper'
    )

    headerToggleButton.removeAttribute('hidden')
    headerToggleButton.setAttribute(ARIA_EXPANDED, 'false')

    headerToggleButton.addEventListener('click', function () {
      const isOpen = this.getAttribute(ARIA_EXPANDED) === 'true'
      this.setAttribute(ARIA_EXPANDED, isOpen ? 'false' : 'true')

      if (navigationWrapper) {
        navigationWrapper.classList.toggle(
          'govuk-header__navigation-list-wrapper--open'
        )
      }
    })
  }
}

// Public number formatting helpers for reuse across sections

/**
 * Extract digits from a value string.
 * @param {string} value - The input value
 * @param {boolean} allowNegative - If true, preserve leading minus sign
 * @returns {string} Digits only (with optional leading minus)
 */
export const digitsOnly = (value, allowNegative = false) => {
  const str = String(value || '')
  if (allowNegative && str.startsWith('-')) {
    // Preserve minus sign, strip everything else except digits
    return '-' + str.slice(1).replaceAll(/\D/g, '')
  }
  return str.replaceAll(/\D/g, '')
}

export const withCommas = (digits) => {
  if (!digits) {
    return ''
  }
  // Safe, linear-time implementation to insert commas
  // Only works for digit strings, as intended
  const str = String(digits)
  const n = str.length
  if (n <= GROUP_SIZE) {
    return str
  }
  let out = ''
  let i = n % GROUP_SIZE
  if (i > 0) {
    out = str.slice(0, i)
    if (n > GROUP_SIZE) {
      out += ','
    }
  }
  while (i < n) {
    out += str.slice(i, i + GROUP_SIZE)
    i += GROUP_SIZE
    if (i < n) {
      out += ','
    }
  }
  return out
}

export const formatNumberWithCommas = (value, allowNegative = false) => {
  const digits = digitsOnly(value, allowNegative)
  if (allowNegative && digits.startsWith('-')) {
    // Format negative numbers: extract sign, format digits, prepend sign
    const absoluteDigits = digits.slice(1)
    return absoluteDigits ? '-' + withCommas(absoluteDigits) : '-'
  }
  return withCommas(digits)
}

export const formatInputValueWithCommas = (inputEl) => {
  if (typeof document === 'undefined' || !inputEl) {
    return
  }
  if (inputEl.value.includes('.')) {
    return
  }
  const allowNegative = 'allowNegative' in inputEl.dataset
  const formatted = formatNumberWithCommas(inputEl.value, allowNegative)
  inputEl.value = formatted
  // Per HTML spec, setting .value programmatically resets the cursor to
  // position 0. With text-align:right that scrolls to show the start of the
  // value, hiding the most-recently-typed (rightmost) digits. Restore to end.
  inputEl.setSelectionRange(formatted.length, formatted.length)
}

export const unformatInputValue = (inputEl) => {
  if (typeof document === 'undefined' || !inputEl) {
    return
  }
  inputEl.value = inputEl.value.replaceAll(',', '')
}

export const autoSizeInput = (inputEl, minSize = 5) => {
  if (typeof document === 'undefined' || !inputEl) {
    return
  }
  const digits = inputEl.value.replaceAll(',', '').length
  inputEl.size = Math.max(
    digits > MAX_INPUT_LENGTH ? digits + 1 : digits,
    minSize
  )
}

export const bindCommaFormattingToInputs = (selector, options = {}) => {
  if (typeof document === 'undefined') {
    return []
  }
  const { unformatOnSubmit = false } = options
  const inputs = document.querySelectorAll(selector)

  if (inputs.length === 0) {
    return []
  }

  inputs.forEach((inputEl) => {
    formatInputValueWithCommas(inputEl)
    inputEl.addEventListener('input', () => formatInputValueWithCommas(inputEl))
    inputEl.addEventListener('blur', () => formatInputValueWithCommas(inputEl))
  })

  if (unformatOnSubmit) {
    const forms = new Set()
    inputs.forEach((inputEl) => {
      if (inputEl.form) {
        forms.add(inputEl.form)
      }
    })

    forms.forEach((form) => {
      form.addEventListener('submit', () => {
        inputs.forEach((inputEl) => unformatInputValue(inputEl))
      })
    })
  }

  return Array.from(inputs)
}

globalThis.pafs = globalThis.pafs || {}
globalThis.pafs.numberFormatting = {
  digitsOnly,
  withCommas,
  formatNumberWithCommas,
  formatInputValueWithCommas,
  unformatInputValue,
  autoSizeInput,
  bindCommaFormattingToInputs
}

setupHeaderNavigation()

// ── Programme download – progressive enhancement polling ─────────────────────
//
// When the page shows a "generating" state the module polls a JSON endpoint
// every 3 seconds and updates the UI without a full page reload.
// Without JS the view falls back to a <noscript> meta-refresh.
//
// Activated by: [data-module="programme-download"][data-download-status="generating"]

const MAX_CONSECUTIVE_ERRORS = 3
const POLL_INTERVAL_MS = 3000

function updateAdminProgress(data, progressBar, progressCount) {
  if (!data.progressTotal || data.progressTotal <= 0) {
    return
  }
  const pct = Math.round((data.progressCurrent / data.progressTotal) * 100)
  if (progressBar) {
    progressBar.style.width = pct + '%'
    progressBar
      .closest('[role="progressbar"]')
      ?.setAttribute('aria-valuenow', pct)
  }
  if (progressCount) {
    progressCount.textContent = `${data.progressCurrent} of ${data.progressTotal} (${pct}%)`
  }
}

function handleGeneratingStatus(
  data,
  isAdmin,
  progressMessage,
  progressBar,
  progressCount
) {
  if (progressMessage && data.progressMessage) {
    progressMessage.textContent = data.progressMessage
  }
  if (isAdmin) {
    updateAdminProgress(data, progressBar, progressCount)
  }
}

export function initProgrammeDownloadPolling() {
  const el = document.querySelector('[data-module="programme-download"]')
  if (el?.dataset.downloadStatus !== 'generating') {
    return
  }

  const pollUrl = el.dataset.pollUrl
  const isAdmin = el.dataset.isAdmin === 'true'
  if (!pollUrl) {
    return
  }

  const progressMessage = document.getElementById('js-progress-message')
  const progressCount = document.getElementById('js-progress-count')
  const progressBar = document.getElementById('js-progress-bar')

  let consecutiveErrors = 0

  async function poll() {
    try {
      const res = await fetch(pollUrl, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin'
      })

      if (!res.ok) {
        consecutiveErrors++
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          clearInterval(timer)
        }
        return
      }

      consecutiveErrors = 0
      const data = await res.json()

      if (data.status === 'generating') {
        handleGeneratingStatus(
          data,
          isAdmin,
          progressMessage,
          progressBar,
          progressCount
        )
        return
      }

      // Status changed – do a full reload to render the correct server-side partial
      clearInterval(timer)
      globalThis.location.reload()
    } catch (err) {
      console.error('Programme download poll error', err)
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        clearInterval(timer)
      }
    }
  }

  const timer = setInterval(poll, POLL_INTERVAL_MS)
}

initProgrammeDownloadPolling()

bindCommaFormattingToInputs(
  '[data-number-format="comma"], [data-wlc-cost-input="true"]',
  { unformatOnSubmit: true }
)

// ─── Estimated-spend progressive enhancement ────────────────────────────────
// Hides no-JS-only elements (hint text, Update Totals button) and adds live
// row / column / grand totals that recalculate on every input event.
;(function initEstimatedSpend() {
  if (typeof document === 'undefined') {
    return
  }

  function stripCommas(str) {
    return (str || '').replaceAll(/[^\d]/g, '').trim()
  }

  function parseVal(input) {
    const raw = (input.value || '').trim()
    if (raw.includes('.')) {
      return 0n
    }
    const v = stripCommas(raw)
    return v === '' ? 0n : BigInt(v)
  }

  function formatNum(n) {
    return n === 0n ? '0' : n.toLocaleString('en-GB')
  }

  function processInput(inp, colIdx, colTotals, numCols) {
    const v = parseVal(inp)
    const rowTotal = v
    if (colIdx < numCols) {
      colTotals[colIdx] += v
    }
    return rowTotal
  }

  function processRow(row, _form, colTotals, numCols) {
    const inputs = row.querySelectorAll('[data-spend-cell]')
    let rowTotal = 0n

    inputs.forEach(function (inp, colIdx) {
      rowTotal += processInput(inp, colIdx, colTotals, numCols)
    })

    const rowTotalCell = row.querySelector('[data-row-total]')
    if (rowTotalCell) {
      rowTotalCell.textContent = formatNum(rowTotal)
    }
  }

  function updateColumnTotals(form, colTotals) {
    let grandTotal = 0n
    colTotals.forEach(function (ct, colIdx) {
      grandTotal += ct
      const el = form.querySelector(`[data-col-total="${colIdx}"]`)
      if (el) {
        el.textContent = formatNum(ct)
      }
    })

    const grandEl = form.querySelector('[data-grand-total]')
    if (grandEl) {
      grandEl.textContent = formatNum(grandTotal)
    }
  }

  function recalc(form, numCols) {
    const rows = form.querySelectorAll('[data-source-row]')
    const colTotals = Array.from({ length: numCols }, () => 0n)

    rows.forEach(function (row) {
      processRow(row, form, colTotals, numCols)
    })

    updateColumnTotals(form, colTotals)
  }

  function init() {
    const form = document.getElementById('estimated-spend-form')
    if (!form) {
      return // not on the estimated-spend page
    }

    // Hide no-JS elements
    const noJsHint = document.getElementById('no-js-totals-hint')
    if (noJsHint) {
      noJsHint.style.display = 'none'
    }

    const updateBtn = document.getElementById('update-totals-btn')
    if (updateBtn) {
      updateBtn.style.display = 'none'
    }

    // Determine number of year columns from the footer totals
    const colTotalCells = form.querySelectorAll('[data-col-total]')
    const numCols = colTotalCells.length
    if (numCols === 0) {
      return
    }

    form.querySelectorAll('[data-spend-cell]').forEach(function (inp) {
      autoSizeInput(inp) // initial size for pre-filled values
      inp.addEventListener('input', function () {
        autoSizeInput(inp) // resize after formatInputValueWithCommas has run
        recalc(form, numCols)
      })
    })

    // Run once on load to populate totals from pre-filled values
    recalc(form, numCols)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
