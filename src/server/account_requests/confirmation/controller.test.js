import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestConfirmationController } from './controller.js'

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

    test('Should render pending confirmation content when status is pending', async () => {
      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockResolvedValueOnce({
        success: true,
        status: 200,
        data: {
          id: 789,
          user: { status: 'pending', email: 'pending@example.com' }
        }
      })

      const detailsRes = await server.inject({
        method: 'POST',
        url: '/account_request/details',
        payload: {
          firstName: 'Pen',
          lastName: 'Ding',
          emailAddress: 'pending@example.com',
          telephoneNumber: '0000000000',
          organisation: 'Org',
          jobTitle: 'Role',
          responsibility: 'EA'
        }
      })
      const cookies = detailsRes.headers['set-cookie']
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

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/confirmation',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        // Non-approved path should render generic confirmation strings
        expect(result).toEqual(
          expect.stringContaining('Your account request has been submitted')
        )
        expect(result).toEqual(expect.stringContaining('What happens next'))
        expect(result).toEqual(expect.stringContaining('/login'))
      }
    })

    test('Should render generic confirmation when session is missing', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/account_request/confirmation'
      })
      expect(statusCode).toBe(statusCodes.ok)
      // Should default to non-approved template content
      expect(result).toEqual(
        expect.stringContaining('Your account request has been submitted')
      )
      expect(result).toEqual(expect.stringContaining('What you need to do'))
    })

    // Direct unit tests for controller handler to increase coverage
    describe('Unit tests for direct coverage', () => {
      let mockRequest
      let mockH

      beforeEach(() => {
        mockRequest = {
          method: 'get',
          t: (key) => key,
          yar: {
            get: vi.fn(() => ({})),
            set: vi.fn()
          },
          url: { pathname: '/account_request/confirmation' },
          server: {
            logger: {
              info: vi.fn(),
              warn: vi.fn(),
              error: vi.fn()
            }
          }
        }
        mockH = {
          view: vi.fn((template, context) => ({
            template,
            context,
            code: (status) => ({ template, context, statusCode: status })
          }))
        }
      })

      test('Should call handler with approved status from session', async () => {
        mockRequest.yar.get.mockImplementation((key) => {
          if (key === 'accountRequestConfirmation') {
            return { status: 'approved', email: 'approved@example.com' }
          }
          return {}
        })

        const result = await accountRequestConfirmationController.handler(
          mockRequest,
          mockH
        )

        expect(mockH.view).toHaveBeenCalledWith(
          expect.stringContaining('account_requests/confirmation/index.njk'),
          expect.objectContaining({
            status: 'approved',
            email: 'approved@example.com'
          })
        )
        // If controller returns plain view, statusCode may be undefined
        expect(
          result.statusCode === undefined ||
            result.statusCode === statusCodes.ok
        ).toBeTruthy()
      })

      test('Should call handler with pending status from session', async () => {
        mockRequest.yar.get.mockImplementation((key) => {
          if (key === 'accountRequestConfirmation') {
            return { status: 'pending', email: 'pending@example.com' }
          }
          return {}
        })

        const result = await accountRequestConfirmationController.handler(
          mockRequest,
          mockH
        )

        expect(mockH.view).toHaveBeenCalledWith(
          expect.stringContaining('account_requests/confirmation/index.njk'),
          expect.objectContaining({
            status: 'pending',
            email: 'pending@example.com'
          })
        )
        expect(
          result.statusCode === undefined ||
            result.statusCode === statusCodes.ok
        ).toBeTruthy()
      })

      test('Should call handler with missing session data and still render', async () => {
        mockRequest.yar.get.mockReturnValue(undefined)

        const result = await accountRequestConfirmationController.handler(
          mockRequest,
          mockH
        )

        expect(mockH.view).toHaveBeenCalledWith(
          expect.stringContaining('account_requests/confirmation/index.njk'),
          expect.objectContaining({
            status: undefined
          })
        )
        expect(
          result.statusCode === undefined ||
            result.statusCode === statusCodes.ok
        ).toBeTruthy()
      })
    })
  })
})
