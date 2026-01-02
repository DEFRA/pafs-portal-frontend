import { describe, test, expect, beforeEach, vi } from 'vitest'
import { detailsController, detailsPostController } from './controller.js'

vi.mock('../../../common/services/accounts/accounts-service.js')
vi.mock('../schema.js')
vi.mock('../helpers.js')
vi.mock('../../../common/helpers/error-renderer/index.js')

const { validateEmail } =
  await import('../../../common/services/accounts/accounts-service.js')
const { detailsSchema } = await import('../schema.js')
const { getSessionKey } = await import('../helpers.js')
const { extractApiValidationErrors, extractApiError, extractJoiErrors } =
  await import('../../../common/helpers/error-renderer/index.js')

describe('DetailsController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      path: '/request-account/details',
      payload: {},
      yar: {
        get: vi.fn(),
        set: vi.fn()
      },
      server: {
        logger: {
          error: vi.fn()
        }
      },
      t: vi.fn((key) => key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }

    getSessionKey.mockReturnValue('accountData')
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('renders details view for regular user', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          isAdmin: false,
          accountData: {},
          fieldErrors: {},
          errorCode: ''
        })
      )
    })

    test('renders details view for admin context', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })

      detailsController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          isAdmin: true,
          admin: true
        })
      )
    })

    test('uses session data when available', () => {
      const sessionData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      }
      mockRequest.yar.get.mockReturnValue(sessionData)

      detailsController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          accountData: sessionData
        })
      )
    })

    test('includes correct back link for regular user', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          backLink: '/request-account'
        })
      )
    })

    test('includes correct back link for admin with admin flag set', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })

      detailsController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          backLink: '/admin/user-account/is-admin'
        })
      )
    })
  })

  describe('POST handler', () => {
    beforeEach(() => {
      mockRequest.payload = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        responsibility: 'EA'
      }
      mockRequest.yar.get.mockReturnValue({})
    })

    test('returns validation errors for invalid payload', async () => {
      const validationError = {
        details: [{ path: ['firstName'], message: 'First name is required' }]
      }
      detailsSchema.validate.mockReturnValue({
        error: validationError,
        value: null
      })
      extractJoiErrors.mockReturnValue({ firstName: 'First name is required' })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          fieldErrors: { firstName: 'First name is required' }
        })
      )
    })

    test('validates email with backend service', async () => {
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(validateEmail).toHaveBeenCalledWith('john@example.com')
    })

    test('handles backend validation errors', async () => {
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({
        success: false,
        validationErrors: [{ field: 'email', errorCode: 'EMAIL_DUPLICATE' }]
      })
      extractApiValidationErrors.mockReturnValue({
        email: 'Email already exists'
      })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          fieldErrors: { email: 'Email already exists' }
        })
      )
    })

    test('handles general API errors', async () => {
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'NETWORK_ERROR' }]
      })
      extractApiError.mockReturnValue({ errorCode: 'NETWORK_ERROR' })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR'
        })
      )
    })

    test('saves data to session on success', async () => {
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining(mockRequest.payload)
      )
    })

    test('redirects admin user to check answers', async () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.payload.admin = true
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: { ...mockRequest.payload, admin: true }
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/check-answers'
      )
    })

    test('redirects PSO user to parent areas', async () => {
      mockRequest.payload.responsibility = 'PSO'
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/parent-areas/ea'
      )
    })

    test('redirects RMA user to parent areas', async () => {
      mockRequest.payload.responsibility = 'RMA'
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/parent-areas/ea'
      )
    })

    test('redirects EA user to main area', async () => {
      mockRequest.payload.responsibility = 'EA'
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/request-account/main-area')
    })

    test('redirects admin PSO user to admin parent areas', async () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.payload.responsibility = 'PSO'
      mockRequest.payload.admin = false
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/parent-areas/ea'
      )
    })

    test('handles network errors gracefully', async () => {
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: mockRequest.payload
      })
      validateEmail.mockRejectedValue(new Error('Network error'))

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/details/index',
        expect.objectContaining({
          errorCode: 'NETWORK_ERROR'
        })
      )
    })
  })
})
