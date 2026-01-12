import { BaseCacheService } from '../../helpers/cache/base-cache-service.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'

/**
 * Accounts cache service
 * Provides caching layer for account data to reduce API calls
 */
export class AccountsCacheService extends BaseCacheService {
  /**
   * @param {Object} server - Hapi server instance
   */
  constructor(server) {
    super(server, CACHE_SEGMENTS.ACCOUNTS)
  }

  /**
   * Generate cache key for accounts query
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   */
  generateKey(params) {
    const { status, search = '', areaId = '', page = 1 } = params
    return `${status}:${search}:${areaId}:${page}`
  }

  /**
   * Generate cache key for a single account
   * @param {number|string} id - Account ID
   * @returns {string} Cache key
   */
  generateAccountKey(id) {
    return `account:${id}`
  }

  /**
   * Get a single cached account by ID
   *
   * @param {number|string} id - Account ID
   * @returns {Promise<Object|null>} Cached account or null
   */
  async getAccount(id) {
    const key = this.generateAccountKey(id)
    return this.getByKey(key)
  }

  /**
   * Cache a single account
   *
   * @param {number|string} id - Account ID
   * @param {Object} account - Account data
   * @returns {Promise<void>}
   */
  async setAccount(id, account) {
    const key = this.generateAccountKey(id)
    return this.setByKey(key, account)
  }

  /**
   * Invalidate a single account cache
   *
   * @param {number|string} id - Account ID
   * @returns {Promise<void>}
   */
  async invalidateAccount(id) {
    const key = this.generateAccountKey(id)
    await this.dropByKey(key)
    // Also invalidate list caches as the account may appear in lists
    await this.invalidateAll()
  }

  /**
   * Invalidate cache for a specific status
   * Call this when accounts of a specific status have changed
   *
   * @param {string} status - Account status ('pending' or 'active')
   * @returns {Promise<void>}
   */
  async invalidateByStatus(_status) {
    if (!this.enabled) {
      return
    }

    await this.invalidateAll()
  }

  /**
   * Add account to existing cached list (if cached)
   * This is a best-effort operation - if cache miss, no action taken
   *
   * @param {Object} account - Account data to add
   * @param {Object} listParams - List query parameters
   * @returns {Promise<void>}
   */
  async addToList(account, _listParams) {
    // For list operations, it's safer to invalidate the cache
    // Adding to list would require complex pagination recalculation
    await this.invalidateByStatus(account.status)
  }

  /**
   * Remove account from existing cached list
   *
   * @param {number|string} accountId - Account ID to remove
   * @param {string} status - Account status
   * @returns {Promise<void>}
   */
  async removeFromList(accountId, status) {
    // For list operations, it's safer to invalidate the cache
    await this.invalidateByStatus(status)
    await this.dropByKey(this.generateAccountKey(accountId))
  }

  /**
   * Update account in cache
   * Invalidates both the single account and affected lists
   *
   * @param {number|string} id - Account ID
   * @param {Object} account - Updated account data
   * @param {string} [previousStatus] - Previous status if changed
   * @returns {Promise<void>}
   */
  async updateAccount(id, account, previousStatus) {
    await this.setAccount(id, account)

    // Invalidate list caches
    await this.invalidateByStatus(account.status)

    // If status changed, invalidate the previous status list too
    if (previousStatus && previousStatus !== account.status) {
      await this.invalidateByStatus(previousStatus)
    }
  }
}

/**
 * Create accounts cache service instance
 *
 * @param {Object} server - Hapi server instance
 * @returns {AccountsCacheService}
 */
export function createAccountsCacheService(server) {
  return new AccountsCacheService(server)
}
