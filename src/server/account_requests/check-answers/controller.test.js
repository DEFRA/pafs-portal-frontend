import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestCheckAnswersController } from './controller.js'

// Mock area service to prevent real API calls
vi.mock('../../common/services/areas/area-service.js', () => ({
  getAreas: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, name: 'Thames', area_type: 'EA Area' },
      { id: 2, name: 'Anglian', area_type: 'EA Area' },
      { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
      { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
    ]
  })
}))

// Mock account-request-helpers
vi.mock('../../common/helpers/account-request-helpers.js', () => ({
  prepareAccountRequestPayload: vi.fn((sessionData) => ({
    user: sessionData.details || {},
    areas: []
  }))
}))

// Mock account-request-service
vi.mock('../../common/services/account-request-service.js', () => ({
  submitAccountRequest: vi.fn().mockResolvedValue({
    success: true,
    status: 200,
    data: { id: 123, user: { status: 'pending', email: 'john@example.com' } }
  })
}))

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

    test('Should set confirmation context in session on successful submission', async () => {
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
        const res = await server.inject({
          method: 'POST',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })
        expect(res.statusCode).toBe(302)
        // Follow redirect to confirmation to ensure session was set
        const confRes = await server.inject({
          method: 'GET',
          url: '/account_request/confirmation',
          headers: { cookie: sessionCookie.split(';')[0] }
        })
        expect(confRes.statusCode).toBe(statusCodes.ok)
        expect(confRes.result).toEqual(expect.stringContaining('/login'))
      }
    })

    test('Should display retry error message when API returns 400', async () => {
      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockResolvedValueOnce({
        success: false,
        status: 400,
        errors: [{ message: 'Validation error' }]
      })

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
        const res = await server.inject({
          method: 'POST',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(res.statusCode).toBe(statusCodes.badRequest)
        expect(res.result).toEqual(
          expect.stringContaining(
            'There was a problem submitting your request. Please try again.'
          )
        )
      }
    })

    test('Should display later error message when API throws exception (500)', async () => {
      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockRejectedValueOnce(new Error('Network failure'))

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
        const res = await server.inject({
          method: 'POST',
          url: '/account_request/check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(res.statusCode).toBe(statusCodes.internalServerError)
        expect(res.result).toEqual(
          expect.stringContaining(
            'There was a problem submitting your request. Please try again later.'
          )
        )
      }
    })
  })

  describe('Unit tests for direct coverage', () => {
    let mockRequest
    let mockH

    beforeEach(async () => {
      mockRequest = {
        method: 'get',
        t: vi.fn((key) => key),
        yar: {
          get: vi.fn(() => ({})),
          set: vi.fn()
        },
        query: {},
        url: {
          pathname: '/account_request/check-answers'
        },
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
        })),
        redirect: vi.fn((url) => ({ url, statusCode: 302 }))
      }

      // Reset and set submitAccountRequest to a successful response for each test in this block
      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockReset()
      submitAccountRequest.mockResolvedValue({
        success: true,
        status: 200,
        data: {
          user: { status: 'pending', email: 'john@example.com' },
          areas: []
        }
      })
    })

    test('Should call handler for GET request', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalled()
    })

    test('Should call handler for POST request', async () => {
      mockRequest.method = 'post'
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' }
      })

      const result = await accountRequestCheckAnswersController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/confirmation'
      )
      expect(mockRequest.yar.set).toHaveBeenCalledWith('accountRequest', {})
    })

    test('Should handle GET when areas API throws an error', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle GET when areas API returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with EA flow data', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'EA',
          firstName: 'John',
          lastName: 'Doe'
        },
        eaMainArea: { mainEaArea: '1' },
        eaAdditionalAreas: { additionalEaAreas: ['2'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 2, name: 'Anglian', area_type: 'EA Area' }
      ])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with PSO flow data', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'PSO',
          firstName: 'Jane',
          lastName: 'Smith'
        },
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: { additionalPsoTeams: ['11'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with RMA flow data', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'RMA',
          firstName: 'Bob',
          lastName: 'Johnson'
        },
        eaArea: { eaAreas: ['1'] },
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: { additionalRmas: ['21'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with unknown responsibility', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'UNKNOWN'
        }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with empty area selections for EA flow', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'EA'
        },
        eaMainArea: {},
        eaAdditionalAreas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with empty area selections for PSO flow', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'PSO'
        },
        eaArea: {},
        mainPsoTeam: {},
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with empty area selections for RMA flow', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'RMA'
        },
        eaArea: {},
        psoTeam: {},
        mainRma: {},
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET when areaId is null in getAreaName', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'EA'
        },
        eaMainArea: { mainEaArea: null },
        eaAdditionalAreas: { additionalEaAreas: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET when areaIds is not an array in getAreaNames', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'PSO'
        },
        eaArea: { eaAreas: null }, // Not an array
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: { additionalPsoTeams: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET when areaIds is empty array in getAreaNames', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'PSO'
        },
        eaArea: { eaAreas: [] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: { additionalPsoTeams: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST with logging', async () => {
      mockRequest.method = 'post'
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'EA',
          firstName: 'John'
        },
        eaMainArea: { mainEaArea: '1' }
      })

      // Ensure successful API submission to avoid error view path
      vi.spyOn(
        await import('../../common/services/account-request-service.js'),
        'submitAccountRequest'
      ).mockResolvedValueOnce({
        success: true,
        status: 200,
        data: { user: { status: 'pending', email: 'john@example.com' } }
      })

      const result = await accountRequestCheckAnswersController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockRequest.server.logger.info).toHaveBeenCalled()
    })

    test('Should handle GET when getAreaById returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'EA'
        },
        eaMainArea: { mainEaArea: '999' }, // Non-existent area
        eaAdditionalAreas: { additionalEaAreas: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET when getAreaNames filters empty names', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: {
          responsibility: 'PSO'
        },
        eaArea: { eaAreas: ['999'] }, // Non-existent area
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: { additionalPsoTeams: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestCheckAnswersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('POST should render 400 error view when API returns validation error', async () => {
      mockRequest.method = 'post'
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' },
        eaMainArea: { mainEaArea: '1' }
      })

      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockResolvedValueOnce({
        success: false,
        status: 400,
        errors: [{ message: 'Validation error' }]
      })

      const result = await accountRequestCheckAnswersController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('account_requests/check-answers/index.njk'),
        expect.objectContaining({
          error: expect.stringContaining('Please try again.')
        })
      )
    })

    test('POST should render 500 error view when API throws and areas loader throws', async () => {
      mockRequest.method = 'post'
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' },
        eaMainArea: { mainEaArea: '1' }
      })

      // Force submit to throw
      const { submitAccountRequest } =
        await import('../../common/services/account-request-service.js')
      submitAccountRequest.mockRejectedValueOnce(new Error('boom'))

      // Force areas loader to throw inside buildErrorView
      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValueOnce(new Error('cache boom'))

      const result = await accountRequestCheckAnswersController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.internalServerError)
      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('account_requests/check-answers/index.njk'),
        expect.objectContaining({
          error: expect.stringContaining('Please try again later.')
        })
      )
    })

    test('GET should handle undefined responsibility with default summary', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: { firstName: 'No', lastName: 'Resp' }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      const result = await accountRequestCheckAnswersController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBeUndefined() // view without .code defaults to undefined
      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('account_requests/check-answers/index.njk'),
        expect.objectContaining({
          summaryData: expect.any(Object)
        })
      )
    })
  })
})
