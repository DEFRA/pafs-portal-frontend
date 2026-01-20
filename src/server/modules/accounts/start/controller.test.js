import { describe, test, expect, beforeEach, vi } from 'vitest'
import { startController } from './controller.js'

vi.mock('../helpers/session-helpers.js')

const { getSessionKey } = await import('../helpers/session-helpers.js')

describe('StartController', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      path: '/request-account/start',
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
    test('renders start view for regular user', () => {
      startController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/start/index',
        expect.objectContaining({
          pageTitle: 'accounts.request_account.start.title',
          isAdmin: false,
          nextRoute: '/request-account/details'
        })
      )
    })

    test('renders start view for admin context', () => {
      mockRequest.path = '/admin/accounts/start'

      startController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/start/index',
        expect.objectContaining({
          pageTitle: 'accounts.add_user.start.title',
          isAdmin: true,
          nextRoute: '/admin/user-account/is-admin'
        })
      )
    })

    test('sets journey started flag in session for regular user', () => {
      startController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          journeyStarted: true,
          admin: false
        })
      )
    })

    test('sets journey started flag in session for admin', () => {
      mockRequest.path = '/admin/accounts/start'

      startController.handler(mockRequest, mockH)

      expect(mockRequest.yar.set).toHaveBeenCalledWith(
        'accountData',
        expect.objectContaining({
          journeyStarted: true
        })
      )
    })

    test('includes login route', () => {
      startController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/accounts/start/index',
        expect.objectContaining({
          loginRoute: '/login'
        })
      )
    })
  })
})
