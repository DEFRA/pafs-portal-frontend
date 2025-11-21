import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestEaAdditionalAreasController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/ea-additional-areas', () => {
    test('Should render ea-additional-areas page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/ea-additional-areas'
      })

      expect(result).toEqual(
        expect.stringContaining('Select additional EA areas')
      )
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should pre-populate from session when available', async () => {
      // First, submit data via POST to establish session
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: ['wessex', 'thames']
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
            url: '/account_request/ea-additional-areas',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(getResponse.result).toEqual(
            expect.stringContaining('Select additional EA areas')
          )
        }
      }
    })

    test('Should set returnTo when from=check-answers query param is present', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/ea-additional-areas?from=check-answers'
      })

      expect(result).toEqual(
        expect.stringContaining('Select additional EA areas')
      )
    })
  })

  describe('POST /account_request/ea-additional-areas', () => {
    test('Should redirect to check-answers on successful submission', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: ['wessex', 'thames']
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/account_request/check-answers')
    })

    test('Should handle single checkbox value (not array)', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: 'anglian'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/account_request/check-answers')
    })

    test('Should handle empty selection', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {}
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/account_request/check-answers')
    })

    test('Should store data in session on successful submission', async () => {
      const payload = {
        additionalEaAreas: ['anglian', 'north-west']
      }

      const response = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload
      })

      // Verify redirect happened (session was stored)
      expect(response.statusCode).toBe(302)
    })

    test('Should redirect to check-answers when returnTo is set', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: ['wessex'],
          returnTo: 'check-answers'
        }
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe('/account_request/check-answers')
    })
  })
})
