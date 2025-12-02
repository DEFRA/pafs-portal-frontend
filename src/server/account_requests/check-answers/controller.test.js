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

  describe('Unit tests for direct coverage', () => {
    let mockRequest
    let mockH
    let consoleLogSpy

    beforeEach(() => {
      consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

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
        view: vi.fn((template, context) => ({ template, context })),
        redirect: vi.fn((url) => ({ url, statusCode: 302 }))
      }
    })

    afterEach(() => {
      consoleLogSpy.mockRestore()
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
      expect(consoleLogSpy).toHaveBeenCalled()
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
  })
})
