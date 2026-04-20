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

setupHeaderNavigation()

// ── Programme download – progressive enhancement polling ─────────────────────
//
// When the page shows a "generating" state the module polls a JSON endpoint
// every 3 seconds and updates the UI without a full page reload.
// Without JS the view falls back to a <noscript> meta-refresh.
//
// Activated by: [data-module="programme-download"][data-download-status="generating"]

export function initProgrammeDownloadPolling() {
  const el = document.querySelector('[data-module="programme-download"]')
  if (!el || el.dataset.downloadStatus !== 'generating') return

  const pollUrl = el.dataset.pollUrl
  const isAdmin = el.dataset.isAdmin === 'true'
  if (!pollUrl) return

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
        if (consecutiveErrors >= 3) clearInterval(timer)
        return
      }

      consecutiveErrors = 0
      const data = await res.json()

      // Update the progress text/bar while still generating
      if (data.status === 'generating') {
        if (progressMessage && data.progressMessage) {
          progressMessage.textContent = data.progressMessage
        }

        if (isAdmin && data.progressTotal > 0) {
          const pct = Math.round(
            (data.progressCurrent / data.progressTotal) * 100
          )

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
        return
      }

      // Status changed – do a full reload to render the correct server-side partial
      clearInterval(timer)
      window.location.reload()
    } catch (_err) {
      consecutiveErrors++
      if (consecutiveErrors >= 3) clearInterval(timer)
    }
  }

  const timer = setInterval(poll, 3000)
}

initProgrammeDownloadPolling()

bindCommaFormattingToInputs(
  '[data-number-format="comma"], [data-wlc-cost-input="true"]',
  { unformatOnSubmit: true }
)
