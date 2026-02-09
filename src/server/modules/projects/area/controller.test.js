import { describe, test, expect, beforeEach, vi } from 'vitest'
import { areaController } from './controller.js'
import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import {
  buildViewData,
  loggedInUserAreaOptions,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import { validateAreaId } from '../schema.js'

// Mock dependencies
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/project-utils.js')
vi.mock('../schema.js')

describe('AreaController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()

    mockRequest = {
      payload: {},
      logger: {
        error: vi.fn()
      }
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn().mockReturnThis(),
      takeover: vi.fn().mockReturnValue(Symbol('takeover'))
    }

    const areaOptions = [
      { value: '1', text: 'Area 1' },
      { value: '2', text: 'Area 2' }
    ]

    loggedInUserAreaOptions.mockReturnValue(areaOptions)

    buildViewData.mockReturnValue({
      pageTitle: 'Select Area',
      backLink: ROUTES.PROJECT.NAME,
      areaOptions
    })

    validatePayload.mockReturnValue(null)
  })

  describe('getHandler', () => {
    test('should get logged in user area options', async () => {
      await areaController.getHandler(mockRequest, mockH)

      expect(loggedInUserAreaOptions).toHaveBeenCalledWith(mockRequest)
    })

    test('should build view data with area options', async () => {
      await areaController.getHandler(mockRequest, mockH)

      expect(buildViewData).toHaveBeenCalledWith(mockRequest, {
        localKeyPrefix: 'projects.area_selection',
        backLinkOptions: {
          targetURL: ROUTES.PROJECT.NAME
        },
        additionalData: {
          areaOptions: expect.any(Array)
        }
      })
    })

    test('should render AREA view', async () => {
      await areaController.getHandler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.AREA,
        expect.objectContaining({
          pageTitle: 'Select Area'
        })
      )
    })
  })

  describe('postHandler', () => {
    test('should update session data with payload', async () => {
      mockRequest.payload = { areaId: '1' }

      await areaController.postHandler(mockRequest, mockH)

      expect(updateSessionData).toHaveBeenCalledWith(mockRequest, {
        areaId: '1'
      })
    })

    test('should validate payload with correct schema', async () => {
      mockRequest.payload = { areaId: '1' }

      await areaController.postHandler(mockRequest, mockH)

      expect(validatePayload).toHaveBeenCalledWith(mockRequest, mockH, {
        template: PROJECT_VIEWS.AREA,
        schema: validateAreaId,
        viewData: expect.any(Object)
      })
    })

    test('should return validation error if validation fails', async () => {
      const validationError = { error: 'validation failed' }
      validatePayload.mockReturnValue(validationError)

      const result = await areaController.postHandler(mockRequest, mockH)

      expect(result).toBe(validationError)
      expect(mockH.redirect).not.toHaveBeenCalled()
    })

    test('should redirect to TYPE on successful validation', async () => {
      mockRequest.payload = { areaId: '1' }

      await areaController.postHandler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(ROUTES.PROJECT.TYPE)
      expect(mockH.takeover).toHaveBeenCalled()
    })

    test('should handle errors and render view with error message', async () => {
      const error = new Error('Test error')
      validatePayload.mockImplementation(() => {
        throw error
      })
      extractApiError.mockReturnValue({ message: 'API error' })

      await areaController.postHandler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Error project area POST',
        error
      )
      expect(extractApiError).toHaveBeenCalledWith(mockRequest, error)
      expect(mockH.view).toHaveBeenCalledWith(
        PROJECT_VIEWS.AREA,
        expect.objectContaining({
          error: { message: 'API error' }
        })
      )
    })
  })
})
