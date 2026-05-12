import { pingBackendHealth } from '../../common/helpers/backend-health-check/index.js'
import { statusCodes } from '../../common/constants/status-codes.js'
import { checkRedisHealth } from './checks/redis-health-check.js'

/**
 * Perform all health checks and return aggregated status.
 * @returns {Promise<{status: string, message: string, uptime: number, timestamp: string, checks: object}>}
 */
export async function performHealthChecks() {
  const [redisHealth, backendHealth] = await Promise.all([
    checkRedisHealth(),
    pingBackendHealth()
  ])

  const allHealthy = redisHealth.healthy && backendHealth.healthy

  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    message: allHealthy ? 'success' : 'one or more health checks failed',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    checks: {
      redis: redisHealth,
      backendApi: backendHealth
    }
  }
}

/**
 * GET /health — simple liveness/readiness probe.
 * Returns only status and HTTP status code. Used by the platform load balancer.
 */
export const healthController = {
  options: { auth: false },
  async handler(_request, h) {
    const { status } = await performHealthChecks()
    const statusCode =
      status === 'healthy' ? statusCodes.ok : statusCodes.serviceUnavailable
    return h.response({ status }).code(statusCode)
  }
}

/**
 * GET /health-detailed — full dependency check with per-service breakdown.
 * Includes Redis and backend API health, uptime, and timestamp.
 */
export const healthDetailedController = {
  options: { auth: false },
  async handler(_request, h) {
    const health = await performHealthChecks()
    const statusCode =
      health.status === 'healthy'
        ? statusCodes.ok
        : statusCodes.serviceUnavailable
    return h.response(health).code(statusCode)
  }
}
