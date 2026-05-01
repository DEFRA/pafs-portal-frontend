import { describe, test, expect, beforeEach, vi } from 'vitest'
import { detailsController, detailsPostController } from './controller.js'

vi.mock('../../../common/services/accounts/accounts-service.js')
vi.mock('../schema.js')
vi.mock('../helpers/session-helpers.js')
vi.mock('../../../common/helpers/error-renderer/index.js')
vi.mock('../helpers/view-data-helper.js')
vi.mock('../helpers/navigation-helper.js')
vi.mock('../../../common/helpers/security/encoder.js')
vi.mock('../../../common/helpers/auth/session-manager.js')

const { validateEmail } =
  await import('../../../common/services/accounts/accounts-service.js')
const { detailsSchema } = await import('../schema.js')
const { getSessionKey } = await import('../helpers/session-helpers.js')
const { extractApiValidationErrors, extractApiError, extractJoiErrors } =
  await import('../../../common/helpers/error-renderer/index.js')
const { addEditModeContext } = await import('../helpers/view-data-helper.js')
const { getNextRouteAfterDetails } =
  await import('../helpers/navigation-helper.js')
const { decodeUserId } =
  await import('../../../common/helpers/security/encoder.js')
const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('DetailsController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      path: '/request-account/details',
      params: {},
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
    // addEditModeContext passthrough by default
    addEditModeContext.mockImplementation((_req, viewData) => viewData)
    getNextRouteAfterDetails.mockReturnValue('/request-account/main-area')
    decodeUserId.mockReturnValue(null)
    getAuthSession.mockReturnValue(null)
    vi.clearAllMocks()
    // Re-apply defaults after clearAllMocks
    getSessionKey.mockReturnValue('accountData')
    addEditModeContext.mockImplementation((_req, viewData) => viewData)
    getNextRouteAfterDetails.mockReturnValue('/request-account/main-area')
    decodeUserId.mockReturnValue(null)
    getAuthSession.mockReturnValue(null)
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

      expect(validateEmail).toHaveBeenCalledWith('john@example.com', null, null)
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
      getNextRouteAfterDetails.mockReturnValue(
        '/admin/user-account/check-answers'
      )

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
      getNextRouteAfterDetails.mockReturnValue(
        '/request-account/parent-areas/ea'
      )

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
      getNextRouteAfterDetails.mockReturnValue(
        '/request-account/parent-areas/ea'
      )

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
      getNextRouteAfterDetails.mockReturnValue(
        '/admin/user-account/parent-areas/ea'
      )

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

  describe('GET handler — edit mode', () => {
    test('renders with isEditMode true when encodedId param present', () => {
      mockRequest.params = { encodedId: 'enc123' }
      mockRequest.yar.get.mockReturnValue({ firstName: 'Jane' })
      addEditModeContext.mockImplementation((_req, viewData) => ({
        ...viewData,
        isEditMode: true,
        cancelRoute: '/admin/user-account/enc123'
      }))

      detailsController.handler(mockRequest, mockH)

      expect(addEditModeContext).toHaveBeenCalled()
      const [, context] = mockH.view.mock.calls[0]
      expect(context.isEditMode).toBe(true)
    })

    test('renders with isEditMode false when no encodedId', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.isEditMode).toBe(false)
    })

    test('falls back to empty object when session has no data', () => {
      mockRequest.yar.get.mockReturnValue(null)

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.accountData).toEqual({})
    })
  })

  describe('buildViewData', () => {
    test('uses responsibility_legend for non-admin context', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.responsibilityLegendKey).toBe('responsibility_legend')
    })

    test('uses responsibility_legend_admin for admin context', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.responsibilityLegendKey).toBe(
        'responsibility_legend_admin'
      )
    })

    test('submitRoute is general accounts route for non-admin', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.submitRoute).toBe('/request-account/details')
    })

    test('submitRoute is admin accounts route for admin', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.submitRoute).toBe('/admin/user-account/details')
    })

    test('uses edit_title suffix when encodedId param is present', () => {
      mockRequest.params = { encodedId: 'enc123' }
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        expect.stringContaining('edit_title')
      )
    })

    test('uses title suffix when no encodedId param', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        expect.stringContaining('.title')
      )
    })
  })

  describe('getPageTitleKey', () => {
    test('returns request_account.details for non-admin', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        expect.stringContaining('request_account.details')
      )
    })

    test('returns add_user.admin_details for admin with admin flag true', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })

      detailsController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        expect.stringContaining('add_user.admin_details')
      )
    })

    test('returns add_user.details for admin with admin flag false', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: false })

      detailsController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        expect.stringContaining('add_user.details')
      )
    })
  })

  describe('getBackLink', () => {
    test('returns GENERAL start route for non-admin', () => {
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.backLink).toBe('/request-account')
    })

    test('returns admin IS_ADMIN route when admin flag is defined', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.backLink).toBe('/admin/user-account/is-admin')
    })

    test('returns admin START route when admin flag is undefined', () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({})

      detailsController.handler(mockRequest, mockH)

      const [, context] = mockH.view.mock.calls[0]
      expect(context.backLink).toBe('/admin/user-account')
    })
  })

  describe('POST handler — edit mode (admin with encodedId)', () => {
    beforeEach(() => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.params = { encodedId: 'enc456' }
      mockRequest.payload = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        responsibility: 'EA'
      }
      mockRequest.yar.get.mockReturnValue({ admin: false })
      decodeUserId.mockReturnValue(42)
      getAuthSession.mockReturnValue({ accessToken: 'bearer-token-xyz' })
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: { ...mockRequest.payload }
      })
    })

    test('decodes encodedId from params', async () => {
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(decodeUserId).toHaveBeenCalledWith('enc456')
    })

    test('passes accessToken from session to validateEmail when userId present', async () => {
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(getAuthSession).toHaveBeenCalledWith(mockRequest)
      expect(validateEmail).toHaveBeenCalledWith(
        'jane@example.com',
        42,
        'bearer-token-xyz'
      )
    })

    test('passes null accessToken when getAuthSession returns null', async () => {
      getAuthSession.mockReturnValue(null)
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(validateEmail).toHaveBeenCalledWith('jane@example.com', 42, null)
    })

    test('redirects to next route on success', async () => {
      validateEmail.mockResolvedValue({ success: true })
      getNextRouteAfterDetails.mockReturnValue(
        '/admin/user-account/check-answers/enc456'
      )

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/check-answers/enc456'
      )
    })
  })

  describe('POST handler — admin flag logic', () => {
    test('sets admin:false on payload for non-admin path regardless of session', async () => {
      mockRequest.path = '/request-account/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })
      mockRequest.payload = {
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        responsibility: 'EA'
      }
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: { ...mockRequest.payload, admin: false }
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      const setCall = mockRequest.yar.set.mock.calls[0][1]
      expect(setCall.admin).toBe(false)
    })

    test('preserves admin:true from session on admin path', async () => {
      mockRequest.path = '/admin/accounts/details'
      mockRequest.yar.get.mockReturnValue({ admin: true })
      mockRequest.payload = {
        firstName: 'A',
        lastName: 'B',
        email: 'a@b.com',
        responsibility: 'EA'
      }
      detailsSchema.validate.mockReturnValue({
        error: null,
        value: { ...mockRequest.payload, admin: true }
      })
      validateEmail.mockResolvedValue({ success: true })

      await detailsPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })
  })
})
