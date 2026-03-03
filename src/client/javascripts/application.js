import {
  createAll,
  Button,
  CharacterCount,
  Checkboxes,
  ErrorSummary,
  PasswordInput,
  Radios,
  ServiceNavigation,
  SkipLink
} from 'govuk-frontend'

createAll(Button)
createAll(CharacterCount)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(PasswordInput)
createAll(Radios)
createAll(ServiceNavigation)
createAll(SkipLink)

// Custom header navigation toggle for mobile (v5-style navigation in v6)
const headerToggleButton = document.querySelector('.govuk-js-header-toggle')
if (headerToggleButton) {
  const navigationWrapper = document.querySelector(
    '.govuk-header__navigation-list-wrapper'
  )

  headerToggleButton.removeAttribute('hidden')
  headerToggleButton.setAttribute('aria-expanded', 'false')

  headerToggleButton.addEventListener('click', function () {
    const isOpen = this.getAttribute('aria-expanded') === 'true'
    this.setAttribute('aria-expanded', isOpen ? 'false' : 'true')

    if (navigationWrapper) {
      navigationWrapper.classList.toggle(
        'govuk-header__navigation-list-wrapper--open'
      )
    }
  })
}
