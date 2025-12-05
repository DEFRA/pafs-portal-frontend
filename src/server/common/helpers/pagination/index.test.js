import { describe, test, expect, vi } from 'vitest'
import {
  buildPaginationUrl,
  buildGovukPagination,
  getDefaultPageSize
} from './index.js'

// Mock the config module
vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'pagination.defaultPageSize') {
        return 20
      }
      return null
    })
  }
}))

describe('Pagination Helper', () => {
  describe('getDefaultPageSize', () => {
    test('returns default page size from config', () => {
      const result = getDefaultPageSize()
      expect(result).toBe(20)
    })
  })

  describe('buildPaginationUrl', () => {
    test('returns base URL when no params provided', () => {
      const result = buildPaginationUrl('/admin/users', {})
      expect(result).toBe('/admin/users')
    })

    test('adds single parameter', () => {
      const result = buildPaginationUrl('/admin/users', { page: 2 })
      expect(result).toBe('/admin/users?page=2')
    })

    test('adds multiple parameters', () => {
      const result = buildPaginationUrl('/admin/users', {
        page: 3,
        search: 'john'
      })
      expect(result).toBe('/admin/users?page=3&search=john')
    })

    test('encodes special characters in values', () => {
      const result = buildPaginationUrl('/admin/users', {
        search: 'john doe'
      })
      expect(result).toBe('/admin/users?search=john%20doe')
    })

    test('filters out undefined values', () => {
      const result = buildPaginationUrl('/admin/users', {
        page: 1,
        search: undefined
      })
      expect(result).toBe('/admin/users?page=1')
    })

    test('filters out null values', () => {
      const result = buildPaginationUrl('/admin/users', {
        page: 2,
        areaId: null
      })
      expect(result).toBe('/admin/users?page=2')
    })

    test('filters out empty string values', () => {
      const result = buildPaginationUrl('/admin/users', {
        page: 1,
        search: ''
      })
      expect(result).toBe('/admin/users?page=1')
    })

    test('handles all filters together', () => {
      const result = buildPaginationUrl('/admin/users/pending', {
        page: 2,
        search: 'test@example.com',
        areaId: '123'
      })
      expect(result).toBe(
        '/admin/users/pending?page=2&search=test%40example.com&areaId=123'
      )
    })
  })

  describe('buildGovukPagination', () => {
    const baseParams = {
      currentPage: 1,
      totalPages: 5,
      totalItems: 100,
      pageSize: 20,
      baseUrl: '/admin/users',
      filters: {}
    }

    describe('single page or no results', () => {
      test('returns null summary when no items', () => {
        const result = buildGovukPagination({
          ...baseParams,
          totalPages: 0,
          totalItems: 0
        })

        expect(result.summary).toBeNull()
        expect(result.items).toBeUndefined()
      })

      test('returns summary without pagination items for single page', () => {
        const result = buildGovukPagination({
          ...baseParams,
          totalPages: 1,
          totalItems: 15
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
    })

    describe('first page', () => {
      test('shows next but not previous on first page', () => {
        const result = buildGovukPagination(baseParams)

        expect(result.previous).toBeUndefined()
        expect(result.next).toBeDefined()
        expect(result.next.href).toBe('/admin/users?page=2')
      })

      test('marks first page as current', () => {
        const result = buildGovukPagination(baseParams)

        const firstItem = result.items.find((item) => item.number === '1')
        expect(firstItem.current).toBe(true)
      })

      test('calculates correct summary for first page', () => {
        const result = buildGovukPagination(baseParams)

        expect(result.summary).toEqual({
          startItem: 1,
          endItem: 20,
          totalItems: 100
        })
      })
    })

    describe('middle page', () => {
      test('shows both previous and next on middle page', () => {
        const result = buildGovukPagination({
          ...baseParams,
          currentPage: 3
        })

        expect(result.previous).toBeDefined()
        expect(result.previous.href).toBe('/admin/users?page=2')
        expect(result.next).toBeDefined()
        expect(result.next.href).toBe('/admin/users?page=4')
      })

      test('marks current page correctly', () => {
        const result = buildGovukPagination({
          ...baseParams,
          currentPage: 3
        })

        const currentItem = result.items.find((item) => item.number === '3')
        expect(currentItem.current).toBe(true)
      })

      test('calculates correct summary for middle page', () => {
        const result = buildGovukPagination({
          ...baseParams,
          currentPage: 3
        })

        expect(result.summary).toEqual({
          startItem: 41,
          endItem: 60,
          totalItems: 100
        })
      })
    })

    describe('last page', () => {
      test('shows previous but not next on last page', () => {
        const result = buildGovukPagination({
          ...baseParams,
          currentPage: 5
        })

        expect(result.previous).toBeDefined()
        expect(result.previous.href).toBe('/admin/users?page=4')
        expect(result.next).toBeUndefined()
      })

      test('marks last page as current', () => {
        const result = buildGovukPagination({
          ...baseParams,
          currentPage: 5
        })

        const lastItem = result.items.find((item) => item.number === '5')
        expect(lastItem.current).toBe(true)
      })

      test('calculates correct summary for last page with partial results', () => {
        const result = buildGovukPagination({
          ...baseParams,
          currentPage: 5,
          totalItems: 95
        })

        expect(result.summary).toEqual({
          startItem: 81,
          endItem: 95,
          totalItems: 95
        })
      })
    })

    describe('filter preservation in URLs', () => {
      test('preserves search filter in pagination URLs', () => {
        const result = buildGovukPagination({
          ...baseParams,
          filters: { search: 'john' }
        })

        expect(result.next.href).toBe('/admin/users?page=2&search=john')
      })

      test('preserves multiple filters in pagination URLs', () => {
        const result = buildGovukPagination({
          ...baseParams,
          filters: { search: 'john', areaId: '123' }
        })

        expect(result.next.href).toContain('search=john')
        expect(result.next.href).toContain('areaId=123')
      })

      test('preserves filters in page number links', () => {
        const result = buildGovukPagination({
          ...baseParams,
          filters: { search: 'test' }
        })

        const pageLinks = result.items.filter((item) => item.href)
        pageLinks.forEach((link) => {
          expect(link.href).toContain('search=test')
        })
      })
    })

    describe('default page size from config', () => {
      test('uses config default when pageSize not provided', () => {
        const result = buildGovukPagination({
          currentPage: 1,
          totalPages: 5,
          totalItems: 100,
          baseUrl: '/admin/users',
          filters: {}
        })

        // With default page size of 20 (from config mock)
        expect(result.summary.endItem).toBe(20)
      })
    })

    describe('two pages', () => {
      test('handles exactly two pages', () => {
        const result = buildGovukPagination({
          ...baseParams,
          totalPages: 2,
          totalItems: 35
        })

        expect(result.items).toHaveLength(2)
        expect(result.items[0].number).toBe('1')
        expect(result.items[1].number).toBe('2')
      })
    })

    describe('GOV.UK Design System pagination pattern', () => {
      // Pattern reference:
      // [1] 2 … 100      (page 1)
      // 1 [2] 3 … 100    (page 2)
      // 1 2 [3] 4 … 100  (page 3)
      // 1 2 3 [4] 5 … 100 (page 4)
      // 1 … 4 [5] 6 … 100 (page 5 onwards, middle)
      // 1 … 97 [98] 99 100 (page 98)
      // 1 … 98 [99] 100   (page 99)
      // 1 … 99 [100]      (page 100)

      const manyPagesParams = {
        ...baseParams,
        totalPages: 100,
        totalItems: 2000
      }

      test('page 1: shows [1] 2 … 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 1
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: true })
        expect(result.items[1]).toMatchObject({ number: '2', current: false })
        expect(result.items[2]).toEqual({ ellipsis: true })
        expect(result.items[3]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(4)
      })

      test('page 2: shows 1 [2] 3 … 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 2
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toMatchObject({ number: '2', current: true })
        expect(result.items[2]).toMatchObject({ number: '3', current: false })
        expect(result.items[3]).toEqual({ ellipsis: true })
        expect(result.items[4]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(5)
      })

      test('page 3: shows 1 2 [3] 4 … 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 3
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toMatchObject({ number: '2', current: false })
        expect(result.items[2]).toMatchObject({ number: '3', current: true })
        expect(result.items[3]).toMatchObject({ number: '4', current: false })
        expect(result.items[4]).toEqual({ ellipsis: true })
        expect(result.items[5]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(6)
      })

      test('page 4: shows 1 2 3 [4] 5 … 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 4
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toMatchObject({ number: '2', current: false })
        expect(result.items[2]).toMatchObject({ number: '3', current: false })
        expect(result.items[3]).toMatchObject({ number: '4', current: true })
        expect(result.items[4]).toMatchObject({ number: '5', current: false })
        expect(result.items[5]).toEqual({ ellipsis: true })
        expect(result.items[6]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(7)
      })

      test('page 5 (middle): shows 1 … 4 [5] 6 … 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 5
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toEqual({ ellipsis: true })
        expect(result.items[2]).toMatchObject({ number: '4', current: false })
        expect(result.items[3]).toMatchObject({ number: '5', current: true })
        expect(result.items[4]).toMatchObject({ number: '6', current: false })
        expect(result.items[5]).toEqual({ ellipsis: true })
        expect(result.items[6]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(7)
      })

      test('page 50 (middle): shows 1 … 49 [50] 51 … 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 50
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toEqual({ ellipsis: true })
        expect(result.items[2]).toMatchObject({ number: '49', current: false })
        expect(result.items[3]).toMatchObject({ number: '50', current: true })
        expect(result.items[4]).toMatchObject({ number: '51', current: false })
        expect(result.items[5]).toEqual({ ellipsis: true })
        expect(result.items[6]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(7)
      })

      test('page 97: shows 1 … 96 [97] 98 99 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 97
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toEqual({ ellipsis: true })
        expect(result.items[2]).toMatchObject({ number: '96', current: false })
        expect(result.items[3]).toMatchObject({ number: '97', current: true })
        expect(result.items[4]).toMatchObject({ number: '98', current: false })
        expect(result.items[5]).toMatchObject({ number: '99', current: false })
        expect(result.items[6]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(7)
      })

      test('page 98: shows 1 … 97 [98] 99 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 98
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toEqual({ ellipsis: true })
        expect(result.items[2]).toMatchObject({ number: '97', current: false })
        expect(result.items[3]).toMatchObject({ number: '98', current: true })
        expect(result.items[4]).toMatchObject({ number: '99', current: false })
        expect(result.items[5]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(6)
      })

      test('page 99: shows 1 … 98 [99] 100', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 99
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toEqual({ ellipsis: true })
        expect(result.items[2]).toMatchObject({ number: '98', current: false })
        expect(result.items[3]).toMatchObject({ number: '99', current: true })
        expect(result.items[4]).toMatchObject({ number: '100', current: false })
        expect(result.items).toHaveLength(5)
      })

      test('page 100: shows 1 … 99 [100]', () => {
        const result = buildGovukPagination({
          ...manyPagesParams,
          currentPage: 100
        })

        expect(result.items[0]).toMatchObject({ number: '1', current: false })
        expect(result.items[1]).toEqual({ ellipsis: true })
        expect(result.items[2]).toMatchObject({ number: '99', current: false })
        expect(result.items[3]).toMatchObject({ number: '100', current: true })
        expect(result.items).toHaveLength(4)
      })
    })

    describe('small page counts (5 or fewer)', () => {
      test('shows all 3 pages without ellipsis', () => {
        const result = buildGovukPagination({
          ...baseParams,
          totalPages: 3,
          currentPage: 2
        })

        expect(result.items).toHaveLength(3)
        expect(result.items[0].number).toBe('1')
        expect(result.items[1].number).toBe('2')
        expect(result.items[2].number).toBe('3')
        const ellipsisItems = result.items.filter((item) => item.ellipsis)
        expect(ellipsisItems).toHaveLength(0)
      })

      test('shows all 5 pages without ellipsis', () => {
        const result = buildGovukPagination({
          ...baseParams,
          totalPages: 5,
          currentPage: 3
        })

        expect(result.items).toHaveLength(5)
        expect(result.items[0].number).toBe('1')
        expect(result.items[1].number).toBe('2')
        expect(result.items[2].number).toBe('3')
        expect(result.items[3].number).toBe('4')
        expect(result.items[4].number).toBe('5')
        const ellipsisItems = result.items.filter((item) => item.ellipsis)
        expect(ellipsisItems).toHaveLength(0)
      })
    })
  })
})
