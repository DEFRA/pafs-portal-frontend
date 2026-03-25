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
    if (n > GROUP_SIZE) out += ','
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
