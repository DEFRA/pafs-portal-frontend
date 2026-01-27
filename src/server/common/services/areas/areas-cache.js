import { BaseCacheService } from '../../helpers/cache/base-cache-service.js'
import { AREA_SEGMENT_KEYS, CACHE_SEGMENTS } from '../../constants/common.js'

// Shared cache key registry across all instances since Catbox doesn't support wildcard deletion
// This needs to be at module level to persist across service instantiations
const cacheKeyRegistry = new Set()

export class AreasCacheService extends BaseCacheService {
  constructor(server) {
    // Set TTL to 0 for no expiration - areas rarely change
    super(server, CACHE_SEGMENTS.AREAS, 0)
    // Use the shared cache key registry
    this.cacheKeys = cacheKeyRegistry
  }

  generateKey(segmentKey) {
    return segmentKey
  }

  /**
   * Generate cache key for areas list with pagination parameters
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.type - Area type filter
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @returns {string} Cache key
   */
  generateListKey({ search = '', type = '', page = 1, pageSize = 10 }) {
    return `${AREA_SEGMENT_KEYS.BY_LIST}:search=${search}:type=${type}:page=${page}:pageSize=${pageSize}`
  }

  async getAreasByType() {
    const key = this.generateKey(AREA_SEGMENT_KEYS.BY_TYPE)
    return this.getByKey(key)
  }

  async setAreasByType(areasData, ttl = 0) {
    const key = this.generateKey(AREA_SEGMENT_KEYS.BY_TYPE)
    this.cacheKeys.add(key)
    return this.setByKey(key, areasData, ttl)
  }

  async invalidateAreasByType() {
    const key = this.generateKey(AREA_SEGMENT_KEYS.BY_TYPE)
    this.server.logger.info(
      { key, enabled: this.enabled },
      'Invalidating areas-by-type cache'
    )
    await this.dropByKey(key)
    this.server.logger.info(
      { key },
      'Successfully invalidated areas-by-type cache'
    )
  }

  /**
   * Get areas list from cache with pagination parameters
   * @param {Object} params - Query parameters
   * @returns {Promise<Object|null>} Cached areas list or null
   */
  async getAreasByList(params) {
    const key = this.generateListKey(params)
    return this.getByKey(key)
  }

  /**
   * Set areas list in cache with pagination parameters
   * @param {Object} params - Query parameters
   * @param {Object} data - Areas list data to cache
   * @param {number} ttl - Optional TTL override
   * @returns {Promise<void>}
   */
  async setAreasByList(params, data, ttl = 0) {
    const key = this.generateListKey(params)
    this.cacheKeys.add(key)
    return this.setByKey(key, data, ttl)
  }

  /**
   * Invalidate all areas-by-list cached entries
   * This drops all paginated list entries from cache
   * @returns {Promise<void>}
   */
  async invalidateAreasByList() {
    if (!this.enabled) {
      this.server.logger.debug(
        'Cache not enabled, skipping invalidateAreasByList'
      )
      return
    }

    this.server.logger.info('Invalidating all areas-by-list cache entries')
    await this._dropAllTrackedKeys()
    this.server.logger.info('Successfully invalidated areas-by-list cache')
  }

  /**
   * Generate cache key for individual area
   * @param {string} areaId - The area ID
   * @returns {string} Cache key in format 'area_{id}'
   */
  generateAreaKey(areaId) {
    return `${AREA_SEGMENT_KEYS.BY_ID}${areaId}`
  }

  /**
   * Get single area from cache by ID
   * Looks for area cached with key pattern 'area_{id}'
   * @param {string} areaId - The area ID to find
   * @returns {Promise<Object|null>} Area object or null
   */
  async getAreaFromCachedList(areaId) {
    if (!this.enabled || !areaId) {
      return null
    }

    const key = this.generateAreaKey(areaId)
    const cachedArea = await this.getByKey(key)

    if (cachedArea) {
      this.server.logger.debug({ areaId }, 'Area found in cache')
      return cachedArea
    }

    this.server.logger.debug({ areaId }, 'Area not found in cache')
    return null
  }

  /**
   * Set single area in cache by ID
   * Caches area with key pattern 'area_{id}'
   * @param {string} areaId - The area ID
   * @param {Object} areaData - Area data to cache
   * @param {number} ttl - Optional TTL override
   * @returns {Promise<void>}
   */
  async setAreaInCache(areaId, areaData, ttl = 0) {
    if (!this.enabled || !areaId) {
      return
    }

    const key = this.generateAreaKey(areaId)
    this.cacheKeys.add(key)
    await this.setByKey(key, areaData, ttl)
    this.server.logger.debug({ areaId }, 'Area cached successfully')
  }

  /**
   * Invalidate all individual area caches (area_{id})
   * Drops all cached individual area entries
   * @returns {Promise<void>}
   */
  async invalidateIndividualAreas() {
    if (!this.enabled) {
      this.server.logger.debug(
        'Cache not enabled, skipping invalidateIndividualAreas'
      )
      return
    }

    this.server.logger.info('Invalidating all individual area caches')
    await this._dropAllTrackedKeys()
    this.server.logger.info('Successfully invalidated individual area caches')
  }

  /**
   * Drop all tracked cache keys individually
   * Since Catbox doesn't support wildcard deletion, we track keys and delete them one by one
   * @returns {Promise<void>}
   * @private
   */
  async _dropAllTrackedKeys() {
    if (this.cacheKeys.size === 0) {
      this.server.logger.debug('No tracked cache keys to drop')
      return
    }

    this.server.logger.info(
      { keyCount: this.cacheKeys.size },
      'Dropping all tracked cache keys'
    )

    const dropPromises = []
    for (const key of this.cacheKeys) {
      dropPromises.push(this.dropByKey(key))
    }

    await Promise.all(dropPromises)

    // Clear the registry after dropping all keys
    this.cacheKeys.clear()

    this.server.logger.info(
      { droppedCount: dropPromises.length },
      'Successfully dropped all tracked cache keys'
    )
  }

  /**
   * Invalidate ALL areas-related caches
   * This includes:
   * - areas-by-type (all areas grouped by type)
   * - areas-by-list:* (all paginated lists with filters)
   * - area_{id} (all individual area entries)
   *
   * Call this after creating, updating, or deleting any area
   * to ensure all cached data is refreshed
   *
   * @returns {Promise<void>}
   */
  async invalidateAllAreasCache() {
    if (!this.enabled) {
      return
    }

    this.server.logger.info(
      { keyCount: this.cacheKeys.size },
      'Invalidating ALL areas cache entries (dropping tracked keys)'
    )

    try {
      // Drop all tracked keys individually since Catbox doesn't support wildcard deletion
      await this._dropAllTrackedKeys()

      this.server.logger.info(
        'Successfully invalidated all areas cache (all tracked keys dropped)'
      )
    } catch (error) {
      this.server.logger.error(
        { error },
        'Failed to invalidate all areas cache'
      )
      throw error
    }
  }
}

export function createAreasCacheService(server) {
  return new AreasCacheService(server)
}
