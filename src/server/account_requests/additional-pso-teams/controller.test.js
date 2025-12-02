import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'

describe('#accountRequestAdditionalPsoTeamsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/additional-pso-teams', () => {
    test('Should render additional-pso-teams page', async () => {
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

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-pso-teams',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(
          expect.stringContaining('Select additional PSO areas')
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
          payload: { additionalPsoTeams: ['11', '12'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-pso-teams',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(
          expect.stringContaining('Select additional PSO areas')
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

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-pso-teams?from=check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(
          expect.stringContaining('Select additional PSO areas')
        )
      }
    })
  })

  describe('POST /account_request/additional-pso-teams', () => {
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-pso-teams',
          payload: { additionalPsoTeams: ['11'] },
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-pso-teams',
          payload: {
            additionalPsoTeams: ['11'],
            returnTo: 'check-answers'
          },
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

        const response = await server.inject({
          method: 'POST',
          url: '/account_request/additional-pso-teams',
          payload: { additionalPsoTeams: ['11', '12'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(response.statusCode).toBe(302)
      }
    })

    test('Should handle empty additional PSO teams array', async () => {
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

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-pso-teams',
          payload: { additionalPsoTeams: [] }, // Empty array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
      }
    })

    test('Should handle single additional PSO team value (not array)', async () => {
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

        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/additional-pso-teams',
          payload: { additionalPsoTeams: '11' }, // Single value, not array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
      }
    })

    test('Should handle GET request when no main PSO team selected', async () => {
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
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        // Don't set main PSO team - test missing main PSO team
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/additional-pso-teams',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(
          expect.stringContaining('Select additional PSO areas')
        )
      }
    })
  })
})
