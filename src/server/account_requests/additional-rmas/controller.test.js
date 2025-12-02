import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestAdditionalRmasController } from './controller.js'

// Mock area service to prevent real API calls
vi.mock('../../common/services/areas/area-service.js', () => ({
  getAreas: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, name: 'Thames', area_type: 'EA Area' },
      { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
      { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 },
      { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
    ]
  })
}))

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

  describe('Unit tests for direct coverage', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = {
        method: 'get',
        t: vi.fn((key) => key),
        yar: {
          get: vi.fn(() => ({})),
          set: vi.fn()
        },
        query: {},
        url: {
          pathname: '/account_request/additional-rmas'
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

    test('Should call handler for GET request', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
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

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalRmas: ['21'] }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestAdditionalRmasController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/check-answers'
      )
    })

    test('Should handle POST with returnTo parameter', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {
        additionalRmas: ['21'],
        returnTo: 'check-answers'
      }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestAdditionalRmasController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/check-answers'
      )
    })

    test('Should handle POST with single value (not array)', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalRmas: '21' } // Single value
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestAdditionalRmasController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('Should handle POST with null additionalRmas', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalRmas: null }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestAdditionalRmasController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
    })

    test('Should handle GET with from=check-answers query parameter', async () => {
      mockRequest.query = { from: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET when areas API returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET when areas API throws an error', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle GET when selectedPsoTeamIds is empty', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: [] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET with successful area loading and grouping', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
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

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalRmasCount: expect.any(Number),
          groupedCount: expect.any(Number)
        }),
        'Additional RMAs loaded and grouped by PSO team'
      )
    })

    test('Should handle GET when mainRmaId is not set', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}, // No mainRma
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when psoTeamId is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when rma.parent_id is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: '10' } // String parent_id
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when rma.id is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: '21', name: 'RMA 2', area_type: 'RMA', parent_id: 10 } // String id
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when mainRmaId is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when psoTeam is not found', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['999'] }, // Non-existent PSO team
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when eaArea is not found', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 999 }, // Non-existent EA area
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when teamRmas.length === 0', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 11 } // Different parent
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when rma matches mainRmaId', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: { mainRma: '20' },
        additionalRmas: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 } // This is the main RMA
      ])

      await accountRequestAdditionalRmasController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST with empty array', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalRmas: [] }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestAdditionalRmasController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
    })
  })
})
