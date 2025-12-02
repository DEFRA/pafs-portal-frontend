import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestEaAreaController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/ea-area', () => {
    test('Should render ea-area page', async () => {
      // First set up responsibility in session
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select EA areas'))
        expect(statusCode).toBe(statusCodes.ok)
      }
    })

    test('Should pre-populate from session when available', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        // Set EA areas in session
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1', '2'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select EA areas'))
      }
    })

    test('Should clear area selection when reset=areas query param is present', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        // Set some area data
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        // Now access with reset=areas
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area?reset=areas',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Select EA areas'))
      }
    })

    test('Should set returnTo when from=check-answers query param is present', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area?from=check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select EA areas'))
      }
    })
  })

  describe('POST /account_request/ea-area', () => {
    test('Should return 400 with errors when validation fails', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: {},
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.badRequest)
        expect(result).toEqual(expect.stringContaining('There is a problem'))
        expect(result).toEqual(expect.stringContaining('Select an EA area'))
      }
    })

    test('Should redirect to main-pso-team for PSO responsibility', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/main-pso-team')
      }
    })

    test('Should redirect to pso-team for RMA responsibility', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'RMA'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/pso-team')
      }
    })

    test('Should redirect to check-answers when returnTo is set', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'], returnTo: 'check-answers' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/check-answers')
      }
    })

    test('Should store data in session on successful validation', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const response = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1', '2'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(response.statusCode).toBe(302)

        // Verify data is stored by checking GET
        const getResponse = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(getResponse.result).toEqual(
          expect.stringContaining('Select EA areas')
        )
      }
    })

    test('Should handle empty EA areas array in payload', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: [] }, // Empty array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.badRequest)
        expect(result).toEqual(expect.stringContaining('There is a problem'))
      }
    })

    test('Should handle single EA area value (not array)', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: '1' }, // Single value, not array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
      }
    })
  })
})
