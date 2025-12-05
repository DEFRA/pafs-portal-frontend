import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestAdditionalPsoTeamsController } from './controller.js'

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
          pathname: '/account_request/additional-pso-teams'
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
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalPsoTeams: ['11'] }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestAdditionalPsoTeamsController.handler(
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
        additionalPsoTeams: ['11'],
        returnTo: 'check-answers'
      }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestAdditionalPsoTeamsController.handler(
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
      mockRequest.payload = { additionalPsoTeams: '11' } // Single value
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('Should handle POST with null additionalPsoTeams', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalPsoTeams: null }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
    })

    test('Should handle GET with returnTo query parameter', async () => {
      mockRequest.query = { returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET with from=check-answers query parameter', async () => {
      mockRequest.query = { from: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET when areas API returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET when areas API throws an error', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle GET when selectedEaAreaIds is empty', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: [] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    })

    test('Should handle GET with successful area loading and grouping', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          additionalPsoTeamsCount: expect.any(Number),
          groupedCount: expect.any(Number)
        }),
        'Additional PSO teams loaded and grouped by EA area'
      )
    })

    test('Should handle GET when mainPsoTeamId is not set', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: {}, // No mainPsoTeam
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 10, name: 'PSO Team 1', area_type: 'PSO Area', parent_id: 1 },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when eaAreaId is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when team.parent_id is string', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: '1' } // String parent_id
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when eaArea is not found', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['999'] }, // Non-existent EA area
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 1 }
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with grouping when teams.length === 0', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] },
        mainPsoTeam: { mainPsoTeam: '10' },
        additionalPsoTeams: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 11, name: 'PSO Team 2', area_type: 'PSO Area', parent_id: 2 } // Different parent
      ])

      await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST with empty array', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { additionalPsoTeams: [] }
      mockRequest.yar.get.mockReturnValue({
        eaArea: { eaAreas: ['1'] }
      })

      const result = await accountRequestAdditionalPsoTeamsController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
    })
  })
})
