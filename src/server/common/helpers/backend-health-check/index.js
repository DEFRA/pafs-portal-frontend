import { config } from '../../../../config/config.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Perform a single health check attempt against the backend API.
 * Returns a structured result suitable for the frontend /health endpoint.
 * @returns {Promise<{healthy: boolean, status: string, responseTime?: number, error?: string}>}
 */
async function pingBackendHealth() {
  const backendUrl = config.get('backendApi.url')
  const timeout = config.get('backendApi.timeout')

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const start = Date.now()
    const response = await fetch(`${backendUrl}/health`, {
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    return {
      healthy: response.ok,
      status: response.ok ? 'connected' : 'unhealthy',
      responseTime: Date.now() - start
    }
  } catch (error) {
    clearTimeout(timeoutId)
    const errorMessage =
      error.name === 'AbortError' ? 'Request timeout' : error.message
    return {
      healthy: false,
      status: 'error',
      error: errorMessage
    }
  }
}

/**
 * Check backend API health with retries. Used at server startup to wait for
 * the backend to become ready.
 * @returns {Promise<boolean>}
 */
async function checkBackendHealth() {
  const retries = config.get('backendApi.healthCheckRetries')
  const interval = config.get('backendApi.healthCheckInterval')
  const backendUrl = config.get('backendApi.url')

  logger.info(`Checking backend API health at ${backendUrl}/health`)

  for (let attempt = 1; attempt <= retries; attempt++) {
    const result = await pingBackendHealth()

    if (result.healthy) {
      logger.info('Backend API is healthy and ready')
      return true
    }

    logger.warn(
      `Backend API health check failed (attempt ${attempt}/${retries}): ${result.error ?? result.status}`
    )

    if (attempt < retries) {
      logger.info(`Retrying in ${interval}ms...`)
      await sleep(interval)
    }
  }

  return false
}

export { checkBackendHealth, pingBackendHealth }
