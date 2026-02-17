/**
 * Generic helper for retrieving cached list data
 * @param {Object} cacheService - Cache service instance
 * @param {Object} cacheParams - Parameters for cache key generation
 * @param {string} idsKey - Key name for IDs in metadata (e.g., 'accountIds', 'projectIds')
 * @param {Function} getItemsByIds - Function to retrieve items by IDs from cache
 * @returns {Promise<{metadata: Object|null, data: Array|null}>}
 */
export async function tryGetFromCache(
  cacheService,
  cacheParams,
  idsKey,
  getItemsByIds
) {
  if (!cacheService) {
    return { metadata: null, data: null }
  }

  const metadata = await cacheService.getListMetadata(cacheParams)

  if (!metadata?.[idsKey]) {
    return { metadata: null, data: null }
  }

  const cachedItems = await getItemsByIds(metadata[idsKey])

  const allItemsCached = cachedItems.every((item) => item !== null)
  if (!allItemsCached) {
    return { metadata: null, data: null }
  }

  return { metadata, data: cachedItems }
}

/**
 * Generic helper for storing list data in cache
 * @param {Object} cacheService - Cache service instance
 * @param {Object} cacheParams - Parameters for cache key generation
 * @param {Array} items - Items to cache
 * @param {Object} pagination - Pagination metadata
 * @param {Function} setItems - Function to store items in cache
 * @param {Function} extractId - Function to extract ID from item
 * @returns {Promise<void>}
 */
export async function storeInCache(
  cacheService,
  cacheParams,
  items,
  pagination,
  setItems,
  extractId
) {
  if (!cacheService || !items || items.length === 0) {
    return
  }

  await setItems(items)

  const ids = items.map((item) => extractId(item)).filter(Boolean)
  await cacheService.setListMetadata(cacheParams, ids, pagination)
}
