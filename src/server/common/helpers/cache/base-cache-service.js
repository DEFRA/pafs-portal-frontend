import { createLogger } from '../logging/logger.js'
import { config } from '../../../../config/config.js'

const logger = createLogger()

/**
 * Base cache service class
 * Provides common caching functionality that can be extended by specific cache services
 */
export class BaseCacheService {
  /**
   * @param {Object} server - Hapi server instance
   * @param {string} segment - Cache segment name
   * @param {number} [ttl] - Cache TTL in milliseconds (default: from config)
   */
  constructor(server, segment, ttl) {
    this.server = server
    this.segment = segment
    this.ttl = ttl || config.get('session.cache.ttl')
    this.enabled = this.isCacheEnabled()
    this._cache = null
  }

  /**
   * Check if caching is enabled (Redis in production)
   * @returns {boolean}
   */
  isCacheEnabled() {
    return config.get('session.cache.engine') === 'redis'
  }

  /**
   * Get cache instance
   * @returns {Object} Cache instance
   */
  getCache() {
    if (!this._cache) {
      const cacheConfig = {
        cache: config.get('session.cache.name'),
        segment: this.segment
      }

      // Only add expiresIn if TTL is greater than 0
      if (this.ttl > 0) {
        cacheConfig.expiresIn = this.ttl
      }

      this._cache = this.server.cache(cacheConfig)
      logger.debug(
        { segment: this.segment, ttl: this.ttl },
        'Cache instance created'
      )
    }
    return this._cache
  }

  /**
   * Generate cache key - override in subclass
   * @param {Object} params - Parameters to generate key from
   * @returns {string} Cache key
   */
  generateKey(params) {
    return JSON.stringify(params)
  }

  /**
   * Get cached data by key
   *
   * @param {string} key - Cache key
   * @returns {Promise<Object|null>} Cached data or null
   */
  async getByKey(key) {
    if (!this.enabled) {
      return null
    }

    try {
      const cache = this.getCache()
      const cached = await cache.get(key)

      if (cached) {
        logger.debug({ segment: this.segment, key }, 'Cache hit')
        return cached
      }

      logger.debug({ segment: this.segment, key }, 'Cache miss')
      return null
    } catch (error) {
      logger.warn({ error, segment: this.segment }, 'Failed to get from cache')
      return null
    }
  }

  /**
   * Get cached data by parameters
   *
   * @param {Object} params - Parameters to generate key from
   * @returns {Promise<Object|null>} Cached data or null
   */
  async get(params) {
    const key = this.generateKey(params)
    return this.getByKey(key)
  }

  /**
   * Set data in cache by key
   *
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   * @param {number} [ttl] - Optional TTL override
   * @returns {Promise<void>}
   */
  async setByKey(key, data, ttl = this.ttl) {
    if (!this.enabled) {
      return
    }

    try {
      const cache = this.getCache()
      await cache.set(key, data, ttl)
      logger.debug({ segment: this.segment, key }, 'Cached data')
    } catch (error) {
      logger.warn({ error, segment: this.segment }, 'Failed to set cache')
    }
  }

  /**
   * Set data in cache by parameters
   *
   * @param {Object} params - Parameters to generate key from
   * @param {Object} data - Data to cache
   * @param {number} [ttl] - Optional TTL override
   * @returns {Promise<void>}
   */
  async set(params, data, ttl) {
    const key = this.generateKey(params)
    return this.setByKey(key, data, ttl)
  }

  /**
   * Drop cached data by key
   *
   * @param {string} key - Cache key
   * @returns {Promise<void>}
   */
  async dropByKey(key) {
    if (!this.enabled) {
      return
    }

    try {
      const cache = this.getCache()
      await cache.drop(key)
      logger.debug({ segment: this.segment, key }, 'Dropped cache key')
    } catch (error) {
      logger.warn({ error, segment: this.segment }, 'Failed to drop cache key')
    }
  }

  /**
   * Drop cached data by parameters
   *
   * @param {Object} params - Parameters to generate key from
   * @returns {Promise<void>}
   */
  async drop(params) {
    const key = this.generateKey(params)
    return this.dropByKey(key)
  }

  /**
   * Invalidate all cached data for this segment
   *
   * @returns {Promise<void>}
   */
  async invalidateAll() {
    if (!this.enabled) {
      return
    }

    try {
      const cache = this.getCache()
      await cache.drop('*')
      logger.info({ segment: this.segment }, 'Invalidated all cache')
    } catch (error) {
      logger.warn(
        { error, segment: this.segment },
        'Failed to invalidate cache'
      )
    }
  }
}
