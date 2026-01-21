import { BaseCacheService } from '../../helpers/cache/base-cache-service.js'
import { CACHE_SEGMENTS } from '../../constants/common.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'

/**
 * Accounts cache service
 * Manages caching for both individual accounts and list metadata in a single segment
 */
export class AccountsCacheService extends BaseCacheService {
  /**
   * @param {Object} server - Hapi server instance
   */
  constructor(server) {
    super(server, CACHE_SEGMENTS.ACCOUNTS)
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
   * Generate cache key for list metadata
   * @param {Object} params - Query parameters
   * @returns {string} Cache key
   */
  generateListKey(params) {
    const defaultPageSize = getDefaultPageSize()
    const {
      status,
      search = '',
      areaId = '',
      page = 1,
      pageSize = defaultPageSize
    } = params
    return `list:${status}:${search}:${areaId}:${page}:${pageSize}`
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
   * Get multiple accounts by IDs from cache
   * Returns accounts that are cached, null for missing ones
   *
   * @param {Array<number|string>} ids - Array of account IDs
   * @returns {Promise<Array<Object|null>>} Array of accounts (null for cache misses)
   */
  async getAccountsByIds(ids) {
    if (!this.enabled || !ids || ids.length === 0) {
      return []
    }

    const promises = ids.map((id) => this.getAccount(id))
    return Promise.all(promises)
  }

  /**
   * Cache multiple accounts at once
   *
   * @param {Array<Object>} accounts - Array of account objects (must have id/userId field)
   * @returns {Promise<void>}
   */
  async setAccounts(accounts) {
    if (!this.enabled || !accounts || accounts.length === 0) {
      return
    }

    const promises = accounts.map((account) => {
      const id = account.id || account.userId
      return id ? this.setAccount(id, account) : Promise.resolve()
    })

    await Promise.all(promises)
  }

  /**
   * Cache list metadata with account IDs
   * @param {Object} params - Query parameters
   * @param {Array<number>} accountIds - Array of account IDs
   * @param {Object} pagination - Pagination metadata
   * @returns {Promise<void>}
   */
  async setListMetadata(params, accountIds, pagination) {
    if (!this.enabled) {
      return
    }

    const metadata = {
      accountIds,
      pagination,
      timestamp: Date.now()
    }

    const key = this.generateListKey(params)
    await this.setByKey(key, metadata)

    this.server.logger.debug(
      { segment: this.segment, key, accountCount: accountIds.length },
      'Cached list metadata'
    )
  }

  /**
   * Get list metadata from cache
   * @param {Object} params - Query parameters
   * @returns {Promise<Object|null>} List metadata or null
   */
  async getListMetadata(params) {
    const key = this.generateListKey(params)
    const metadata = await this.getByKey(key)

    if (metadata) {
      this.server.logger.debug(
        {
          segment: this.segment,
          key,
          accountCount: metadata.accountIds?.length
        },
        'List metadata cache hit'
      )
    } else {
      this.server.logger.debug(
        { segment: this.segment, key },
        'List metadata cache miss'
      )
    }

    return metadata
  }

  /**
   * Invalidate all accounts cache
   * Drops all known cache key patterns for accounts, lists, and counts
   * @returns {Promise<void>}
   */
  async invalidateAll() {
    if (!this.enabled) {
      return
    }

    try {
      const defaultPageSize = getDefaultPageSize()
      // Drop common list patterns for both statuses
      const statusList = ['pending', 'active']
      const listPromises = statusList.flatMap((status) => [
        // First page with default page size (most common)
        this.dropByKey(`list:${status}:::1:${defaultPageSize}`),
        // Count keys
        this.dropByKey(`count:${status}`)
      ])

      await Promise.all(listPromises)

      this.server.logger.info(
        { segment: this.segment },
        'Invalidated common accounts cache keys (lists and counts)'
      )
    } catch (error) {
      this.server.logger.warn(
        { error, segment: this.segment },
        'Failed to invalidate accounts cache'
      )
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
