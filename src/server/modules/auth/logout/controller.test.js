import { describe, test, expect, beforeEach, vi } from 'vitest'
import { logoutController } from './controller.js'

vi.mock('../../../common/services/auth/auth-service.js')
vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/helpers/auth/auth-middleware.js', () => ({
  isValidReturnUrl: vi.fn((url) => url.startsWith('/') && !url.startsWith('//'))
}))

const { logout } = await import('../../../common/services/auth/auth-service.js')
const { getAuthSession, clearAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('Logout Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      info: { referrer: '' },
      yar: { set: vi.fn() },
      server: {
        logger: {
          debug: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
          info: vi.fn()
        }
      }
    }

    mockH = {
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    vi.clearAllMocks()
  })

  test('clears session and redirects to login', async () => {
    getAuthSession.mockReturnValue({
      accessToken: 'token123',
      user: { id: 1 }
    })

    await logoutController.handler(mockRequest, mockH)

    expect(logout).toHaveBeenCalledWith('token123')
    expect(clearAuthSession).toHaveBeenCalledWith(mockRequest)
    expect(mockH.redirect).toHaveBeenCalledWith('/login')
  })

  test('redirects even if no session exists', async () => {
    getAuthSession.mockReturnValue(null)

    await logoutController.handler(mockRequest, mockH)

    expect(logout).not.toHaveBeenCalled()
    expect(clearAuthSession).toHaveBeenCalled()
    expect(mockH.redirect).toHaveBeenCalledWith('/login')
  })

  test('continues if API call fails', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'token123', user: { id: 1 } })
    logout.mockRejectedValue(new Error('API error'))

    await logoutController.handler(mockRequest, mockH)

    expect(mockRequest.server.logger.warn).toHaveBeenCalled()
    expect(clearAuthSession).toHaveBeenCalled()
    expect(mockH.redirect).toHaveBeenCalledWith('/login')
  })

  test('saves returnTo from Referer header after session clear', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'token123', user: { id: 1 } })
    mockRequest.info.referrer = 'http://localhost:5001/admin/submissions'

    await logoutController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'returnTo',
      '/admin/submissions'
    )
    expect(mockH.redirect).toHaveBeenCalledWith('/login')
  })

  test('saves returnTo including query string from Referer', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'token123', user: { id: 1 } })
    mockRequest.info.referrer =
      'http://localhost:5001/projects/REF-001?tab=details'

    await logoutController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).toHaveBeenCalledWith(
      'returnTo',
      '/projects/REF-001?tab=details'
    )
  })

  test('does not set returnTo when Referer is empty', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'token123', user: { id: 1 } })
    mockRequest.info.referrer = ''

    await logoutController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).not.toHaveBeenCalled()
  })

  test('does not set returnTo when Referer is malformed', async () => {
    getAuthSession.mockReturnValue({ accessToken: 'token123', user: { id: 1 } })
    mockRequest.info.referrer = 'not-a-url'

    await logoutController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).not.toHaveBeenCalled()
  })

  test('does not set returnTo when Referer path is excluded (e.g. /login)', async () => {
    const { isValidReturnUrl } =
      await import('../../../common/helpers/auth/auth-middleware.js')
    isValidReturnUrl.mockReturnValue(false)
    getAuthSession.mockReturnValue({ accessToken: 'token123', user: { id: 1 } })
    mockRequest.info.referrer = 'http://localhost:5001/login'

    await logoutController.handler(mockRequest, mockH)

    expect(mockRequest.yar.set).not.toHaveBeenCalled()
  })
})
