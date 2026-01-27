import { createAreasCacheService } from './areas-cache.js'
import { apiRequest } from '../../helpers/api-client/index.js'
import { PAGINATION } from '../../constants/common.js'
import { getDefaultPageSize } from '../../helpers/pagination/index.js'

export class AreasService {
  constructor(server) {
    this.server = server
    this.logger = server.logger
    this.cacheService = createAreasCacheService(server)
  }

  async getAreasByType() {
    try {
      // Try to get from cache first
      this.logger.debug('Attempting to get areas from cache')
      const cachedAreas = await this.cacheService.getAreasByType()

      if (cachedAreas) {
        this.logger.info('Areas retrieved from cache')
        return cachedAreas
      }

      // Cache miss - fetch from API
      this.logger.info('Cache miss - fetching areas from backend API')
      const response = await apiRequest('/api/v1/areas-by-type', {
        method: 'GET'
      })

      if (!response.success || !response.data) {
        const errorMsg =
          response.errors?.[0]?.errorCode || 'Invalid response from areas API'
        throw new Error(errorMsg)
      }

      // Cache the areas data
      this.logger.info('Caching areas data')
      await this.cacheService.setAreasByType(response.data)
      this.logger.info('Areas cached successfully')

      return response.data
    } catch (error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          }
        },
        'Failed to fetch areas'
      )
      throw error
    }
  }

  /**
   * Get areas list with pagination and filters
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search term
   * @param {string} params.type - Area type filter
   * @param {number} params.page - Page number
   * @param {number} params.pageSize - Items per page
   * @param {string} params.accessToken - Access token for API authentication
   * @returns {Promise<Object>} Paginated areas list
   */
  async getAreasByList(params = {}) {
    try {
      const queryParams = {
        search: params.search || '',
        type: params.type || '',
        page: params.page || PAGINATION.DEFAULT_PAGE,
        pageSize: params.pageSize || getDefaultPageSize()
      }

      // Try to get from cache first
      this.logger.debug(
        { queryParams },
        'Attempting to get areas list from cache'
      )
      const cachedList = await this.cacheService.getAreasByList(queryParams)

      if (cachedList) {
        this.logger.info({ queryParams }, 'Areas list retrieved from cache')
        return cachedList
      }

      // Cache miss - fetch from API
      this.logger.info(
        { queryParams },
        'Cache miss - fetching areas list from backend API'
      )

      // Build query string
      const queryString = new URLSearchParams(queryParams).toString()
      const response = await apiRequest(
        `/api/v1/areas-by-list?${queryString}`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${params.accessToken}` }
        }
      )

      if (!response.success || !response.data) {
        const errorMsg =
          response.errors?.[0]?.errorCode ||
          'Invalid response from areas list API'
        throw new Error(errorMsg)
      }

      // Cache the areas list data
      this.logger.info({ queryParams }, 'Caching areas list data')
      await this.cacheService.setAreasByList(queryParams, response.data)
      this.logger.info('Areas list cached successfully')

      return response.data
    } catch (error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          params
        },
        'Failed to fetch areas list'
      )
      throw error
    }
  }

  /**
   * Get single area by ID from cache or API
   * First attempts to find in cached list, falls back to API
   * @param {string} areaId - The area ID
   * @param {string} accessToken - Access token for API authentication
   * @returns {Promise<Object|null>} Area object or null
   */
  async getAreaById(areaId, accessToken) {
    try {
      this.logger.debug({ areaId }, 'Attempting to get area by ID')

      // Try to get from cached list first
      const cachedArea = await this.cacheService.getAreaFromCachedList(areaId)

      if (cachedArea) {
        this.logger.info({ areaId }, 'Area retrieved from cache')
        return cachedArea
      }

      // Not in cache - fetch from API
      this.logger.info({ areaId }, 'Fetching area from backend API')
      const response = await apiRequest(`/api/v1/area-by-id/${areaId}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${accessToken}` }
      })

      if (!response.success || !response.data) {
        const errorMsg =
          response.errors?.[0]?.errorCode || 'Invalid response from area API'
        throw new Error(errorMsg)
      }

      // Cache the area data for future requests
      this.logger.debug({ areaId }, 'Caching individual area')
      await this.cacheService.setAreaInCache(areaId, response.data)

      return response.data
    } catch (error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          areaId
        },
        'Failed to fetch area by ID'
      )
      throw error
    }
  }

  /**
   * Create or update an area
   * @param {Object} params - Request parameters
   * @param {Object} params.data - Area data to upsert
   * @param {string} params.accessToken - Access token for API authentication
   * @returns {Promise<Object>} Upserted area data
   */
  async upsertArea({ data, accessToken }) {
    try {
      this.logger.info({ areaData: data }, 'Upserting area')

      const response = await apiRequest('/api/v1/areas/upsert', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(data)
      })

      if (!response.success || !response.data) {
        const errorMsg =
          response.errors?.[0]?.errorCode || 'Invalid response from upsert API'
        throw new Error(errorMsg)
      }

      this.logger.info('Area upserted successfully - invalidating cache')

      // Invalidate ALL areas cache after successful upsert
      // This ensures by-type, by-list, and by-id caches are all refreshed
      await this.cacheService.invalidateAllAreasCache()

      this.logger.info('Cache invalidated successfully')

      return response.data
    } catch (error) {
      this.logger.error(
        {
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          data
        },
        'Failed to upsert area'
      )
      throw error
    }
  }

  /**
   * Invalidate all areas list cache
   * Call this after creating or updating areas
   * @returns {Promise<void>}
   */
  async invalidateAreasListCache() {
    this.logger.info('Invalidating areas list cache')
    await this.cacheService.invalidateAreasByList()
  }

  /**
   * Refresh all areas cache
   * Invalidates ALL cached areas data (by-type, by-list, and individual areas)
   * Then fetches fresh areas-by-type data
   *
   * Call this after:
   * - Creating a new area
   * - Updating an existing area
   * - Deleting an area
   *
   * @returns {Promise<Object>} Fresh areas data grouped by type
   */
  async refreshAreas() {
    this.logger.info('Refreshing ALL areas cache - starting invalidation')

    // Invalidate all areas-related cache entries
    await this.cacheService.invalidateAllAreasCache()

    this.logger.info('Cache invalidated - fetching fresh data')

    // Fetch fresh data which will be cached
    const freshData = await this.getAreasByType()

    this.logger.info('Fresh areas data fetched and cached')

    return freshData
  }

  async preloadAreas() {
    try {
      this.logger.info('Preloading areas into cache')
      await this.getAreasByType()
      this.logger.info('Areas preloaded successfully')
    } catch (error) {
      this.logger.warn(
        { error },
        'Failed to preload areas - will retry on first request'
      )
    }
  }
}

export function createAreasService(server) {
  return new AreasService(server)
}
