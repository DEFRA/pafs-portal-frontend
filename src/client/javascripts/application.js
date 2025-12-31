import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  PasswordInput,
  Radios,
  ServiceNavigation,
  SkipLink
} from 'govuk-frontend'

createAll(Button)
createAll(Checkboxes)
createAll(ErrorSummary)
createAll(Header)
createAll(PasswordInput)
createAll(Radios)
createAll(ServiceNavigation)
createAll(SkipLink)

// Cookie banner hide functionality
const hideButtons = document.querySelectorAll('[data-hide-cookie-banner]')

hideButtons.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault()
    const cookieBanner = button.closest('.govuk-cookie-banner')
    if (cookieBanner) {
      cookieBanner.style.display = 'none'
    }
  })
})
