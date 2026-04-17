const GROUP_SIZE = 3
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

export const digitsOnly = (value) => String(value || '').replaceAll(/\D/g, '')

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

export const formatNumberWithCommas = (value) => withCommas(digitsOnly(value))

export const formatInputValueWithCommas = (inputEl) => {
  if (typeof document === 'undefined' || !inputEl) {
    return
  }
  inputEl.value = formatNumberWithCommas(inputEl.value)
}

export const unformatInputValue = (inputEl) => {
  if (typeof document === 'undefined' || !inputEl) {
    return
  }
  inputEl.value = digitsOnly(inputEl.value)
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
  bindCommaFormattingToInputs
}

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
    return (str || '').replace(/[^\d]/g, '').trim()
  }

  function parseVal(input) {
    const v = stripCommas(input.value)
    return v === '' ? 0 : parseInt(v, 10) || 0
  }

  function formatNum(n) {
    return n === 0 ? '0' : n.toLocaleString('en-GB')
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
    let rowTotal = 0

    inputs.forEach(function (inp, colIdx) {
      rowTotal += processInput(inp, colIdx, colTotals, numCols)
    })

    const rowTotalCell = row.querySelector('[data-row-total]')
    if (rowTotalCell) {
      rowTotalCell.textContent = formatNum(rowTotal)
    }
  }

  function updateColumnTotals(form, colTotals) {
    let grandTotal = 0
    colTotals.forEach(function (ct, colIdx) {
      grandTotal += ct
      const el = form.querySelector('[data-col-total="' + colIdx + '"]')
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
    const colTotals = new Array(numCols).fill(0)

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
      inp.addEventListener('input', function () {
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
