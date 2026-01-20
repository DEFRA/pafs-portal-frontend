import { describe, test, expect, beforeEach, vi } from 'vitest'
import { confirmationController } from './controller.js'

vi.mock('../helpers/session-helpers.js')

const { getSessionKey } = await import('../helpers/session-helpers.js')

describe('ConfirmationController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      path: '/request-account/confirmation',
      yar: {
        get: vi.fn()
      },
      t: vi.fn((key, options) => options?.email || key)
    }

    mockH = {
      view: vi.fn(),
      redirect: vi.fn()
    }

    getSessionKey.mockReturnValue('accountData')
    vi.clearAllMocks()
  })

  describe('GET handler', () => {
    test('renders confirmation view for regular user', () => {
      mockRequest.yar.get.mockReturnValue({
        email: 'test@example.com',
        admin: false,
        submissionStatus: 'pending'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/confirmation/index',
        expect.objectContaining({
          isAdmin: false,
          email: 'test@example.com',
          status: 'pending'
        })
      )
    })

    test('renders confirmation view for admin context', () => {
      mockRequest.path = '/admin/accounts/confirmation'
      mockRequest.yar.get.mockReturnValue({
        email: 'admin@example.com',
        admin: true,
        submissionStatus: 'approved'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/confirmation/index',
        expect.objectContaining({
          isAdmin: true,
          status: 'approved'
        })
      )
    })

    test('redirects when no submission status', () => {
      mockRequest.yar.get.mockReturnValue({
        email: 'test@example.com'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/request-account/check-answers'
      )
    })

    test('redirects to admin check-answers when no submission status in admin context', () => {
      mockRequest.path = '/admin/accounts/confirmation'
      mockRequest.yar.get.mockReturnValue({
        email: 'admin@example.com'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(
        '/admin/user-account/check-answers'
      )
    })

    test('redirects when session data is empty', () => {
      mockRequest.yar.get.mockReturnValue({})

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('redirects when session data is null', () => {
      mockRequest.yar.get.mockReturnValue(null)

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.redirect).toHaveBeenCalled()
    })

    test('defaults to pending status when submissionStatus is not approved', () => {
      mockRequest.yar.get.mockReturnValue({
        email: 'test@example.com',
        submissionStatus: 'unknown'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/confirmation/index',
        expect.objectContaining({
          status: 'pending'
        })
      )
    })

    test('includes correct translation base for regular user with pending status', () => {
      mockRequest.yar.get.mockReturnValue({
        email: 'test@example.com',
        submissionStatus: 'pending'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/confirmation/index',
        expect.objectContaining({
          translationBase: 'accounts.request_account.confirmation.pending',
          localeKey: 'request_account'
        })
      )
    })

    test('includes correct translation base for admin with approved status', () => {
      mockRequest.path = '/admin/accounts/confirmation'
      mockRequest.yar.get.mockReturnValue({
        email: 'admin@example.com',
        submissionStatus: 'approved'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/confirmation/index',
        expect.objectContaining({
          translationBase: 'accounts.add_user.confirmation.approved',
          localeKey: 'add_user'
        })
      )
    })

    test('includes signInRoute and ERROR_CODES in view data', () => {
      mockRequest.yar.get.mockReturnValue({
        email: 'test@example.com',
        submissionStatus: 'pending'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/confirmation/index',
        expect.objectContaining({
          signInRoute: '/login',
          ERROR_CODES: expect.any(Object)
        })
      )
    })

    test('calls translation function for pageTitle', () => {
      mockRequest.yar.get.mockReturnValue({
        email: 'test@example.com',
        submissionStatus: 'pending'
      })

      confirmationController.handler(mockRequest, mockH)

      expect(mockRequest.t).toHaveBeenCalledWith(
        'accounts.request_account.confirmation.pending.panelTitle'
      )
    })
  })
})
