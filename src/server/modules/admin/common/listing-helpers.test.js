import { describe, test, expect, beforeEach, vi } from 'vitest'
import {
  buildListingRequestContext,
  buildListingPagination,
  buildListingViewModel,
  buildEmptyListingViewModel
} from './listing-helpers.js'

vi.mock('../../../common/helpers/auth/session-manager.js')

const { getAuthSession } =
  await import('../../../common/helpers/auth/session-manager.js')

describe('listing-helpers', () => {
  let mockRequest

  beforeEach(() => {
    mockRequest = {
      server: {
        logger: {
          error: vi.fn(),
          warn: vi.fn(),
          info: vi.fn()
        }
      },
      query: {},
      yar: {
        flash: vi.fn(() => [])
      },
      t: vi.fn((key) => key)
    }

    getAuthSession.mockReturnValue({
      user: { id: '1', name: 'Test User' },
      accessToken: 'test-token'
    })

    vi.clearAllMocks()
  })

  describe('buildListingRequestContext', () => {
    test('extracts basic context without filters', () => {
      const context = buildListingRequestContext(mockRequest, [])

      expect(context.session.user.id).toBe('1')
      expect(context.logger).toBeDefined()
      expect(context.page).toBe(1)
      expect(context.filters).toEqual({})
    })

    test('extracts page from query', () => {
      mockRequest.query.page = '3'

      const context = buildListingRequestContext(mockRequest, [])

      expect(context.page).toBe(3)
    })

    test('defaults to page 1 when invalid', () => {
      mockRequest.query.page = 'invalid'

      const context = buildListingRequestContext(mockRequest, [])

      expect(context.page).toBe(1)
    })

    test('extracts specified filter keys', () => {
      mockRequest.query.search = 'test'
      mockRequest.query.type = 'PSO'
      mockRequest.query.other = 'ignored'

      const context = buildListingRequestContext(mockRequest, [
        'search',
        'type'
      ])

      expect(context.filters).toEqual({
        search: 'test',
        type: 'PSO'
      })
    })

    test('defaults missing filters to empty string', () => {
      const context = buildListingRequestContext(mockRequest, ['search'])

      expect(context.filters.search).toBe('')
    })

    test('extracts success notification', () => {
      mockRequest.yar.flash = vi.fn((key) => {
        if (key === 'success') {
          return [{ title: 'Success', message: 'Done' }]
        }
        return []
      })

      const context = buildListingRequestContext(mockRequest, [])

      expect(context.successNotification).toEqual({
        title: 'Success',
        message: 'Done'
      })
    })

    test('prioritizes userCreated flash over success flash', () => {
      mockRequest.yar.flash = vi.fn((key) => {
        if (key === 'userCreated') {
          return [{ title: 'User Created' }]
        }
        if (key === 'success') {
          return [{ title: 'Success' }]
        }
        return []
      })

      const context = buildListingRequestContext(mockRequest, [])

      expect(context.successNotification.title).toBe('User Created')
    })

    test('extracts error notification', () => {
      mockRequest.yar.flash = vi.fn((key) => {
        if (key === 'error') {
          return [{ title: 'Error', message: 'Failed' }]
        }
        return []
      })

      const context = buildListingRequestContext(mockRequest, [])

      expect(context.errorNotification).toEqual({
        title: 'Error',
        message: 'Failed'
      })
    })
  })

  describe('buildListingPagination', () => {
    test('builds pagination with standard fields', () => {
      const pagination = {
        page: 2,
        totalPages: 5,
        total: 100,
        pageSize: 20
      }

      const result = buildListingPagination(pagination, '/admin/test', {
        search: 'test'
      })

      expect(result.previous).toBeDefined()
      expect(result.next).toBeDefined()
      expect(result.items).toBeDefined()
    })

    test('handles alternative field names', () => {
      const pagination = {
        currentPage: 2,
        totalPages: 5,
        total: 100,
        pageSize: 20
      }

      const result = buildListingPagination(pagination, '/admin/test', {})

      expect(result).toBeDefined()
    })

    test('defaults to page 1 when missing', () => {
      const pagination = {
        totalPages: 0,
        total: 0
      }

      const result = buildListingPagination(pagination, '/admin/test', {})

      expect(result).toBeDefined()
    })
  })

  describe('buildListingViewModel', () => {
    test('builds complete view model', () => {
      const params = {
        request: mockRequest,
        session: { user: { id: '1', name: 'Test' } },
        pageTitle: 'Test Page',
        items: [{ id: '1' }],
        pagination: { page: 1, totalPages: 1, total: 1, pageSize: 20 },
        baseUrl: '/admin/test',
        filters: { search: 'test' }
      }

      const viewModel = buildListingViewModel(params)

      expect(viewModel.pageTitle).toBe('Test Page')
      expect(viewModel.user.id).toBe('1')
      expect(viewModel.pagination).toBeDefined()
      expect(viewModel.filters).toEqual({ search: 'test' })
      expect(viewModel.baseUrl).toBe('/admin/test')
    })

    test('includes success notification when provided', () => {
      const params = {
        request: mockRequest,
        session: { user: { id: '1' } },
        pageTitle: 'Test',
        items: [],
        pagination: { page: 1, totalPages: 0, total: 0, pageSize: 20 },
        baseUrl: '/test',
        filters: {},
        successNotification: { title: 'Success' }
      }

      const viewModel = buildListingViewModel(params)

      expect(viewModel.successNotification).toEqual({ title: 'Success' })
    })

    test('includes error notification when provided', () => {
      const params = {
        request: mockRequest,
        session: { user: { id: '1' } },
        pageTitle: 'Test',
        items: [],
        pagination: { page: 1, totalPages: 0, total: 0, pageSize: 20 },
        baseUrl: '/test',
        filters: {},
        errorNotification: { title: 'Error' }
      }

      const viewModel = buildListingViewModel(params)

      expect(viewModel.errorNotification).toEqual({ title: 'Error' })
    })

    test('includes error message when provided', () => {
      const params = {
        request: mockRequest,
        session: { user: { id: '1' } },
        pageTitle: 'Test',
        items: [],
        pagination: { page: 1, totalPages: 0, total: 0, pageSize: 20 },
        baseUrl: '/test',
        filters: {},
        error: 'Something went wrong'
      }

      const viewModel = buildListingViewModel(params)

      expect(viewModel.error).toBe('Something went wrong')
    })

    test('merges additional data', () => {
      const params = {
        request: mockRequest,
        session: { user: { id: '1' } },
        pageTitle: 'Test',
        items: [],
        pagination: { page: 1, totalPages: 0, total: 0, pageSize: 20 },
        baseUrl: '/test',
        filters: {},
        additionalData: {
          customField: 'custom value',
          options: ['A', 'B']
        }
      }

      const viewModel = buildListingViewModel(params)

      expect(viewModel.customField).toBe('custom value')
      expect(viewModel.options).toEqual(['A', 'B'])
    })
  })

  describe('buildEmptyListingViewModel', () => {
    test('builds empty view model with default pagination', () => {
      const params = {
        request: mockRequest,
        session: { user: { id: '1' } },
        pageTitle: 'Test',
        baseUrl: '/test',
        filters: {},
        error: 'Failed to load'
      }

      const viewModel = buildEmptyListingViewModel(params)

      expect(viewModel.pageTitle).toBe('Test')
      expect(viewModel.pagination).toBeDefined()
      expect(viewModel.error).toBe('Failed to load')
    })
  })
})
