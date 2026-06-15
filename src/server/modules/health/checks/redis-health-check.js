import { buildRedisClient } from '../../../common/helpers/redis-client.js'
import { config } from '../../../../config/config.js'

// Eagerly create the client so the TCP connection to Redis is established at
// module load time, not on the first health check. Without this, the first
// /health request on a cold or long-idle server blocks until the socket
// handshake completes, adding several hundred milliseconds to the response.
const _redisClient = buildRedisClient(config.get('redis'))

function getRedisClient() {
  return _redisClient
}

/**
 * Check Redis connectivity by issuing a PING command.
 * Reuses a shared client to avoid repeated connection events.
 * @returns {Promise<{healthy: boolean, status: string, responseTime?: number, error?: string}>}
 */
export async function checkRedisHealth() {
  const client = getRedisClient()

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
  }
}
