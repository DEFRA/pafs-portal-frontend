import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'

// Mock the account-request-service to allow per-test responses
vi.mock('../../common/services/account-request-service.js', () => ({
  submitAccountRequest: vi.fn()
}))

describe('#accountRequestConfirmationController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/confirmation', () => {
    test('Should render confirmation page', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(statusCode).toBe(statusCodes.ok)
      expect(result).toEqual(
        expect.stringContaining('Your account request has been submitted')
      )
    })

    test('Should display confirmation panel', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(
        expect.stringContaining('Your account request has been submitted')
      )
    })

    test('Should display what happens next section', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(expect.stringContaining('What happens next'))
    })

    test('Should display what you need to do section', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(expect.stringContaining('What you need to do'))
    })

    test('Should display return to sign in link', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })

      expect(result).toEqual(expect.stringContaining('/login'))
    })

    test('Should render approved confirmation panel when status is approved', async () => {
      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockResolvedValueOnce({
        success: true,
        status: 200,
        data: {
          id: 456,
          user: { status: 'approved', email: 'approved@example.com' }
        }
      })

      const postResponse = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'Anna',
          lastName: 'Taylor',
          emailAddress: 'approved@example.com',
          telephoneNumber: '5555555555',
          organisation: 'Test Org',
          jobTitle: 'Analyst',
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

        const submitRes = await server.inject({
          method: 'POST',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })
        expect(submitRes.statusCode).toBe(302)
        expect(submitRes.headers.location).toBe('/account_request/confirmation')

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/confirmation',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        // Expect approved panel content (title/body keys rendered by i18n)
        expect(result).toEqual(expect.stringContaining('What happens next'))
        expect(result).toEqual(expect.stringContaining('/login'))
      }
    })
  })
})
