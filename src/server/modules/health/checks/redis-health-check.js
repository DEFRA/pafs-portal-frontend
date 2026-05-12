import { buildRedisClient } from '../../../common/helpers/redis-client.js'
import { config } from '../../../../config/config.js'

let _redisClient = null

function getRedisClient() {
  if (!_redisClient) {
    _redisClient = buildRedisClient(config.get('redis'))
  }
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
