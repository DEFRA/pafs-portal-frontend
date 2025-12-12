import { describe, test, expect, beforeEach, vi } from 'vitest'
import { statusCodes } from '../../common/constants/status-codes.js'
import { projectNameController } from './controller.js'

describe('#projectNameController', () => {
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

  describe('GET /project-proposal/project-name', () => {
    test('Should render project name page', async () => {
      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('project-proposal/project-name/index.njk'),
        expect.objectContaining({
          values: {}
        })
      )
    })

    test('Should display form with empty values on initial load', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({})

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('project-proposal/project-name/index.njk'),
        expect.objectContaining({
          values: {}
        })
      )
    })

    test('Should display saved project name if available in session', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue({
        projectName: { projectName: 'Test_Project_Name' }
      })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('project-proposal/project-name/index.njk'),
        expect.objectContaining({
          values: { projectName: 'Test_Project_Name' }
        })
      )
    })
  })

  describe('POST /project-proposal/project-name', () => {
    test('Should render error when project name is empty', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: '' }

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('project-proposal/project-name/index.njk'),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#project-name'
            })
          ])
        })
      )
    })

    test('Should render error when project name contains invalid characters', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Invalid Project@Name!' }

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('project-proposal/project-name/index.njk'),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#project-name'
            })
          ])
        })
      )
    })

    test('Should accept project name with letters, numbers, underscores and hyphens', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project-Name-123' }
      mockRequest.yar.get.mockReturnValue({})

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/project-proposal/project-description'
      )
    })

    test('Should save project name to session on success', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})

      await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          projectName: { projectName: 'Test_Project' }
        })
      )
    })

    test('Should log info message on successful submission', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})

      await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalled()
    })

    test('Should display error summary with error details on validation failure', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Invalid@Name' }

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining('project-proposal/project-name/index.njk'),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#project-name'
            })
          ])
        })
      )
    })

    test('Should return bad request status code on validation error', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Invalid@' }

      const result = await projectNameController.handler(mockRequest, mockH)

      expect(result.statusCode).toBe(statusCodes.badRequest)
    })
  })
})
