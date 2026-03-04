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
