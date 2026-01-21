import { describe, test, expect, beforeEach, vi } from 'vitest'
import { createUsersListController } from './users-list-controller.js'

vi.mock('../../../../common/helpers/auth/session-manager.js')
vi.mock('../../../../common/services/accounts/accounts-service.js')
vi.mock('../../../../common/services/accounts/accounts-cache.js')

const { getAuthSession } =
  await import('../../../../common/helpers/auth/session-manager.js')
const { getAccounts, getPendingCount, getActiveCount } =
  await import('../../../../common/services/accounts/accounts-service.js')
const { createAccountsCacheService } =
  await import('../../../../common/services/accounts/accounts-cache.js')

describe('createUsersListController', () => {
  let mockRequest
  let mockH
  let mockCacheService

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
          admin: false,
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
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      getByKey: vi.fn(),
      setByKey: vi.fn()
    }
    createAccountsCacheService.mockReturnValue(mockCacheService)

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
      },
      getAreas: vi.fn().mockResolvedValue({
        'EA Area': [{ id: '1', name: 'Anglian' }],
        'PSO Area': [{ id: '2', name: 'Lincolnshire and Northamptonshire' }],
        RMA: [
          { id: '3', name: 'Cumbria' },
          { id: '4', name: 'Lancashire' }
        ]
      })
    }

    mockH = {
      view: vi.fn((template, context) => ({ template, context })),
      redirect: vi.fn((url) => ({ redirect: url }))
    }

    vi.clearAllMocks()
  })

  describe('controller factory', () => {
    test('creates controller with handler function', () => {
      const controller = createUsersListController({
        status: 'pending',
        viewTemplate: 'admin/users/pending/index',
        baseUrl: '/admin/users/pending'
      })

      expect(controller).toHaveProperty('handler')
      expect(typeof controller.handler).toBe('function')
    })
  })

  describe('pending users controller', () => {
    const pendingController = createUsersListController({
      status: 'pending',
      viewTemplate: 'admin/users/pending/index',
      baseUrl: '/admin/users/pending'
    })

    test('renders pending users page with correct template', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await pendingController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          currentTab: 'pending',
          baseUrl: '/admin/users/pending'
        })
      )
    })

    test('calls API with pending status', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await pendingController.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending'
        })
      )
    })
  })

  describe('active users controller', () => {
    const activeController = createUsersListController({
      status: 'active',
      viewTemplate: 'admin/users/active/index',
      baseUrl: '/admin/users/active'
    })

    test('renders active users page with correct template', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await activeController.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/active/index',
        expect.objectContaining({
          currentTab: 'active',
          baseUrl: '/admin/users/active'
        })
      )
    })

    test('calls API with active status', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await activeController.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active'
        })
      )
    })
  })

  describe('shared behavior', () => {
    const controller = createUsersListController({
      status: 'pending',
      viewTemplate: 'admin/users/pending/index',
      baseUrl: '/admin/users/pending'
    })

    test('passes search filter to API', async () => {
      mockRequest.query = { search: 'john' }

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'john'
        })
      )
    })

    test('passes page parameter to API', async () => {
      mockRequest.query = { page: '2' }

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2
        })
      )
    })

    test('defaults to page 1 when page is invalid', async () => {
      mockRequest.query = { page: 'invalid' }

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1
        })
      )
    })

    test('passes areaId filter to API', async () => {
      mockRequest.query = { areaId: '5' }

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          areaId: '5'
        })
      )
    })

    test('handles API error gracefully', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue({
        success: false,
        errors: [{ errorCode: 'NETWORK_ERROR' }]
      })
      getPendingCount.mockResolvedValue(0)
      getActiveCount.mockResolvedValue(0)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          users: [],
          error: 'accounts.manage_users.errors.fetch_failed'
        })
      )
    })

    test('handles exception gracefully', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockRejectedValue(new Error('Network error'))
      getPendingCount.mockResolvedValue(0)
      getActiveCount.mockResolvedValue(0)

      await controller.handler(mockRequest, mockH)

      expect(mockRequest.server.logger.error).toHaveBeenCalled()
      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          users: [],
          error: 'accounts.manage_users.errors.fetch_failed'
        })
      )
    })

    test('returns formatted users with all fields', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          users: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String), // ID is now encoded
              firstName: 'John',
              lastName: 'Smith',
              email: 'john.smith@example.com',
              primaryArea: 'Thames',
              isAdmin: false,
              createdAt: expect.any(String),
              lastSignIn: expect.any(String)
            })
          ])
        })
      )
    })

    test('returns counts for tabs', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          pendingCount: 5,
          activeCount: 10
        })
      )
    })

    test('returns pagination data', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          pagination: expect.objectContaining({
            summary: expect.objectContaining({
              startItem: 1,
              endItem: 1,
              totalItems: 1
            })
          })
        })
      )
    })

    test('returns filter values in view model', async () => {
      mockRequest.query = { search: 'test', areaId: '3' }

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          filters: { search: 'test', areaId: '3' }
        })
      )
    })

    test('returns area options for dropdown', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          areas: [
            { value: '', text: 'accounts.manage_users.filters.all_areas' },
            {
              label: 'Area Program Team',
              options: [{ value: '1', text: 'Anglian' }]
            },
            {
              label: 'PSO Team',
              options: [
                { value: '2', text: 'Lincolnshire and Northamptonshire' }
              ]
            },
            {
              label: 'RMA',
              options: [
                { value: '3', text: 'Cumbria' },
                { value: '4', text: 'Lancashire' }
              ]
            }
          ]
        })
      )
    })

    test('creates cache service and passes to API calls', async () => {
      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(createAccountsCacheService).toHaveBeenCalledWith(
        mockRequest.server
      )
      expect(getAccounts).toHaveBeenCalledWith(
        expect.objectContaining({
          cacheService: mockCacheService
        })
      )
      expect(getPendingCount).toHaveBeenCalledWith(
        'test-token',
        mockCacheService
      )
      expect(getActiveCount).toHaveBeenCalledWith(
        'test-token',
        mockCacheService
      )
    })

    test('displays success notification when user was created', async () => {
      const flashData = { name: 'John Doe', userId: 123 }
      mockRequest.yar.flash = vi.fn(() => [flashData])

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        'admin/users/pending/index',
        expect.objectContaining({
          successNotification: flashData
        })
      )
    })

    test('does not display notification when no flash message', async () => {
      mockRequest.yar.flash = vi.fn(() => [])

      getAuthSession.mockReturnValue({
        user: mockUser,
        accessToken: 'test-token'
      })
      getAccounts.mockResolvedValue(mockAccountsResponse)
      getPendingCount.mockResolvedValue(5)
      getActiveCount.mockResolvedValue(10)

      await controller.handler(mockRequest, mockH)

      const viewCall = mockH.view.mock.calls[0]
      expect(viewCall[0]).toBe('admin/users/pending/index')
      expect(viewCall[1]).not.toHaveProperty('successNotification')
    })
  })
})
