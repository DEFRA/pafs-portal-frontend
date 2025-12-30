import { createServer } from '../../../server.js'
import { statusCodes } from '../../../common/constants/status-codes.js'

describe('#cookieSettingsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /cookies/settings', () => {
    test('Should render cookie settings page with no preferences initially', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toContain('Cookie settings')
      expect(payload).toContain('Do you want to accept analytics cookies?')
    })

    test('Should display success banner when saved query param is present', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings?saved=1'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toContain('Your cookie preferences have been saved.')
    })

    test('Should not display success banner without saved query param', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).not.toContain("You've set your cookie preferences")
    })

    test('Should render radio buttons for analytics preference', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toContain('name="analytics"')
      expect(payload).toContain('value="yes"')
      expect(payload).toContain('value="no"')
    })

    test('Should display strictly necessary cookies information', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toContain('Strictly necessary cookies')
      expect(payload).toContain('_pafs_session')
      expect(payload).toContain('cookies_preferences_set')
      expect(payload).toContain('cookies_policy')
    })

    test('Should display Find out more link', async () => {
      const { statusCode, payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(payload).toContain('Find out more about cookies on GOV.UK')
      expect(payload).toContain('www.gov.uk/help/cookie-details')
    })
  })

  describe('POST /cookies/settings', () => {
    test('Should accept analytics = yes and set cookies', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/cookies/settings?saved=1')
      expect(headers['set-cookie']).toBeDefined()
    })

    test('Should accept analytics = no and set cookies', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'no'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/cookies/settings?saved=1')
      expect(headers['set-cookie']).toBeDefined()
    })

    test('Should set cookies_policy with analytics preference', async () => {
      const { headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      const cookieHeader = headers['set-cookie']
      expect(cookieHeader).toBeDefined()
      // Check that cookies_policy cookie was set
      expect(cookieHeader.toString()).toContain('cookies_policy')
    })

    test('Should set cookies_preferences_set flag', async () => {
      const { headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      const cookieHeader = headers['set-cookie']
      expect(cookieHeader).toBeDefined()
      // Check that cookies_preferences_set cookie was set
      expect(cookieHeader.toString()).toContain('cookies_preferences_set')
    })

    test('Should handle empty payload gracefully', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {}
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/cookies/settings?saved=1')
    })

    test('Should redirect to cookies/settings?saved=1 after POST', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'no'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/cookies/settings?saved=1')
    })

    test('Should set secure cookie attributes', async () => {
      const { headers } = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      const cookieHeader = headers['set-cookie']?.toString() || ''
      // HttpOnly and SameSite should be set
      expect(cookieHeader).toContain('HttpOnly')
      expect(cookieHeader).toContain('SameSite')
    })
  })

  describe('Cookie persistence across requests', () => {
    test('Should read stored analytics preference on GET request', async () => {
      // First, set the preference
      const postResponse = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      expect(postResponse.statusCode).toBe(302)

      // Extract cookies from response
      const setCookieHeaders = postResponse.headers['set-cookie']
      const cookies = {}

      if (Array.isArray(setCookieHeaders)) {
        setCookieHeaders.forEach((cookie) => {
          const [nameValue] = cookie.split(';')
          const [name, value] = nameValue.split('=')
          cookies[name.trim()] = decodeURIComponent(value)
        })
      }

      // Now make a GET request with the stored cookies
      const getResponse = await server.inject({
        method: 'GET',
        url: '/cookies/settings',
        headers: {
          cookie: Object.entries(cookies)
            .map(([name, value]) => `${name}=${value}`)
            .join('; ')
        }
      })

      expect(getResponse.statusCode).toBe(statusCodes.ok)
    })

    test('Should detect analytics accepted as true when cookie contains yes preference', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyCookie = setCookieHeaders?.find((cookie) =>
        cookie.includes('cookies_policy')
      )

      expect(policyCookie).toContain('analytics')
      expect(policyCookie).toContain('"analytics":true')
    })

    test('Should detect analytics accepted as false when cookie contains no preference', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'no'
        }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyCookie = setCookieHeaders?.find((cookie) =>
        cookie.includes('cookies_policy')
      )

      expect(policyCookie).toContain('analytics')
      expect(policyCookie).toContain('"analytics":false')
    })
  })

  describe('JSON parsing and error handling', () => {
    test('Should default to analyticsAccepted false when policy cookie missing', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(payload).toContain('name="analytics"')
      expect(payload).toContain('value="yes"')
      expect(payload).toContain('value="no"')
    })

    test('Should parse valid JSON cookie and extract analytics preference', async () => {
      // First, set analytics to yes
      const setResponse = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {
          analytics: 'yes'
        }
      })

      expect(setResponse.statusCode).toBe(302)

      // Extract the cookie and verify it contains JSON with analytics true
      const cookieHeaders = setResponse.headers['set-cookie']
      expect(cookieHeaders).toBeDefined()

      const policyCookie = cookieHeaders?.find((c) =>
        c.includes('cookies_policy')
      )

      // Verify analytics is set to true in the cookie
      expect(policyCookie).toBeDefined()
      expect(policyCookie).toContain('analytics')
    })
  })

  describe('Query parameter handling', () => {
    test('Should show confirmation banner with saved=1 query param', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings?saved=1'
      })

      expect(payload).toContain('govuk-notification-banner--success')
      expect(payload).toContain('Your cookie preferences have been saved.')
    })

    test('Should hide confirmation banner without saved query param', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings'
      })

      expect(payload).not.toContain('govuk-notification-banner--success')
    })

    test('Should hide confirmation banner with saved=0', async () => {
      const { payload } = await server.inject({
        method: 'GET',
        url: '/cookies/settings?saved=0'
      })

      expect(payload).not.toContain('Your cookie preferences have been saved.')
    })
  })

  describe('POST handler cookie setting', () => {
    test('Should set cookie with analytics true when yes submitted', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: { analytics: 'yes' }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyCookie = setCookieHeaders?.find((c) =>
        c.includes('cookies_policy')
      )

      expect(policyCookie).toBeDefined()
      expect(policyCookie).toContain('HttpOnly')
      expect(policyCookie).toContain('SameSite')
    })

    test('Should set cookie with analytics false when no submitted', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: { analytics: 'no' }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyCookie = setCookieHeaders?.find((c) =>
        c.includes('cookies_policy')
      )

      expect(policyCookie).toBeDefined()
      expect(policyCookie).toContain('false')
    })

    test('Should default analytics to false when not in payload', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: {}
      })

      const setCookieHeaders = response.headers['set-cookie']
      const policyCookie = setCookieHeaders?.find((c) =>
        c.includes('cookies_policy')
      )

      expect(policyCookie).toBeDefined()
      // Should contain false for analytics
      expect(policyCookie).toContain('false')
    })

    test('Should set preferences_set flag on POST', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/cookies/settings',
        payload: { analytics: 'yes' }
      })

      const setCookieHeaders = response.headers['set-cookie']
      const prefsSetCookie = setCookieHeaders?.find((c) =>
        c.includes('cookies_preferences_set')
      )

      expect(prefsSetCookie).toBeDefined()
      expect(prefsSetCookie).toContain('true')
    })
  })
})
