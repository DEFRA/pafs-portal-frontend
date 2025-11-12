import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'
import { checkBackendHealth } from './backend-health-check.js'

async function startServer() {
  const server = await createServer()
  await server.start()

  // Disable Node.js HTTP request timeout to prevent debugger interference
  // In production, this is handled by load balancers and Hapi's route timeout
  if (server.listener) {
    server.listener.requestTimeout = 0
    server.listener.headersTimeout = 0
    server.listener.keepAliveTimeout = 0
  }

  server.logger.info('Server started successfully')
  server.logger.info(
    `Access your frontend on http://localhost:${config.get('port')}`
  )

  if (config.get('backendApi.healthCheckEnabled')) {
    const isBackendHealthy = await checkBackendHealth()

    if (!isBackendHealthy) {
      server.logger.warn(
        'Backend API health check failed - frontend will start but some features may not work'
      )
    }
  }

  return server
}

export { startServer }
