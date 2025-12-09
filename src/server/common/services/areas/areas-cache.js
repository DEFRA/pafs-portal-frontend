import { config } from '../../../../config/config.js'

const CACHE_KEY = 'areas'
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds
const CACHE_SEGMENT = 'areas'

// Store the cache instance to reuse it (module-level singleton)
let cacheInstance = null
let cacheCreationAttempted = false

/**
 * Get or create the cache segment (only create once)
 * @param {Object} server - Hapi server instance
 * @returns {Object|null} Cache instance or null if caching is disabled
 */
function getCacheInstance(server) {
  // If we already have the instance, return it
  if (cacheInstance) {
    return cacheInstance
  }

  // If we've already tried and failed, don't try again
  if (cacheCreationAttempted) {
    return null
  }

  cacheCreationAttempted = true
  const cacheName = config.get('session.cache.name')

  try {
    // Create cache segment for areas (only once)
    cacheInstance = server.cache({
      cache: cacheName,
      segment: CACHE_SEGMENT,
      expiresIn: CACHE_TTL
    })
    return cacheInstance
  } catch (error) {
    // If segment already exists, we can't create it again
    // Hapi doesn't provide a way to get existing segments, so we disable caching
    if (error.message.includes('Cannot provision the same cache segment')) {
      server.logger.warn(
        'Cache segment already exists - caching will be disabled. This may happen if the server was restarted.'
      )
      cacheInstance = null
      return null
    }
    // For other errors, log and disable caching
    server.logger.error(
      { error: error.message },
      'Error creating cache segment - caching disabled'
    )
    cacheInstance = null
    return null
  }
}

function extractCachedData(cached) {
  // Catbox cache returns { item: value, stored: timestamp }
  // But sometimes it might return the value directly
  if (cached.item !== undefined) {
    return cached.item
  }

  if (Array.isArray(cached)) {
    // If cached is already an array, use it directly
    return cached
  }

  if (typeof cached === 'object' && cached !== null) {
    // Check if it's an array-like object (has numeric keys)
    const keys = Object.keys(cached)
    const hasNumericKeys =
      keys.length > 0 && keys.every((key) => !Number.isNaN(Number(key)))

    if (hasNumericKeys) {
      // Convert array-like object to array
      // Use Object.values() which preserves order for sequential numeric keys
      return Object.values(cached)
    }

    if (!cached.stored && !cached.item) {
      // It's a plain object, use it directly
      return cached
    }
  }

  // Primitive value, use directly
  return cached
}

async function getFromCache(cache, server) {
  const cached = await cache.get(CACHE_KEY)

  if (cached === null || cached === undefined) {
    return null
  }

  const cachedData = extractCachedData(cached)

  if (cachedData !== null && cachedData !== undefined) {
    server.logger.info('Areas retrieved from cache')
    return cachedData
  }

  return null
}

async function fetchAndCache(cache, fetchFunction, _server) {
  const areasResponse = await fetchFunction()

  if (areasResponse.success) {
    // Store in cache for future requests
    await cache.set(CACHE_KEY, areasResponse.data)
    return areasResponse.data
  }

  return null
}

async function fetchFromApiDirectly(fetchFunction, server) {
  try {
    const areasResponse = await fetchFunction()
    return areasResponse?.success ? areasResponse.data : null
  } catch (fetchError) {
    server.logger.error(
      { error: fetchError.message },
      'Error fetching areas from API'
    )
    return null
  }
}

/**
 * Get areas from cache or fetch from API and cache it
 * @param {Object} server - Hapi server instance
 * @param {Function} fetchFunction - Function to fetch areas if not in cache
 * @returns {Promise<Object>} Areas data
 */
export async function getCachedAreas(server, fetchFunction) {
  const cache = getCacheInstance(server)

  // If cache is not available, just fetch from API
  if (!cache) {
    const areasResponse = await fetchFunction()
    return areasResponse.success ? areasResponse.data : null
  }

  try {
    // Try to get from cache first
    const cachedData = await getFromCache(cache, server)
    if (cachedData !== null) {
      return cachedData
    }

    // If not in cache, fetch from API
    return await fetchAndCache(cache, fetchFunction, server)
  } catch (error) {
    server.logger.error(
      {
        error: error.message,
        stack: error.stack,
        errorName: error.name
      },
      'Error accessing areas cache'
    )
    // If cache fails, try to fetch from API directly (but don't throw)
    return fetchFromApiDirectly(fetchFunction, server)
  }
}
