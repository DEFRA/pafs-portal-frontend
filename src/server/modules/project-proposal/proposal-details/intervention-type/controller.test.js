import { describe, test, expect, beforeEach, vi } from 'vitest'
import { statusCodes } from '../../../../common/constants/status-codes.js'
import { interventionTypeController } from './controller.js'

describe('#interventionTypeController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      method: 'get',
      t: vi.fn((key) => key),
      payload: {},
      yar: {
        get: vi.fn(() => ({})),
        set: vi.fn()
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
      redirect: vi.fn((url) => ({ redirect: url }))
    }
  })

  describe('GET /project-proposal/intervention-type', () => {
    test('Should render intervention type page on GET', async () => {
      mockRequest.method = 'get'
      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/intervention-type/index'
        ),
        expect.objectContaining({
          values: {}
        })
      )
    })

    test('Should display saved intervention selections if available in session', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/intervention-type/index'
        ),
        expect.objectContaining({
          values: { interventionTypes: ['nfm', 'sds'] }
        })
      )
    })

    test('Should include projectType in view model when available in session', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'DEF' }
      })

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projectType: 'DEF'
        })
      )
    })

    test('Should handle null/undefined session data on GET', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue(null)
      await interventionTypeController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalled()

      mockRequest.yar.get.mockReturnValue(undefined)
      await interventionTypeController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('POST /project-proposal/intervention-type', () => {
    test('Should render error when no intervention type is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: [] }

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/intervention-type/index'
        ),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({ href: '#intervention-type' })
          ])
        })
      )
    })

    test('Should save single intervention type to session and redirect to home', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: 'nfm' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await interventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          interventionTypes: { interventionTypes: ['nfm'] }
        })
      )
      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should save multiple intervention types and redirect to primary-intervention-type', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: ['nfm', 'sds'] }
      mockRequest.yar.get.mockReturnValue({})

      const result = await interventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          interventionTypes: { interventionTypes: ['nfm', 'sds'] }
        })
      )
      expect(result.redirect).toBe(
        '/project-proposal/primary-intervention-type'
      )
    })

    test('Should return bad request status on validation error', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: [] }

      const result = await interventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('Should log info message on successful submission', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: 'nfm' }
      mockRequest.yar.get.mockReturnValue({})

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { interventionTypes: ['nfm'] },
        'Intervention types selected and stored in session'
      )
    })

    test('Should handle null/undefined session on POST', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: 'pfr' }
      mockRequest.yar.get.mockReturnValue(null)

      await interventionTypeController.handler(mockRequest, mockH)
      expect(mockRequest.yar.set).toHaveBeenCalled()

      mockRequest.yar.get.mockReturnValue(undefined)
      await interventionTypeController.handler(mockRequest, mockH)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('Should convert single intervention type string to array', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: 'sds' }
      mockRequest.yar.get.mockReturnValue({})

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          interventionTypes: { interventionTypes: ['sds'] }
        })
      )
    })

    test('Should preserve multiple selections as array', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: ['nfm', 'pfr', 'sds'] }
      mockRequest.yar.get.mockReturnValue({})

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          interventionTypes: { interventionTypes: ['nfm', 'pfr', 'sds'] }
        })
      )
    })

    test('Should include projectType in view model on error', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: [] }
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'REF' }
      })

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          projectType: 'REF'
        })
      )
    })

    test('Should handle missing payload gracefully', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = undefined

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should display error summary with correct href', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: null }

      await interventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#intervention-type',
              text: 'project-proposal.intervention_type.errors.required'
            })
          ])
        })
      )
    })

    test('Should redirect to primary page when exactly 2 options selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { interventionTypes: ['nfm', 'sds'] }
      mockRequest.yar.get.mockReturnValue({})

      const result = await interventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe(
        '/project-proposal/primary-intervention-type'
      )
    })

    test('Should redirect to primary page when 3+ options selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = {
        interventionTypes: ['nfm', 'pfr', 'sds', 'other']
      }
      mockRequest.yar.get.mockReturnValue({})

      const result = await interventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe(
        '/project-proposal/primary-intervention-type'
      )
    })
  })
})
