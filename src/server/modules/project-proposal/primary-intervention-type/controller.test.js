import { describe, test, expect, beforeEach, vi } from 'vitest'
import { statusCodes } from '../../../common/constants/status-codes.js'
import { primaryInterventionTypeController } from './controller.js'

describe('#primaryInterventionTypeController', () => {
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

  describe('GET /project-proposal/primary-intervention-type', () => {
    test('Should redirect to home when no interventions selected', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({})

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should redirect to home when only one intervention selected', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm'] }
      })

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should render page when two interventions selected', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/primary-intervention-type/index'
        ),
        expect.objectContaining({
          selectedInterventions: ['nfm', 'sds']
        })
      )
    })

    test('Should render page when multiple interventions selected', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'pfr', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          selectedInterventions: ['nfm', 'pfr', 'sds']
        })
      )
    })

    test('Should display saved primary selection if available in session', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] },
        primaryInterventionType: { primaryInterventionType: 'nfm' }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          values: { primaryInterventionType: 'nfm' }
        })
      )
    })

    test('Should handle null session data on GET', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue(null)

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should handle undefined session data on GET', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue(undefined)

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })
  })

  describe('POST /project-proposal/primary-intervention-type', () => {
    test('Should redirect to home when no interventions in session', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'nfm' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should redirect to home when only one intervention in session', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'nfm' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm'] }
      })

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should render error when primary intervention is not selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: '' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/primary-intervention-type/index'
        ),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#primary-intervention-type'
            })
          ])
        })
      )
    })

    test('Should render error when selected intervention is not in allowed list', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'pfr' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errors: expect.objectContaining({
            primaryInterventionType:
              'project-proposal.primary_intervention_type.errors.invalid'
          })
        })
      )
    })

    test('Should save valid primary intervention to session and redirect', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'nfm' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          primaryInterventionType: { primaryInterventionType: 'nfm' }
        })
      )
      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should return bad request status on validation error', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: '' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('Should log info on successful primary intervention selection', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'sds' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { primaryInterventionType: 'sds' },
        'Primary intervention type selected and stored in session'
      )
    })

    test('Should accept any selected intervention from the list', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'sds' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      expect(mockRequest.yar.set).toHaveBeenCalled()
      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should handle null payload on POST', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = undefined
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })

    test('Should preserve selected interventions in error view', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'invalid' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'pfr', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          selectedInterventions: ['nfm', 'pfr', 'sds']
        })
      )
    })

    test('Should handle interventionTypes as single string (not array)', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: 'nfm' }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: 'sds' }
      })

      const result = await primaryInterventionTypeController.handler(
        mockRequest,
        mockH
      )

      // When converted to array, 'sds' is the only option, so no primary page
      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should display error summary with correct href', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { primaryInterventionType: null }
      mockRequest.yar.get.mockReturnValue({
        interventionTypes: { interventionTypes: ['nfm', 'sds'] }
      })

      await primaryInterventionTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#primary-intervention-type'
            })
          ])
        })
      )
    })
  })
})
