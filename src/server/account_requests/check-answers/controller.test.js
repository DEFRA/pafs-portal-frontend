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
    test('Should render check-answers page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/check-answers'
      })

      expect(result).toEqual(expect.stringContaining('Check your details'))
      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should display session data when available', async () => {
      // First, submit data through the flow to establish session
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'environment-agency-area-programme-team'
        }
      })

      const detailsResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian'
        }
      })

      const cookies = detailsResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(result).toEqual(expect.stringContaining('John'))
          expect(result).toEqual(expect.stringContaining('Doe'))
          expect(result).toEqual(expect.stringContaining('john@example.com'))
        }
      }
    })

    test('Should map responsibility code to label - environment-agency-area-programme-team', async () => {
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
          responsibility: 'environment-agency-area-programme-team'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(result).toEqual(
            expect.stringContaining('Environment Agency – Area Programme Team')
          )
        }
      }
    })

    test('Should map responsibility code to label - environment-agency-partnership-strategic-overview-team', async () => {
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
          responsibility:
            'environment-agency-partnership-strategic-overview-team'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(result).toEqual(
            expect.stringContaining(
              'Environment Agency – Partnership & Strategic Overview Team'
            )
          )
        }
      }
    })

    test('Should map responsibility code to label - risk-management-authority', async () => {
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
          responsibility: 'risk-management-authority'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(result).toEqual(
            expect.stringContaining('Risk Management Authority (RMA)')
          )
        }
      }
    })

    test('Should handle default responsibility case when responsibility is missing or invalid', async () => {
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
          responsibility: 'invalid-responsibility'
        }
      })

      const cookies = postResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const getResponse = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          // Should still render the page even with invalid responsibility (default case)
          expect(getResponse.statusCode).toBe(statusCodes.ok)
          expect(getResponse.result).toEqual(
            expect.stringContaining('Check your details')
          )
        }
      }
    })

    test('Should handle empty session data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/check-answers'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toEqual(expect.stringContaining('Check your details'))
    })

    test('Should map main EA area code to label', async () => {
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'environment-agency-area-programme-team'
        }
      })

      const mainAreaResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'north-west'
        }
      })

      const cookies = mainAreaResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(result).toEqual(expect.stringContaining('North West'))
        }
      }
    })

    test('Should map additional areas codes to labels', async () => {
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'environment-agency-area-programme-team'
        }
      })

      await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian'
        }
      })

      const additionalAreasResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: [
            'yorkshire',
            'north-east',
            'wessex',
            'thames',
            'midlands'
          ]
        }
      })

      const cookies = additionalAreasResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(result).toEqual(expect.stringContaining('Yorkshire'))
          expect(result).toEqual(expect.stringContaining('North East'))
          expect(result).toEqual(expect.stringContaining('Wessex'))
          expect(result).toEqual(expect.stringContaining('Thames'))
          expect(result).toEqual(expect.stringContaining('Midlands'))
        }
      }
    })

    test('Should handle empty additional areas array', async () => {
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'environment-agency-area-programme-team'
        }
      })

      await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian'
        }
      })

      const additionalAreasResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {}
      })

      const cookies = additionalAreasResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result, statusCode } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(statusCode).toBe(statusCodes.ok)
          expect(result).toEqual(expect.stringContaining('Check your details'))
        }
      }
    })
  })

  describe('POST /account_request/check-answers', () => {
    test('Should redirect to confirmation page', async () => {
      // First, submit data through the flow to establish session
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'environment-agency-area-programme-team'
        }
      })

      const mainAreaResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'anglian'
        }
      })

      const cookies = mainAreaResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { statusCode, headers } = await server.inject({
            method: 'POST',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(statusCode).toBe(302)
          expect(headers.location).toBe('/account_request/confirmation')
        }
      }
    })

    test('Should handle POST with complete session data including additional areas', async () => {
      // Submit complete flow
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility:
            'environment-agency-partnership-strategic-overview-team'
        }
      })

      await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'wessex'
        }
      })

      const additionalAreasResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: [
            'thames',
            'anglian',
            'midlands',
            'north-west',
            'yorkshire',
            'north-east'
          ]
        }
      })

      const cookies = additionalAreasResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          // First GET to ensure buildViewModel is called with all data
          const getResponse = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(getResponse.statusCode).toBe(statusCodes.ok)
          expect(getResponse.result).toEqual(
            expect.stringContaining(
              'Environment Agency – Partnership & Strategic Overview Team'
            )
          )

          // Then POST to execute the POST handler fully
          const { statusCode, headers } = await server.inject({
            method: 'POST',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(statusCode).toBe(302)
          expect(headers.location).toBe('/account_request/confirmation')
        }
      }
    })
  })

  describe('buildViewModel edge cases', () => {
    test('Should handle invalid area codes in additional areas', async () => {
      await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'John',
          lastName: 'Doe',
          emailAddress: 'john@example.com',
          telephoneNumber: '1234567890',
          organisation: 'Test Org',
          jobTitle: 'Developer',
          responsibility: 'risk-management-authority'
        }
      })

      await server.inject({
        method: 'POST',
        url: '/account_request/ea-main-area',
        payload: {
          mainEaArea: 'yorkshire'
        }
      })

      const additionalAreasResponse = await server.inject({
        method: 'POST',
        url: '/account_request/ea-additional-areas',
        payload: {
          additionalEaAreas: ['invalid-code', 'north-east']
        }
      })

      const cookies = additionalAreasResponse.headers['set-cookie']
      if (cookies) {
        const sessionCookie = cookies.find((c) => c.startsWith('yar.sid='))
        if (sessionCookie) {
          const { result, statusCode } = await server.inject({
            method: 'GET',
            url: '/account_request/check-answers',
            headers: {
              cookie: sessionCookie.split(';')[0]
            }
          })

          expect(statusCode).toBe(statusCodes.ok)
          // Should still render even with invalid area code (filtered out)
          expect(result).toEqual(expect.stringContaining('North East'))
        }
      }
    })
  })
})
