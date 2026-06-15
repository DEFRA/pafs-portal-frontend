import { createServer } from '../../server.js'
import { config } from '../../../config/config.js'
import { checkBackendHealth } from './backend-health-check/index.js'

async function startServer() {
  const server = await createServer()
  await server.start()

  // Set keep-alive timeout slightly above the AWS ALB default (60s) so the
  // load balancer always closes idle connections before Node does. Setting it
  // to 0 causes a TCP RST race: the LB sends a request on an idle connection
  // at the same moment Node closes it, forcing a retry and intermittent
  // latency on health-check probes when the server is idle.
  // headersTimeout must be greater than keepAliveTimeout per Node.js docs.
  if (server.listener) {
    server.listener.requestTimeout = 0
    server.listener.keepAliveTimeout = 65_000
    server.listener.headersTimeout = 66_000
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
