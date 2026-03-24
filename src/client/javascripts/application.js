import { initAll } from 'govuk-frontend'

initAll()

// Custom header navigation toggle for mobile (v5-style navigation in v6)
const ARIA_EXPANDED = 'aria-expanded'
const headerToggleButton = document.querySelector('.govuk-js-header-toggle')
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

// Public number formatting helpers for reuse across sections
const digitsOnly = (value) => String(value || '').replace(/\D/g, '')

const withCommas = (digits) => {
  if (!digits) {
    return ''
  }
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

const formatNumberWithCommas = (value) => withCommas(digitsOnly(value))

const formatInputValueWithCommas = (inputEl) => {
  if (!inputEl) {
    return
  }
  inputEl.value = formatNumberWithCommas(inputEl.value)
}

const unformatInputValue = (inputEl) => {
  if (!inputEl) {
    return
  }
  inputEl.value = digitsOnly(inputEl.value)
}

const bindCommaFormattingToInputs = (selector, options = {}) => {
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
