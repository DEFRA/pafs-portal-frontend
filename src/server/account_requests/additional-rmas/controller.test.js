import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestAdditionalRmasController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/additional-rmas', () => {
    test('Should render additional-rmas page', async () => {
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

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-rmas',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(
          expect.stringContaining('Select additional RMA areas')
        )
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
          payload: { additionalRmas: ['21', '22'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-rmas',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(
          expect.stringContaining('Select additional RMA areas')
        )
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

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-rmas?from=check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(
          expect.stringContaining('Select additional RMA areas')
        )
      }
    })
  })

  describe('POST /account_request/additional-rmas', () => {
    test('Should redirect to check-answers on successful submission', async () => {
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-rmas',
          payload: { additionalRmas: ['21'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/check-answers')
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-rmas',
          payload: { additionalRmas: ['21'], returnTo: 'check-answers' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/check-answers')
      }
    })

    test('Should store data in session on successful submission', async () => {
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

        const response = await server.inject({
          method: 'POST',
          url: '/account_request/additional-rmas',
          payload: { additionalRmas: ['21', '22'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(response.statusCode).toBe(302)
      }
    })

    test('Should handle empty additional RMAs array', async () => {
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

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-rmas',
          payload: { additionalRmas: [] }, // Empty array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
      }
    })

    test('Should handle single additional RMA value (not array)', async () => {
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

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-rmas',
          payload: { additionalRmas: '21' }, // Single value, not array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
      }
    })

    test('Should handle GET request when no main RMA selected', async () => {
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

        // Don't set main RMA - test missing main RMA
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-rmas',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(
          expect.stringContaining('Select additional RMA areas')
        )
      }
    })
  })
})
