import { describe, test, expect, beforeEach, vi } from 'vitest'
import { isAdminController, isAdminPostController } from './controller.js'

vi.mock('../helpers/session-helpers.js')

const { getSessionKey } = await import('../helpers/session-helpers.js')

describe('IsAdminController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      path: '/admin/accounts/is-admin',
      payload: {},
      params: {},
      yar: {
        get: vi.fn(),
        set: vi.fn()
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
    test('renders is-admin view with empty session', () => {
      mockRequest.yar.get.mockReturnValue({})

      isAdminController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/is-admin/index',
        expect.objectContaining({
          pageTitle: 'accounts.add_user.admin_question.title',
          admin: undefined,
          backLink: '/admin/user-account',
          submitRoute: '/admin/user-account/is-admin'
        })
      )
    })

    test('renders is-admin view with existing admin flag', () => {
      mockRequest.yar.get.mockReturnValue({ admin: true })

      isAdminController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/is-admin/index',
        expect.objectContaining({
          admin: true
        })
      )
    })

    test('handles null session data', () => {
      mockRequest.yar.get.mockReturnValue(null)

      isAdminController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/is-admin/index',
        expect.objectContaining({
          admin: undefined
        })
      )
    })
  })

  describe('POST handler', () => {
    test('shows validation error when admin flag is undefined', () => {
      mockRequest.payload = {}

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/is-admin/index',
        expect.objectContaining({
          errors: expect.objectContaining({
            admin: expect.objectContaining({
              text: 'accounts.validation.add_user.VALIDATION_ADMIN_FLAG_REQUIRED',
              href: '#admin'
            })
          }),
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              text: 'accounts.validation.add_user.VALIDATION_ADMIN_FLAG_REQUIRED',
              href: '#admin'
            })
          ])
        })
      )
    })

    test('shows validation error when admin flag is null', () => {
      mockRequest.payload = { admin: null }

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/is-admin/index',
        expect.objectContaining({
          errors: expect.any(Object),
          errorSummary: expect.any(Array)
        })
      )
    })

    test('saves admin flag as true when string "true"', () => {
      mockRequest.payload = { admin: 'true' }
      mockRequest.yar.get.mockReturnValue({})

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          admin: true
        })
      )
    })

    test('saves admin flag as true when boolean true', () => {
      mockRequest.payload = { admin: true }
      mockRequest.yar.get.mockReturnValue({})

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          admin: true
        })
      )
    })

    test('saves admin flag as false when string "false"', () => {
      mockRequest.payload = { admin: 'false' }
      mockRequest.yar.get.mockReturnValue({})

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          admin: false
        })
      )
    })

    test('preserves existing session data', () => {
      mockRequest.payload = { admin: 'true' }
      mockRequest.yar.get.mockReturnValue({
        firstName: 'John',
        lastName: 'Doe'
      })

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
          admin: true
        })
      )
    })

    test('redirects to details page on success', () => {
      mockRequest.payload = { admin: 'true' }
      mockRequest.yar.get.mockReturnValue({})

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith('/admin/user-account/details')
    })

    test('handles null session data gracefully', () => {
      mockRequest.payload = { admin: 'false' }
      mockRequest.yar.get.mockReturnValue(null)

      isAdminPostController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          admin: false
        })
      )
    })
  })
})
