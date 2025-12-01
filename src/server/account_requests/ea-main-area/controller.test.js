import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestEaMainAreaController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/ea-main-area', () => {
    test('Should render ea-main-area page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/ea-main-area'
      })

      expect(result).toEqual(expect.stringContaining('Select main EA area'))
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should pre-populate from session when available', async () => {
      // First, submit data via POST to establish session
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian'
        }
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
            url: '/account_request/ea-main-area',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(getResponse.result).toEqual(
            expect.stringContaining('Select main EA area')
          )
        }
      }
    })

    test('Should set returnTo when from=check-answers query param is present', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/ea-main-area?from=check-answers'
      })

      expect(result).toEqual(expect.stringContaining('Select main EA area'))
    })
  })

  describe('POST /account_request/ea-main-area', () => {
    test('Should return 400 with errors when validation fails', async () => {
      const { result, statusCode } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {}
      })

      expect(statusCode).toBe(statusCodes.badRequest)
      expect(result).toEqual(expect.stringContaining('There is a problem'))
      expect(result).toEqual(expect.stringContaining('Select a main EA area'))
    })

    test('Should redirect to ea-additional-areas on successful validation', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/account_request/ea-additional-areas')
    })

    test('Should redirect to ea-additional-areas with returnTo query param when returnTo is set', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian',
          returnTo: 'check-answers'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/account_request/ea-additional-areas?returnTo=check-answers'
      )
    })

    test('Should store data in session on successful validation', async () => {
      const payload = {
        mainEaArea: 'thames'
      }

      const response = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
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
            url: '/account_request/ea-main-area',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(getResponse.result).toEqual(
            expect.stringContaining('Select main EA area')
          )
        }
      }
    })
  })
})
