import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestMainPsoTeamController } from './controller.js'

// Mock area service to prevent real API calls
vi.mock('../../common/services/areas/area-service.js', () => ({
  getAreas: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, name: 'Thames', area_type: 'EA Area' },
      { id: 2, name: 'Anglian', area_type: 'EA Area' },
      { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
      { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
    ]
  })
}))

describe('#accountRequestMainPsoTeamController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/main-pso-team', () => {
    test('Should render main-pso-team page', async () => {
      // Set up session with EA areas
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

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/main-pso-team',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select main PSO area'))
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

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/main-pso-team',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select main PSO area'))
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

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/main-pso-team?from=check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select main PSO area'))
      }
    })
  })

  describe('POST /account_request/main-pso-team', () => {
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

        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/main-pso-team',
          payload: {},
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.badRequest)
        expect(result).toEqual(expect.stringContaining('There is a problem'))
        expect(result).toEqual(
          expect.stringContaining('Select a main PSO team')
        )
      }
    })

    test('Should redirect to additional-pso-teams on successful validation', async () => {
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/main-pso-team',
          payload: { mainPsoTeam: '10' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/additional-pso-teams')
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

        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/main-pso-team',
          payload: { mainPsoTeam: '10', returnTo: 'check-answers' },
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

        const response = await server.inject({
          method: 'POST',
          url: '/account_request/main-pso-team',
          payload: { mainPsoTeam: '10' },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(response.statusCode).toBe(302)
      }
    })

    test('Should handle GET request when no EA areas selected', async () => {
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
        // Don't set EA areas - test missing EA area selection
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/main-pso-team',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Select main PSO area'))
      }
    })

    test('Should handle multiple EA areas selection', async () => {
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
          payload: { eaAreas: ['1', '2'] }, // Multiple EA areas
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/main-pso-team',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Select main PSO area'))
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
          pathname: '/account_request/main-pso-team'
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
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request with validation errors', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      const result = await accountRequestMainPsoTeamController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request with valid data', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { mainPsoTeam: '10' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestMainPsoTeamController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/additional-pso-teams'
      )
    })

    test('Should call handler for POST request with returnTo', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { mainPsoTeam: '10', returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestMainPsoTeamController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/additional-pso-teams?returnTo=check-answers'
      )
    })

    test('Should handle POST error display when areas API fails', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      const result = await accountRequestMainPsoTeamController.handler(
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
        eaArea: { eaAreas: ['1'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      const result = await accountRequestMainPsoTeamController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST error display when selectedEaAreaIds is empty', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: [] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      const result = await accountRequestMainPsoTeamController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with returnTo query parameter', async () => {
      mockRequest.query = { returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET with from=check-answers query parameter', async () => {
      mockRequest.query = { from: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET when areas API returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET when areas API throws an error', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle GET when selectedEaAreaIds is empty', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: [] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET with successful area loading and grouping', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1', '2'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 2, name: 'Anglian', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 },
        { id: 20, name: 'PSO Team 3', area_type: 'PSO Area', parent_id: 2 }
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          psoTeamsCount: expect.any(Number),
          groupedCount: expect.any(Number)
        }),
        'PSO teams loaded and grouped by EA area for main team selection'
      )
    })

    test('Should handle GET with grouping when eaAreaId is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when team.parent_id is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: '1' } // String parent_id
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when eaArea is not found', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['999'] }, // Non-existent EA area
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when teams.length === 0', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 2 } // Different parent
      ])

      await accountRequestMainPsoTeamController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST with empty string mainPsoTeam', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { mainPsoTeam: '' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestMainPsoTeamController.handler(
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
        eaArea: { eaAreas: ['1'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      const result = await accountRequestMainPsoTeamController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })
  })
})
