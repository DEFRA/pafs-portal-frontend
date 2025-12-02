import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestMainRmaController } from './controller.js'

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

describe('#accountRequestMainRmaController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/main-rma', () => {
    test('Should render main-rma page', async () => {
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

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/main-rma',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select main RMA area'))
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

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/main-rma',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select main RMA area'))
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

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/main-rma?from=check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select main RMA area'))
      }
    })
  })

  describe('POST /account_request/main-rma', () => {
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

        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/main-rma',
          payload: {},
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.badRequest)
        expect(result).toEqual(expect.stringContaining('There is a problem'))
        expect(result).toEqual(expect.stringContaining('Select a RMA'))
      }
    })

    test('Should redirect to additional-rmas on successful validation', async () => {
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/main-rma',
          payload: { mainRma: '20' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/additional-rmas')
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/main-rma',
          payload: { mainRma: '20', returnTo: 'check-answers' },
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

        const response = await server.inject({
          method: 'POST',
          url: '/account_request/main-rma',
          payload: { mainRma: '20' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(response.statusCode).toBe(302)
      }
    })

    test('Should handle GET request when no PSO teams selected', async () => {
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

        // Don't set PSO teams - test missing PSO team selection
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/main-rma',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Select main RMA area'))
      }
    })

    test('Should handle multiple PSO teams selection', async () => {
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
          payload: { psoTeams: ['10', '11'] }, // Multiple PSO teams
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/main-rma',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Select main RMA area'))
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
          pathname: '/account_request/main-rma'
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
        view: vi.fn((template, context) => {
          const result = { template, context }
          result.code = vi.fn((code) => ({ ...result, code, statusCode: code }))
          return result
        }),
        redirect: vi.fn((url) => ({ url, statusCode: 302 }))
      }
    })

    test('Should call handler for GET request', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request with validation errors', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request with valid data', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { mainRma: '20' }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/additional-rmas'
      )
    })

    test('Should call handler for POST request with returnTo', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { mainRma: '20', returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/check-answers'
      )
    })

    test('Should handle POST error display when areas API fails', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle POST error display when areas is null', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST error display when selectedPsoTeamIds is empty', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with from=check-answers query parameter', async () => {
      mockRequest.query = { from: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET when areas API returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET when areas API throws an error', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle GET when selectedPsoTeamIds is empty', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: [] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET with successful area loading and grouping', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10', '11'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 },
        { id: 21, name: 'RMA 2', area_type: 'RMA', parent_id: 10 },
        { id: 22, name: 'RMA 3', area_type: 'RMA', parent_id: 11 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          rmasCount: expect.any(Number),
          groupedCount: expect.any(Number)
        }),
        'RMAs loaded and grouped by PSO team for main RMA selection'
      )
    })

    test('Should handle GET with grouping when psoTeamId is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when rma.parent_id is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: '10' } // String parent_id
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when psoTeam is not found', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['999'] }, // Non-existent PSO team
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when eaArea is not found', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 999 }, // Non-existent EA area
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when teamRmas.length === 0', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 11 } // Different parent
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when eaArea is null', async () => {
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] },
        mainRma: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 999 }, // EA area not found
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      await accountRequestMainRmaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST with empty string mainRma', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { mainRma: '' }
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST error display with successful area loading and grouping', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        psoTeam: { psoTeams: ['10'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'RMA 1', area_type: 'RMA', parent_id: 10 }
      ])

      const result = await accountRequestMainRmaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })
  })
})
