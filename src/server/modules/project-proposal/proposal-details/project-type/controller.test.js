import { describe, test, expect, beforeEach, vi } from 'vitest'
import { statusCodes } from '../../../../common/constants/status-codes.js'
import { projectTypeController } from './controller.js'

describe('#projectTypeController', () => {
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

  describe('GET /project-proposal/project-type', () => {
    test('Should render project type page', async () => {
      await projectTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-type/index'
        ),
        expect.objectContaining({
          values: {}
        })
      )
    })

    test('Should display saved selection if available in session', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        projectType: { projectType: 'nfm' }
      })

      await projectTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-type/index'
        ),
        expect.objectContaining({
          values: { projectType: 'nfm' }
        })
      )
    })

    test('Should handle null/undefined session data', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue(null)
      await projectTypeController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalled()

      mockRequest.yar.get.mockReturnValue(undefined)
      await projectTypeController.handler(mockRequest, mockH)
      expect(mockH.view).toHaveBeenCalled()
    })
  })

  describe('POST /project-proposal/project-type', () => {
    test('Should render error when project type is not selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: '' }

      await projectTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-type/index'
        ),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({ href: '#project-type' })
          ])
        })
      )
    })

    test('Should save project type to session on success and redirect', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'nfm' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({ projectType: { projectType: 'nfm' } })
      )
      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should return bad request status code on validation error', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: '' }

      const result = await projectTypeController.handler(mockRequest, mockH)
      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('Should handle null/undefined session on POST', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'coastal_erosion' }
      mockRequest.yar.get.mockReturnValue(null)
      await projectTypeController.handler(mockRequest, mockH)
      expect(mockRequest.yar.set).toHaveBeenCalled()

      mockRequest.yar.get.mockReturnValue(undefined)
      await projectTypeController.handler(mockRequest, mockH)
      expect(mockRequest.yar.set).toHaveBeenCalled()
    })

    test('Should redirect to intervention-type when DEF is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'DEF' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/intervention-type')
    })

    test('Should redirect to intervention-type when REP is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'REP' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/intervention-type')
    })

    test('Should redirect to intervention-type when REF is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'REF' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/intervention-type')
    })

    test('Should redirect to first financial year when HCR is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'HCR' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should redirect to first financial year when STR is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'STR' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should redirect to first financial year when STU is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'STU' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should redirect to first financial year when ELO is selected', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'ELO' }
      mockRequest.yar.get.mockReturnValue({})

      const result = await projectTypeController.handler(mockRequest, mockH)

      expect(result.redirect).toBe('/project-proposal/first-financial-year')
    })

    test('Should log info message on successful submission', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: 'DEF' }
      mockRequest.yar.get.mockReturnValue({})

      await projectTypeController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
        { projectType: 'DEF' },
        'Project type selected and stored in session'
      )
    })

    test('Should display error summary with correct href', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectType: null }

      await projectTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#project-type',
              text: 'project-proposal.project_type.errors.required'
            })
          ])
        })
      )
    })

    test('Should handle missing payload gracefully', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = undefined

      await projectTypeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
    })
  })
})
