import { buildRedisClient } from '../../../common/helpers/redis-client.js'
import { config } from '../../../../config/config.js'

/**
 * Check Redis connectivity by issuing a PING command.
 * Builds a short-lived client, pings, then disconnects.
 * @returns {Promise<{healthy: boolean, status: string, responseTime?: number, error?: string}>}
 */
export async function checkRedisHealth() {
  const client = buildRedisClient(config.get('redis'))

  try {
    const start = Date.now()
    const result = await client.ping()
    const responseTime = Date.now() - start

    return {
      healthy: result === 'PONG',
      status: result === 'PONG' ? 'connected' : 'unexpected_response',
      responseTime
    }
  } catch (error) {
    return {
      healthy: false,
      status: 'error',
      error: error.message
    }
  } finally {
    client.disconnect()
  }
}
