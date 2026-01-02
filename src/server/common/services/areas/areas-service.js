import { createAreasCacheService } from './areas-cache.js'
import { apiRequest } from '../../helpers/api-client/index.js'

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

  async refreshAreas() {
    this.logger.info('Refreshing areas cache')

    // Invalidate existing cache
    await this.cacheService.invalidateAreas()

    // Fetch fresh data
    return this.getAreasByType()
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
