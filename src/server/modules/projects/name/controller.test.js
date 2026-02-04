import { describe, test, expect, beforeEach, vi } from 'vitest'
import { nameController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { PROJECT_PAYLOAD_LEVELS } from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import {
  extractApiError,
  extractApiValidationErrors
} from '../../../common/helpers/error-renderer/index.js'
import { checkProjectNameExists } from '../../../common/services/project/project-service.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  loggedInUserAreas,
  loggedInUserMainArea,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'

// Mock dependencies
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../../../common/services/project/project-service.js')
vi.mock('../helpers/project-submission.js')
vi.mock('../helpers/project-utils.js')
vi.mock('../schema.js')

describe('NameController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      params: {},
      server: {
        logger: {
          info: vi.fn()
        }
      },
      logger: {
        error: vi.fn()
      }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    buildViewData.mockReturnValue({
      pageTitle: 'Project Name',
      backLink: ROUTES.PROJECT.START
    })

    getSessionData.mockReturnValue({
      name: 'Test Project'
    })

    getAuthSession.mockReturnValue({
      accessToken: 'test-token'
    })

    validatePayload.mockReturnValue(null)
    checkProjectNameExists.mockResolvedValue({ success: true })
    saveProjectWithErrorHandling.mockResolvedValue(null)
    loggedInUserAreas.mockReturnValue([{ id: '1' }])
    loggedInUserMainArea.mockReturnValue({ id: '1' })
  })

  describe('getHandler', () => {
    test('should render NAME view', async () => {
      await nameController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(PROJECT_VIEWS.NAME, {
        pageTitle: 'Project Name',
        backLink: ROUTES.PROJECT.START
      })
    })

    test('should build view data with correct localKeyPrefix', async () => {
      await nameController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(mockRequest, {
        localKeyPrefix: 'projects.project_name',
        backLinkOptions: {
          targetURL: ROUTES.PROJECT.START,
          conditionalRedirect: true
        }
      })
    })
  })

  describe('postHandler', () => {
    beforeEach(() => {
      mockRequest.payload = { name: 'Test Project' }
    })

    test('should update session data with payload', async () => {
      await nameController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        name: 'Test Project'
      })
    })

    test('should return validation error if validation fails', async () => {
      const validationError = { error: 'validation failed' }
      validatePayload.mockReturnValue(validationError)

      const result = await nameController.postHandler(mockRequest, mockH)

      expect(result).toBe(validationError)
      expect(checkProjectNameExists).not.toHaveBeenCalled()
    })

    test('should check for duplicate project names', async () => {
      await nameController.postHandler(mockRequest, mockH)

      expect(checkProjectNameExists).toHaveBeenCalledWith(
        {
          name: 'Test Project',
          referenceNumber: undefined
        },
        'test-token'
      )
    })

    test('should return error if duplicate name check fails with validation errors', async () => {
      checkProjectNameExists.mockResolvedValue({
        success: false,
        validationErrors: [{ field: 'name', error: 'duplicate' }]
      })
      extractApiValidationErrors.mockReturnValue({ name: 'duplicate' })

      const result = await nameController.postHandler(mockRequest, mockH)

      expect(extractApiValidationErrors).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.NAME,
        expect.any(Object)
      )
      expect(result).toBeDefined()
    })

    test('should return error if duplicate name check fails with error code', async () => {
      checkProjectNameExists.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'CUSTOM_ERROR' }]
      })
      extractApiError.mockReturnValue({ errorCode: 'CUSTOM_ERROR' })

      const result = await nameController.postHandler(mockRequest, mockH)

      expect(extractApiError).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.NAME,
        expect.any(Object)
      )
      expect(result).toBeDefined()
    })

    describe('in create mode', () => {
      test('should redirect to AREA when user has multiple areas', async () => {
        loggedInUserAreas.mockReturnValue([{ id: '1' }, { id: '2' }])

        await nameController.postHandler(mockRequest, mockH)

        expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
          { areasCount: 2 },
          'User has multiple areas, redirecting to area selection step'
        )
        expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.AREA)
        expect(mockH.takeover).toHaveBeenCalled()
      })

      test('should redirect to TYPE when user has single area', async () => {
        loggedInUserAreas.mockReturnValue([{ id: '1' }])
        loggedInUserMainArea.mockReturnValue({ id: '1' })

        await nameController.postHandler(mockRequest, mockH)

        expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
          areaId: 1
        })
        expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
          { areaId: 1 },
          'User has single area, setting area in session and redirecting to project type step'
        )
        expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.TYPE)
      })

      test('should not submit to API in create mode', async () => {
        await nameController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).not.toHaveBeenCalled()
      })
    })

    describe('in edit mode', () => {
      beforeEach(() => {
        mockRequest.params.referenceNumber = 'TEST-001'
        getSessionData.mockReturnValue({
          name: 'Test Project',
          referenceNumber: 'TEST-001'
        })
      })

      test('should submit to API in edit mode', async () => {
        const overviewRedirect = Symbol('overview-redirect')
        navigateToProjectOverview.mockReturnValue(overviewRedirect)

        await nameController.postHandler(mockRequest, mockH)

        expect(saveProjectWithErrorHandling).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          PROJECT_PAYLOAD_LEVELS.PROJECT_NAME,
          expect.any(Object),
          PROJECT_VIEWS.NAME
        )
      })

      test('should return error response if save fails', async () => {
        const errorResponse = { error: 'save failed' }
        saveProjectWithErrorHandling.mockResolvedValue(errorResponse)

        const result = await nameController.postHandler(mockRequest, mockH)

        expect(result).toBe(errorResponse)
        expect(navigateToProjectOverview).not.toHaveBeenCalled()
      })

      test('should navigate to overview after successful save', async () => {
        const overviewRedirect = Symbol('overview-redirect')
        navigateToProjectOverview.mockReturnValue(overviewRedirect)

        const result = await nameController.postHandler(mockRequest, mockH)

        expect(mockRequest.server.logger.info).toHaveBeenCalledWith(
          { referenceNumber: 'TEST-001' },
          'Project name step completed in edit mode, redirecting to overview'
        )
        expect(navigateToProjectOverview).toHaveBeenCalledWith(
          'TEST-001',
          mockH
        )
        expect(result).toBe(overviewRedirect)
      })
    })

    test('should handle errors and render view with error message', async () => {
      const error = new Error('Test error')
      validatePayload.mockImplementation(() => {
        throw error
      })
      extractApiError.mockReturnValue({ message: 'API error' })

      await nameController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error project name POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.NAME,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })
  })
})
