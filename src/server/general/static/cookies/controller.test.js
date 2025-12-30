import { createServer } from '../../../server.js'
import { statusCodes } from '../../../common/constants/status-codes.js'

describe('#cookiesController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /cookies', () => {
    test('Should render cookies page with success status', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render cookies policy heading', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain(
        'Cookies on Project Application and Funding Service'
      )
    })

    test('Should display intro text about cookies', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain(
        'Cookies are files saved on your phone, tablet or computer when you visit a website.'
      )
      expect(payload).toContain(
        'We use cookies to store information about how you use the Project Application and Funding Service website.'
      )
    })

    test('Should display strictly necessary cookies section', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('Strictly necessary cookies')
      expect(payload).toContain(
        'These essential cookies do things like remember your progress through a form.'
      )
    })

    test('Should display strictly necessary cookies table', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('_pafs_session')
      expect(payload).toContain('cookies_preferences_set')
      expect(payload).toContain('cookies_policy')
    })

    test('Should display cookie details with Name, Purpose, and Expires columns', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('Name')
      expect(payload).toContain('Purpose')
      expect(payload).toContain('Expires')
    })

    test('Should display session cookie expiry info', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('When you close your browser')
    })

    test('Should display 1 year expiry for preference cookies', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('1 year')
    })

    test('Should display analytics cookies section heading', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('Third party cookies that measure website use')
    })

    test('Should display analytics information with Google Analytics mention', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('Google Analytics')
      expect(payload).toContain(
        'We do not allow Google to use or share the data about how you use this site.'
      )
    })

    test('Should display analytics cookie details', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('how you got to the site')
      expect(payload).toContain(
        'the pages you visit on the Project Application and Funding Service'
      )
      expect(payload).toContain('what you click on while you')
    })

    test('Should display link to cookie settings page', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('/cookies/settings')
    })

    test('Should have proper page structure with grid layout', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('govuk-grid-row')
      expect(payload).toContain('govuk-grid-column-full')
    })

    test('Should use govuk-body class for text content', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('govuk-body')
    })

    test('Should render proper heading hierarchy', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('govuk-heading-l')
      expect(payload).toContain('govuk-heading-m')
    })

    test('Should include Cookie settings section', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('Cookie settings')
      expect(payload).toContain('You can choose which cookies you')
    })

    test('Should display bullet list with proper styling', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('govuk-list--bullet')
    })

    test('Should have correct page title set', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('<title>')
      expect(payload).toContain(
        'Cookies on Project Application and Funding Service'
      )
    })

    test('Should render without errors', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toBeTruthy()
      expect(payload.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    test('Should render page with proper HTML structure', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('<!DOCTYPE html>')
      expect(payload).toContain('<html')
      expect(payload).toContain('</html>')
    })

    test('Should have main content section with id', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('id="main-content"')
    })

    test('Should use semantic table for cookie information', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('<table')
      expect(payload).toContain('govuk-table')
    })

    test('Should have table headers with scope', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies'
      })

      expect(payload).toContain('scope="col"')
    })
  })
})
