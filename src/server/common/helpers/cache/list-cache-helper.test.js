import { describe, test, expect, vi } from 'vitest'
import { tryGetFromCache, storeInCache } from './list-cache-helper.js'

describe('list-cache-helper', () => {
  describe('tryGetFromCache', () => {
    test('returns null data when cacheService is null', async () => {
      const result = await tryGetFromCache(null, {}, 'itemIds', vi.fn())

      expect(result).toEqual({ metadata: null, data: null })
    })

    test('returns null data when metadata is not found', async () => {
      const cacheService = {
        getListMetadata: vi.fn().mockResolvedValue(null)
      }

      const result = await tryGetFromCache(
        cacheService,
        { page: 1 },
        'itemIds',
        vi.fn()
      )

      expect(result).toEqual({ metadata: null, data: null })
      expect(cacheService.getListMetadata).toHaveBeenCalledWith({ page: 1 })
    })

    test('returns null data when IDs are not in metadata', async () => {
      const cacheService = {
        getListMetadata: vi.fn().mockResolvedValue({ other: 'data' })
      }

      const result = await tryGetFromCache(
        cacheService,
        { page: 1 },
        'itemIds',
        vi.fn()
      )

      expect(result).toEqual({ metadata: null, data: null })
    })

    test('returns null data when some items are missing from cache', async () => {
      const metadata = { itemIds: [1, 2, 3], pagination: { total: 3 } }
      const cacheService = {
        getListMetadata: vi.fn().mockResolvedValue(metadata)
      }
      const getItemsByIds = vi
        .fn()
        .mockResolvedValue([{ id: 1 }, null, { id: 3 }])

      const result = await tryGetFromCache(
        cacheService,
        { page: 1 },
        'itemIds',
        getItemsByIds
      )

      expect(result).toEqual({ metadata: null, data: null })
      expect(getItemsByIds).toHaveBeenCalledWith([1, 2, 3])
    })

    test('returns cached data when all items are found', async () => {
      const metadata = { itemIds: [1, 2, 3], pagination: { total: 3 } }
      const cachedItems = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const cacheService = {
        getListMetadata: vi.fn().mockResolvedValue(metadata)
      }
      const getItemsByIds = vi.fn().mockResolvedValue(cachedItems)

      const result = await tryGetFromCache(
        cacheService,
        { page: 1 },
        'itemIds',
        getItemsByIds
      )

      expect(result).toEqual({ metadata, data: cachedItems })
      expect(getItemsByIds).toHaveBeenCalledWith([1, 2, 3])
    })
  })

  describe('storeInCache', () => {
    test('does nothing when cacheService is null', async () => {
      const setItems = vi.fn()

      await storeInCache(null, {}, [{ id: 1 }], {}, setItems, (item) => item.id)

      expect(setItems).not.toHaveBeenCalled()
    })

    test('does nothing when items is null', async () => {
      const cacheService = { setListMetadata: vi.fn() }
      const setItems = vi.fn()

      await storeInCache(
        cacheService,
        {},
        null,
        {},
        setItems,
        (item) => item.id
      )

      expect(setItems).not.toHaveBeenCalled()
      expect(cacheService.setListMetadata).not.toHaveBeenCalled()
    })

    test('does nothing when items is empty', async () => {
      const cacheService = { setListMetadata: vi.fn() }
      const setItems = vi.fn()

      await storeInCache(cacheService, {}, [], {}, setItems, (item) => item.id)

      expect(setItems).not.toHaveBeenCalled()
      expect(cacheService.setListMetadata).not.toHaveBeenCalled()
    })

    test('stores items and metadata in cache', async () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
      const pagination = { total: 3, page: 1 }
      const cacheParams = { page: 1, pageSize: 10 }
      const cacheService = { setListMetadata: vi.fn() }
      const setItems = vi.fn()

      await storeInCache(
        cacheService,
        cacheParams,
        items,
        pagination,
        setItems,
        (item) => item.id
      )

      expect(setItems).toHaveBeenCalledWith(items)
      expect(cacheService.setListMetadata).toHaveBeenCalledWith(
        cacheParams,
        [1, 2, 3],
        pagination
      )
    })

    test('filters out null/undefined IDs', async () => {
      const items = [{ id: 1 }, { id: null }, { id: 3 }, {}]
      const pagination = { total: 4, page: 1 }
      const cacheParams = { page: 1 }
      const cacheService = { setListMetadata: vi.fn() }
      const setItems = vi.fn()

      await storeInCache(
        cacheService,
        cacheParams,
        items,
        pagination,
        setItems,
        (item) => item.id
      )

      expect(cacheService.setListMetadata).toHaveBeenCalledWith(
        cacheParams,
        [1, 3],
        pagination
      )
    })

    test('handles custom ID extractors', async () => {
      const items = [{ userId: 'a' }, { userId: 'b' }, { userId: 'c' }]
      const pagination = { total: 3 }
      const cacheParams = { page: 1 }
      const cacheService = { setListMetadata: vi.fn() }
      const setItems = vi.fn()

      await storeInCache(
        cacheService,
        cacheParams,
        items,
        pagination,
        setItems,
        (item) => item.userId
      )

      expect(cacheService.setListMetadata).toHaveBeenCalledWith(
        cacheParams,
        ['a', 'b', 'c'],
        pagination
      )
    })
  })
})
