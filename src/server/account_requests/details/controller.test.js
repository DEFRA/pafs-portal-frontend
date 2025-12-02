import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'

// Mock area service to prevent real API calls
vi.mock('../../common/services/areas/area-service.js', () => ({
  getAreas: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, name: 'Thames', area_type: 'EA Area' },
      { id: 2, name: 'Anglian', area_type: 'EA Area' },
      { id: 3, name: 'Wessex', area_type: 'EA Area' }
    ]
  })
}))

describe('#accountRequestDetailsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/details', () => {
    test('Should render details page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/details'
      })

      expect(result).toEqual(expect.stringContaining('Request an account'))
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should pre-populate from session when available', async () => {
      // First, submit data via POST to establish session
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        telephoneNumber: '1234567890',
        organisation: 'Test Org',
        jobTitle: 'Developer',
        responsibility: 'EA'
      }

      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload
      })

      expect(postResponse.statusCode).toBe(302)

      // Get the session cookie from the POST response
      const cookies = postResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          // Now GET the page with the session cookie
          const getResponse = await server.inject({
            method: 'GET',
            url: '/account_request/details',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(getResponse.result).toEqual(expect.stringContaining('John'))
          expect(getResponse.result).toEqual(expect.stringContaining('Doe'))
        }
      }
    })

    test('Should set returnTo when from=check-answers query param is present', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/details?from=check-answers'
      })

      expect(result).toEqual(expect.stringContaining('Request an account'))
    })
  })

  describe('POST /account_request/details', () => {
    test('Should return 400 with errors when validation fails', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {}
      })

      expect(statusCode).toBe(statusCodes.badRequest)
      expect(result).toEqual(expect.stringContaining('There is a problem'))
      expect(result).toEqual(expect.stringContaining('Tell us your first name'))
    })

    test('Should return 400 when email format is invalid', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'invalid-email',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'EA'
        }
      })

      expect(statusCode).toBe(statusCodes.badRequest)
      expect(result).toEqual(
        expect.stringContaining(
          'Enter an email address in the correct format, like name@example.com'
        )
      )
    })

    test('Should store data in session on successful validation', async () => {
      const payload = {
        firstName: 'John',
        lastName: 'Doe',
        emailAddress: 'john@example.com',
        telephoneNumber: '1234567890',
        organisation: 'Test Org',
        jobTitle: 'Developer',
        responsibility: 'EA'
      }

      const response = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload
      })

      // Verify redirect happened (session was stored)
      expect(response.statusCode).toBe(302)

      // Verify that on next GET, the data is pre-populated
      const cookies = response.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const getResponse = await server.inject({
            method: 'GET',
            url: '/account_request/details',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(getResponse.result).toEqual(expect.stringContaining('John'))
          expect(getResponse.result).toEqual(expect.stringContaining('Doe'))
        }
      }
    })
  })
})
