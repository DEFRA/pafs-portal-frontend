import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestCheckAnswersController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/check-answers', () => {
    test('Should render check-answers page with EA flow data', async () => {
      // First, set up session data for EA flow
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
          responsibility: 'EA'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        // Set EA main area
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-main-area',
          payload: { mainEaArea: '1' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        // Set EA additional areas
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-additional-areas',
          payload: { additionalEaAreas: ['2'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        // Now check the check-answers page
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Check your details'))
      }
    })

    test('Should render check-answers page with PSO flow data', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'Jane',
          lastName: 'Smith',
          emailAddress: 'jane@example.com',
          telephoneNumber: '0987654321',
          organisation: 'Test Org',
          jobTitle: 'Manager',
          responsibility: 'PSO'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        await server.inject({
          method: 'POST',
          url: '/account_request/main-pso-team',
          payload: { mainPsoTeam: '10' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        await server.inject({
          method: 'POST',
          url: '/account_request/additional-pso-teams',
          payload: { additionalPsoTeams: ['11'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Check your details'))
      }
    })

    test('Should render check-answers page with RMA flow data', async () => {
      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'Bob',
          lastName: 'Johnson',
          emailAddress: 'bob@example.com',
          telephoneNumber: '1122334455',
          organisation: 'Test Org',
          jobTitle: 'Director',
          responsibility: 'RMA'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        await server.inject({
          method: 'POST',
          url: '/account_request/pso-team',
          payload: { psoTeams: ['10'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        await server.inject({
          method: 'POST',
          url: '/account_request/main-rma',
          payload: { mainRma: '20' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        await server.inject({
          method: 'POST',
          url: '/account_request/additional-rmas',
          payload: { additionalRmas: ['21'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Check your details'))
      }
    })
  })

  describe('POST /account_request/check-answers', () => {
    test('Should redirect to confirmation page on successful submission', async () => {
      // Set up session data
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
          responsibility: 'EA'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-main-area',
          payload: { mainEaArea: '1' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        await server.inject({
          method: 'POST',
          url: '/account_request/ea-additional-areas',
          payload: { additionalEaAreas: ['2'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/confirmation')
      }
    })

    test('Should handle check-answers page with minimal data', async () => {
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
          responsibility: 'EA'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      const sessionCookie = cookies?.find((c) => c.startsWith('yar.sid='))

      if (sessionCookie) {
        // Only set main EA area, no additional areas
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-main-area',
          payload: { mainEaArea: '1' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Check your details'))
      }
    })

    test('Should handle check-answers page with empty area selections', async () => {
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
        // Set EA areas but no PSO teams
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Check your details'))
      }
    })
  })
})
