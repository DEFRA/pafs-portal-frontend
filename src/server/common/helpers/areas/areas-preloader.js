import { createAreasService } from '../../services/areas/areas-service.js'

/**
 * Areas Preloader Plugin
 * Decorates the server with areas service and preloads areas on first request
 */
export const areasPreloader = {
  name: 'areas-preloader',
  version: '1.0.0',
  register: async (server, _options) => {
    // Create areas service instance
    const areasService = createAreasService(server)

    // Decorate server with areas service for easy access
    server.decorate('server', 'areasService', areasService)

    // Decorate request with helper to get areas
    server.decorate('request', 'getAreas', async function () {
      return this.server.areasService.getAreasByType()
    })

    // Track if areas have been preloaded
    let areasPreloaded = false

    // Hook into onPreHandler to preload areas on first request
    server.ext('onPreHandler', async (_request, h) => {
      if (!areasPreloaded) {
        try {
          server.logger.info('First request detected - preloading areas')
          await areasService.preloadAreas()
          areasPreloaded = true
        } catch (error) {
          server.logger.warn(
            {
              error: {
                message: error.message,
                stack: error.stack,
                name: error.name
              }
            },
            'Failed to preload areas on first request - will retry on next request'
          )
        }
      }
      return h.continue
    })

    server.logger.info('Areas preloader plugin registered')
  }
}
