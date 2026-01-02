import { describe, test, expect, vi } from 'vitest'
import {
  getPrimaryAreaName,
  formatUserForDisplay,
  formatUsersForDisplay,
  getAreaFilterOptions,
  buildUsersViewModel,
  getEmptyUsersViewModel
} from './user-listing.js'
import { buildGovukPagination } from '../../../../common/helpers/pagination/index.js'

describe('User Helpers', () => {
  describe('getPrimaryAreaName', () => {
    test('returns null for empty areas', () => {
      expect(getPrimaryAreaName([])).toBeNull()
    })

    test('returns null for undefined areas', () => {
      expect(getPrimaryAreaName(undefined)).toBeNull()
    })

    test('returns null for null areas', () => {
      expect(getPrimaryAreaName(null)).toBeNull()
    })

    test('returns primary area name when exists', () => {
      const areas = [
        { name: 'Area 1', primary: false },
        { name: 'Area 2', primary: true },
        { name: 'Area 3', primary: false }
      ]
      expect(getPrimaryAreaName(areas)).toBe('Area 2')
    })

    test('returns first area name when no primary set', () => {
      const areas = [
        { name: 'Area 1', primary: false },
        { name: 'Area 2', primary: false }
      ]
      expect(getPrimaryAreaName(areas)).toBe('Area 1')
    })

    test('returns first area when all primary are false', () => {
      const areas = [{ name: 'Only Area' }]
      expect(getPrimaryAreaName(areas)).toBe('Only Area')
    })
  })

  describe('formatUserForDisplay', () => {
    test('formats user with all fields', () => {
      const user = {
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        admin: true,
        createdAt: '2025-01-15T10:00:00Z',
        lastSignIn: '2025-01-20T14:30:00Z',
        areas: [{ name: 'Liverpool', primary: true }]
      }

      const result = formatUserForDisplay(user)

      expect(result).toEqual({
        id: 1,
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@example.com',
        isAdmin: true,
        primaryArea: '-',
        createdAt: '2025-01-15T10:00:00Z',
        lastSignIn: '2025-01-20T14:30:00Z'
      })
    })

    test('formats non-admin user with primary area', () => {
      const user = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        admin: false,
        createdAt: '2025-01-10T09:00:00Z',
        lastSignIn: '2025-01-15T10:00:00Z',
        areas: [{ name: 'Liverpool', primary: true }]
      }

      const result = formatUserForDisplay(user)

      expect(result.isAdmin).toBe(false)
      expect(result.primaryArea).toBe('Liverpool')
    })

    test('handles non-admin user without areas', () => {
      const user = {
        id: 2,
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        createdAt: '2025-01-10T09:00:00Z',
        areas: []
      }

      const result = formatUserForDisplay(user)

      expect(result.isAdmin).toBe(false)
      expect(result.primaryArea).toBeNull()
      expect(result.lastSignIn).toBeNull()
    })

    test('handles user with lastSignIn null', () => {
      const user = {
        id: 3,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        createdAt: '2025-01-01T00:00:00Z',
        lastSignIn: null,
        areas: []
      }

      const result = formatUserForDisplay(user)

      expect(result.lastSignIn).toBeNull()
    })
  })

  describe('formatUsersForDisplay', () => {
    test('formats array of users', () => {
      const users = [
        {
          id: 1,
          firstName: 'John',
          lastName: 'Smith',
          email: 'john@example.com',
          admin: true,
          createdAt: '2025-01-15T10:00:00Z',
          areas: [{ name: 'Area 1', primary: true }]
        },
        {
          id: 2,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
          admin: false,
          createdAt: '2025-01-16T11:00:00Z',
          areas: [{ name: 'Area 2', primary: true }]
        }
      ]

      const result = formatUsersForDisplay(users)

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe(1)
      expect(result[0].isAdmin).toBe(true)
      expect(result[1].id).toBe(2)
      expect(result[1].isAdmin).toBe(false)
    })

    test('returns empty array for empty input', () => {
      expect(formatUsersForDisplay([])).toEqual([])
    })
  })

  describe('getAreaFilterOptions', () => {
    test('returns all areas option', () => {
      const mockT = vi.fn((key) => {
        if (key === 'accounts.manage_users.filters.all_areas') {
          return 'All areas'
        }
        return key
      })

      const result = getAreaFilterOptions(mockT)

      expect(result).toEqual([{ value: '', text: 'All areas' }])
      expect(mockT).toHaveBeenCalledWith(
        'accounts.manage_users.filters.all_areas'
      )
    })
  })

  describe('buildUsersViewModel', () => {
    const mockRequest = {
      t: vi.fn((key) => {
        const translations = {
          'accounts.manage_users.title': 'Manage users',
          'accounts.manage_users.filters.all_areas': 'All areas'
        }
        return translations[key] || key
      })
    }

    const mockSession = {
      user: { id: 1, email: 'admin@example.com' }
    }

    test('builds complete view model', () => {
      const result = buildUsersViewModel({
        request: mockRequest,
        session: mockSession,
        users: [{ id: 1, firstName: 'Test', lastName: 'User' }],
        pagination: { page: 1, totalPages: 5, total: 100, pageSize: 20 },
        pendingCount: 10,
        activeCount: 50,
        filters: { search: 'john', areaId: '' },
        currentTab: 'pending',
        baseUrl: '/admin/users/pending'
      })

      expect(result.pageTitle).toBe('Manage users')
      expect(result.user).toEqual(mockSession.user)
      expect(result.users).toHaveLength(1)
      expect(result.pagination.summary.startItem).toBe(1)
      expect(result.pagination.summary.endItem).toBe(20)
      expect(result.pagination.summary.totalItems).toBe(100)
      expect(result.pagination.items).toBeDefined()
      expect(result.pagination.next).toBeDefined()
      expect(result.pendingCount).toBe(10)
      expect(result.activeCount).toBe(50)
      expect(result.filters.search).toBe('john')
      expect(result.areas).toEqual([{ value: '', text: 'All areas' }])
    })

    test('includes error when provided', () => {
      const result = buildUsersViewModel({
        request: mockRequest,
        session: mockSession,
        users: [],
        pagination: { page: 1, totalPages: 0, total: 0, pageSize: 20 },
        pendingCount: 0,
        activeCount: 0,
        filters: {},
        error: 'Something went wrong'
      })

      expect(result.error).toBe('Something went wrong')
    })

    test('handles pagination with currentPage field', () => {
      const result = buildUsersViewModel({
        request: mockRequest,
        session: mockSession,
        users: [],
        pagination: { currentPage: 3, totalPages: 5, total: 100, pageSize: 20 },
        pendingCount: 0,
        activeCount: 0,
        filters: {},
        currentTab: 'pending',
        baseUrl: '/admin/users/pending'
      })

      expect(result.pagination.summary.startItem).toBe(41)
      expect(result.pagination.summary.endItem).toBe(60)
      expect(result.pagination.previous).toBeDefined()
      expect(result.pagination.next).toBeDefined()
    })

    test('handles missing pagination values', () => {
      const result = buildUsersViewModel({
        request: mockRequest,
        session: mockSession,
        users: [],
        pagination: {},
        pendingCount: 0,
        activeCount: 0,
        filters: {},
        currentTab: 'pending',
        baseUrl: '/admin/users/pending'
      })

      // Empty pagination - no items, no summary
      expect(result.pagination.summary).toBeNull()
    })

    test('handles single page pagination', () => {
      const result = buildUsersViewModel({
        request: mockRequest,
        session: mockSession,
        users: [{ id: 1 }],
        pagination: { page: 1, totalPages: 1, total: 5, pageSize: 20 },
        pendingCount: 5,
        activeCount: 0,
        filters: {},
        currentTab: 'pending',
        baseUrl: '/admin/users/pending'
      })

      // Single page - has summary but no nav items
      expect(result.pagination.summary).toBeDefined()
      expect(result.pagination.summary.totalItems).toBe(5)
      expect(result.pagination.items).toBeUndefined()
    })
  })

  describe('buildGovukPagination', () => {
    test('returns only summary for single page', () => {
      const result = buildGovukPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 15,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      expect(result.summary).toEqual({
        startItem: 1,
        endItem: 15,
        totalItems: 15
      })
      expect(result.items).toBeUndefined()
      expect(result.previous).toBeUndefined()
      expect(result.next).toBeUndefined()
    })

    test('builds pagination with next only on first page', () => {
      const result = buildGovukPagination({
        currentPage: 1,
        totalPages: 5,
        totalItems: 100,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      expect(result.items).toBeDefined()
      expect(result.previous).toBeUndefined()
      expect(result.next).toBeDefined()
      expect(result.next.href).toContain('page=2')
    })

    test('builds pagination with previous only on last page', () => {
      const result = buildGovukPagination({
        currentPage: 5,
        totalPages: 5,
        totalItems: 100,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      expect(result.previous).toBeDefined()
      expect(result.previous.href).toContain('page=4')
      expect(result.next).toBeUndefined()
    })

    test('builds pagination with both previous and next', () => {
      const result = buildGovukPagination({
        currentPage: 3,
        totalPages: 5,
        totalItems: 100,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      expect(result.previous).toBeDefined()
      expect(result.next).toBeDefined()
    })

    test('includes filter params in URLs', () => {
      const result = buildGovukPagination({
        currentPage: 2,
        totalPages: 5,
        totalItems: 100,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: { search: 'john', areaId: '5' }
      })

      expect(result.previous.href).toContain('search=john')
      expect(result.previous.href).toContain('areaId=5')
      expect(result.next.href).toContain('search=john')
      expect(result.next.href).toContain('areaId=5')
    })

    test('builds correct page items with ellipsis', () => {
      const result = buildGovukPagination({
        currentPage: 5,
        totalPages: 10,
        totalItems: 200,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      // Should have: 1, ellipsis, 4, 5, 6, ellipsis, 10
      const numbers = result.items
        .filter((item) => item.number)
        .map((item) => item.number)
      const ellipses = result.items.filter((item) => item.ellipsis)

      expect(numbers).toContain('1')
      expect(numbers).toContain('10')
      expect(ellipses.length).toBeGreaterThan(0)
    })

    test('marks current page correctly', () => {
      const result = buildGovukPagination({
        currentPage: 3,
        totalPages: 5,
        totalItems: 100,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      const currentItem = result.items.find((item) => item.current)
      expect(currentItem).toBeDefined()
      expect(currentItem.number).toBe('3')
    })

    test('returns null summary for zero items', () => {
      const result = buildGovukPagination({
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        pageSize: 20,
        baseUrl: '/admin/users/pending',
        filters: {}
      })

      expect(result.summary).toBeNull()
    })
  })

  describe('getEmptyUsersViewModel', () => {
    const mockRequest = {
      t: vi.fn((key) => {
        const translations = {
          'accounts.manage_users.title': 'Manage users',
          'accounts.manage_users.filters.all_areas': 'All areas'
        }
        return translations[key] || key
      })
    }

    test('returns empty view model with error', () => {
      const result = getEmptyUsersViewModel({
        request: mockRequest,
        session: { user: { id: 1 } },
        filters: { search: '' },
        currentTab: 'pending',
        baseUrl: '/admin/users/pending',
        error: 'Failed to load'
      })

      expect(result.users).toEqual([])
      expect(result.pagination.summary).toBeNull()
      expect(result.pendingCount).toBe(0)
      expect(result.activeCount).toBe(0)
      expect(result.error).toBe('Failed to load')
    })
  })
})
