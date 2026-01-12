import { describe, test, expect, beforeEach, vi } from 'vitest'
import { activeUsersController } from './controller.js'

vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/accounts/accounts-service.js')

const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { getAccounts, getPendingCount, getActiveCount } =
  await import('../../../../common/services/accounts/accounts-service.js')

describe('Active Users Controller', () => {
  let mockRequest
  let mockH

  const mockUser = {
    id: 1,
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    admin: true
  }

  const mockAccountsResponse = {
    success: true,
    data: {
      data: [
        {
          id: 1,
          firstName: 'Emma',
          lastName: 'Wilson',
          email: 'emma.wilson@environment-agency.gov.uk',
          admin: true,
          areas: [{ id: 1, name: 'Thames', primary: true }],
          createdAt: '2025-01-15T00:00:00.000Z',
          lastSignIn: '2025-10-20T00:00:00.000Z'
        }
      ],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1
      }
    }
  }

  beforeEach(() => {
    mockRequest = {
      query: {},
      t: vi.fn((key) => key),
      yar: {
        flash: vi.fn(() => [])
      },
      server: {
        logger: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn()
        }
      }
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    vi.clearAllMocks()
  })

  describe('controller configuration', () => {
    test('exports activeUsersController with handler', () => {
      expect(activeUsersController).toBeDefined()
      expect(activeUsersController.handler).toBeDefined()
      expect(typeof activeUsersController.handler).toBe('function')
    })

    test('renders active users template', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(6)

      await activeUsersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/admin/users/active/index',
        expect.objectContaining({
          currentTab: 'active',
          baseUrl: '/admin/users/active'
        })
      )
    })

    test('fetches accounts with active status', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(6)

      await activeUsersController.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      )
    })

    test('includes isAdmin and lastSignIn in user data', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(6)

      await activeUsersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'modules/admin/users/active/index',
        expect.objectContaining({
          users: expect.arrayContaining([
            expect.objectContaining({
              isAdmin: true,
              lastSignIn: expect.any(String)
            })
          ])
        })
      )
    })
  })
})
