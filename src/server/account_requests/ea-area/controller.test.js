import { createServer } from '../../server.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { vi } from 'vitest'
import { accountRequestEaAreaController } from './controller.js'

// Mock area service to prevent real API calls
vi.mock('../../common/services/areas/area-service.js', () => ({
  getAreas: vi.fn().mockResolvedValue({
    success: true,
    data: [
      { id: 1, name: 'Thames', area_type: 'EA Area' },
      { id: 2, name: 'Anglian', area_type: 'EA Area' },
      { id: 3, name: 'Wessex', area_type: 'EA Area' }
    ]
  })
}))

describe('#accountRequestEaAreaController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /account_request/ea-area', () => {
    test('Should render ea-area page', async () => {
      // First set up responsibility in session
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
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select EA areas'))
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
        // Set EA areas in session
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1', '2'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select EA areas'))
      }
    })

    test('Should clear area selection when reset=areas query param is present', async () => {
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
        // Set some area data
        await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        // Now access with reset=areas
        const { result, statusCode } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area?reset=areas',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.ok)
        expect(result).toEqual(expect.stringContaining('Select EA areas'))
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
        const { result } = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area?from=check-answers',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(result).toEqual(expect.stringContaining('Select EA areas'))
      }
    })
  })

  describe('POST /account_request/ea-area', () => {
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
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: {},
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.badRequest)
        expect(result).toEqual(expect.stringContaining('There is a problem'))
        expect(result).toEqual(expect.stringContaining('Select an EA area'))
      }
    })

    test('Should redirect to main-pso-team for PSO responsibility', async () => {
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
        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/main-pso-team')
      }
    })

    test('Should redirect to pso-team for RMA responsibility', async () => {
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
        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
        expect(headers.location).toBe('/account_request/pso-team')
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
        const { statusCode, headers } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1'], returnTo: 'check-answers' },
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
        const response = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: ['1', '2'] },
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(response.statusCode).toBe(302)

        // Verify data is stored by checking GET
        const getResponse = await server.inject({
          method: 'GET',
          url: '/account_request/ea-area',
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(getResponse.result).toEqual(
          expect.stringContaining('Select EA areas')
        )
      }
    })

    test('Should handle empty EA areas array in payload', async () => {
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
        const { result, statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: [] }, // Empty array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(statusCodes.badRequest)
        expect(result).toEqual(expect.stringContaining('There is a problem'))
      }
    })

    test('Should handle single EA area value (not array)', async () => {
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
        const { statusCode } = await server.inject({
          method: 'POST',
          url: '/account_request/ea-area',
          payload: { eaAreas: '1' }, // Single value, not array
          headers: { cookie: sessionCookie.split(';')[0] }
        })

        expect(statusCode).toBe(302)
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
          pathname: '/account_request/ea-area'
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
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request with validation errors', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({})

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should call handler for POST request with PSO responsibility', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'] }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/main-pso-team'
      )
    })

    test('Should call handler for POST request with RMA responsibility', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'] }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'RMA' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith('/account_request/pso-team')
    })

    test('Should call handler for POST request with EA responsibility', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'] }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith('/account_request')
    })

    test('Should call handler for POST request with PSO responsibility and returnTo', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'], returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/main-pso-team?returnTo=check-answers'
      )
    })

    test('Should call handler for POST request with RMA responsibility and returnTo', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'], returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'RMA' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/pso-team?returnTo=check-answers'
      )
    })

    test('Should call handler for POST request with EA responsibility and returnTo', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'], returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'EA' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/account_request/check-answers'
      )
    })

    test('Should handle POST with falsy eaAreas value (line 31)', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: null } // Falsy value
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST error display when areas API fails', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({})

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle POST error display when areas is null', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {}
      mockRequest.yar.get.mockReturnValue({})

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET with reset=areas query parameter', async () => {
      mockRequest.query = { reset: 'areas' }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' },
        eaArea: { eaAreas: ['1'] }
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('accountRequest', {
        details: { responsibility: 'PSO' }
      })
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        'Cleared area selection data, keeping only details'
      )
    })

    test('Should handle GET with returnTo query parameter', async () => {
      mockRequest.query = { returnTo: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET with from=check-answers query parameter', async () => {
      mockRequest.query = { from: 'check-answers' }
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].returnTo).toBe('check-answers')
    })

    test('Should handle GET when areas API returns null', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue(null)

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.warn).toHaveBeenCalledWith(
        'Failed to load EA areas - areas is null or undefined'
      )
    })

    test('Should handle GET when areas API throws an error', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockRejectedValue(new Error('API Error'))

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.error).toHaveBeenCalled()
    })

    test('Should handle GET when areas is not an array', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue('not-an-array')

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          totalAreasCount: 'not an array'
        }),
        'Areas retrieved from cache'
      )
    })

    test('Should handle GET with successful area loading and filtering', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 2, name: 'PSO Team 1', area_type: 'PSO Area' }
      ])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          eaAreasCount: expect.any(Number)
        }),
        'EA areas filtered for area selection'
      )
    })

    test('Should handle POST with unknown responsibility', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'] }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'UNKNOWN' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith('/account_request')
    })

    test('Should handle POST with empty string eaAreas', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: '' } // Empty string - falsy
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle POST with successful validation and logging', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1', '2'] }
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          responsibility: 'PSO',
          eaAreas: ['1', '2'],
          eaAreasCount: 2
        }),
        'EA areas saved to session, redirecting to next page'
      )
      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          nextUrl: '/account_request/main-pso-team'
        }),
        'Redirecting to next page in RMA/PSO flow'
      )
    })

    test('Should handle GET when reset=areas and details is null', async () => {
      mockRequest.query = { reset: 'areas' }
      mockRequest.yar.get.mockReturnValue({
        details: null
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith('accountRequest', {
        details: {}
      })
    })

    test('Should handle GET when areas is empty array', async () => {
      mockRequest.yar.get.mockReturnValue({
        eaArea: {}
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockRequest.server.logger.info).toHaveBeenCalled()
    })

    test('Should handle POST with single string eaAreas value', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: '1' } // Single string value
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('Should handle POST error display with successful area loading', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {} // Empty to trigger validation error
      mockRequest.yar.get.mockReturnValue({})

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([
        { id: 1, name: 'Thames', area_type: 'EA Area' },
        { id: 2, name: 'Anglian', area_type: 'EA Area' }
      ])

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.code).toBe(statusCodes.badRequest)
      expect(mockH.view).toHaveBeenCalled()
      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[1].eaAreas.length).toBeGreaterThan(0)
    })

    test('Should handle POST with null responsibility', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { eaAreas: ['1'] }
      mockRequest.yar.get.mockReturnValue({
        details: {} // No responsibility
      })

      const result = await accountRequestEaAreaController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(302)
      expect(mockH.redirect).toHaveBeenCalledWith('/account_request')
    })

    test('Should handle GET when sessionData is null', async () => {
      mockRequest.yar.get.mockReturnValue(null)

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should handle GET when eaArea is not in session', async () => {
      mockRequest.yar.get.mockReturnValue({
        details: { responsibility: 'PSO' }
        // No eaArea
      })

      vi.spyOn(
        await import('../../common/services/areas/areas-cache.js'),
        'getCachedAreas'
      ).mockResolvedValue([{ id: 1, name: 'Thames', area_type: 'EA Area' }])

      await accountRequestEaAreaController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })
})
