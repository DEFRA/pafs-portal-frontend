import { describe, test, expect, beforeEach, vi } from 'vitest'
import { confirmationController } from './controller.js'

vi.mock('../helpers.js')

const { getSessionKey } = await import('../helpers.js')

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
  })
})
