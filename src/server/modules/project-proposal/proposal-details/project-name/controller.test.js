import { describe, test, expect, beforeEach, vi } from 'vitest'
import { statusCodes } from '../../../../common/constants/status-codes.js'
import { projectNameController } from './controller.js'
import { checkProjectNameExists } from '../../../../common/services/project-proposal/project-proposal-service.js'
import { getAuthSession } from '../../../../common/helpers/auth/session-manager.js'

// Mock the service and helpers
vi.mock(
  '../../../../common/services/project-proposal/project-proposal-service.js',
  () => ({
    checkProjectNameExists: vi.fn()
  })
)

vi.mock('../../../../common/helpers/auth/session-manager.js', () => ({
  getAuthSession: vi.fn()
}))

describe('#projectNameController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    // Reset mocks before each test
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

    // Default mock for getAuthSession
    getAuthSession.mockReturnValue({ accessToken: 'mock-token' })
  })

  describe('GET /project-proposal/project-name', () => {
    test('Should render project name page', async () => {
      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
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
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
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
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          values: { projectName: 'Test_Project_Name' }
        })
      )
    })

    test('Should handle null session data on GET', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue(null)

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          values: {}
        })
      )
    })

    test('Should handle undefined session data on GET', async () => {
      mockRequest.method = 'get'
      mockRequest.yar.get.mockReturnValue(undefined)

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          values: {}
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
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
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
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
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

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/project-proposal/project-type'
      )
    })

    test('Should save project name to session on success', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

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

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.info).toHaveBeenCalled()
    })

    test('Should display error summary with error details on validation failure', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Invalid@Name' }

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
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

    test('Should render error when project name already exists in database', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Existing_Project' }

      // Mock checkProjectNameExists to return duplicate exists
      checkProjectNameExists.mockResolvedValue({ data: { exists: true } })

      const result = await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          errors: expect.objectContaining({
            projectName: 'project-proposal.project_name.errors.already_exists'
          })
        })
      )
      expect(result.statusCode).toBe(statusCodes.badRequest)
    })

    test('Should call checkProjectNameExists with correct parameters', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'New_Project' }
      mockRequest.yar.get.mockReturnValue({})

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })
      getAuthSession.mockReturnValue({ accessToken: 'test-token-123' })

      await projectNameController.handler(mockRequest, mockH)

      expect(checkProjectNameExists).toHaveBeenCalledWith(
        'New_Project',
        'test-token-123'
      )
    })

    test('Should handle error when checkProjectNameExists throws', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }

      // Mock checkProjectNameExists to throw error
      checkProjectNameExists.mockRejectedValue(new Error('API Error'))

      const result = await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'API Error',
          projectName: 'Test_Project'
        }),
        'Error checking project name existence'
      )
      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          errors: expect.objectContaining({
            projectName: 'project-proposal.project_name.errors.validation_error'
          })
        })
      )
      expect(result.statusCode).toBe(statusCodes.internalServerError)
    })

    test('Should trim whitespace when checking if project name is empty', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: '   ' }

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              text: 'project-proposal.project_name.errors.required'
            })
          ])
        })
      )
    })

    test('Should handle missing payload', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = undefined

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              href: '#project-name'
            })
          ])
        })
      )
    })

    test('Should handle null project name in payload', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: null }

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        expect.stringContaining(
          'modules/project-proposal/proposal-details/project-name/index'
        ),
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              text: 'project-proposal.project_name.errors.required'
            })
          ])
        })
      )
    })

    test('Should handle missing access token in session', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Valid_Project' }
      mockRequest.yar.get.mockReturnValue({})

      // Mock getAuthSession to return null/undefined
      getAuthSession.mockReturnValue(null)

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      await projectNameController.handler(mockRequest, mockH)

      expect(checkProjectNameExists).toHaveBeenCalledWith(
        'Valid_Project',
        undefined
      )
      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('Should handle response without data property', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Valid_Project' }
      mockRequest.yar.get.mockReturnValue({})

      // Mock checkProjectNameExists to return response without data
      checkProjectNameExists.mockResolvedValue({ success: true })

      await projectNameController.handler(mockRequest, mockH)

      // Should proceed to redirect since exists is undefined (falsy)
      expect(mockH.redirect).toHaveBeenCalledWith(
        '/project-proposal/project-type'
      )
    })

    test('Should handle null session data when saving on POST', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue(null)

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          projectName: { projectName: 'Test_Project' }
        })
      )
      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('Should handle undefined session data when saving on POST', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue(undefined)

      // Mock checkProjectNameExists to return no duplicate
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          projectName: { projectName: 'Test_Project' }
        })
      )
      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('Should redirect to rma selection page if user is an admin', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      getAuthSession.mockReturnValue({
        accessToken: 'token',
        user: { admin: true }
      })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/project-proposal/rma-selection'
      )
    })

    test('Should redirect to rma selection page if user has more than 1 area', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      getAuthSession.mockReturnValue({
        accessToken: 'token',
        user: {
          admin: false,
          areas: [{ id: 1 }, { id: 2 }]
        }
      })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/project-proposal/rma-selection'
      )
    })

    test('Should save rma selection in session data if user only has 1 area', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      getAuthSession.mockReturnValue({
        accessToken: 'token',
        user: {
          admin: false,
          areas: [{ areaId: '1', name: 'Area 1' }]
        }
      })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'projectProposal',
        expect.objectContaining({
          projectName: { projectName: 'Test_Project' },
          rmaSelection: { rmaSelection: '1' }
        })
      )
    })

    test('Should redirect to project type page if it is not an admin and only has 1 area', async () => {
      mockRequest.method = 'post'
      mockRequest.payload = { projectName: 'Test_Project' }
      mockRequest.yar.get.mockReturnValue({})
      checkProjectNameExists.mockResolvedValue({ data: { exists: false } })

      getAuthSession.mockReturnValue({
        accessToken: 'token',
        user: {
          admin: false,
          areas: [{ id: 1 }]
        }
      })

      await projectNameController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/project-proposal/project-type'
      )
    })
  })
})
