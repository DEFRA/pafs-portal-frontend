import { describe, test, expect, beforeEach, vi } from 'vitest'
import { pendingUsersController } from './controller.js'

vi.mock('../../../common/helpers/auth/session-manager.js')
vi.mock('../../../common/services/accounts/accounts-service.js')

const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')
const { getAccounts, getPendingCount, getActiveCount } =
  await import('../../../common/services/accounts/accounts-service.js')

describe('Pending Users Controller', () => {
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
          firstName: 'John',
          lastName: 'Smith',
          email: 'john.smith@example.com',
          areas: [{ id: 1, name: 'Liverpool City Council', primary: true }],
          createdAt: '2025-10-18T00:00:00.000Z'
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
    test('exports pendingUsersController with handler', () => {
      expect(pendingUsersController).toBeDefined()
      expect(pendingUsersController.handler).toBeDefined()
      expect(typeof pendingUsersController.handler).toBe('function')
    })

    test('renders pending users template', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await pendingUsersController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          currentTab: 'pending',
          baseUrl: '/admin/users/pending'
        })
      )
    })

    test('fetches accounts with pending status', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await pendingUsersController.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending'
        })
      )
    })
  })
})
