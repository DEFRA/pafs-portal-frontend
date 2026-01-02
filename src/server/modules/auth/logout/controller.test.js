import { describe, test, expect, beforeEach, vi } from 'vitest'
import { logoutController } from './controller.js'

vi.mock('../../../common/services/auth/auth-service.js')
vi.mock('../../../common/helpers/auth/session-manager.js')

const { logout } = await import('../../../common/services/auth/auth-service.js')
const { getAuthSession, clearAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('Logout Controller', () => {
  let mockRequest
  let mockH

  beforeEach(() => {
    mockRequest = {
      server: {
        logger: {
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
})
