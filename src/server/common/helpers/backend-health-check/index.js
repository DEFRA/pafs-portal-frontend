import { config } from '../../../../config/config.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function checkBackendHealth() {
  const backendUrl = config.get('backendApi.url')
  const timeout = config.get('backendApi.timeout')
  const retries = config.get('backendApi.healthCheckRetries')
  const interval = config.get('backendApi.healthCheckInterval')

  logger.info(`Checking backend API health at ${backendUrl}/health`)

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      const response = await fetch(`${backendUrl}/health`, {
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        logger.info('Backend API is healthy and ready')
        return true
      }

      logger.warn(
        `Backend API health check failed (attempt ${attempt}/${retries}): HTTP ${response.status}`
      )
    } catch (error) {
      const errorMessage =
        error.name === 'AbortError'
          ? 'Request timeout'
          : error.message || 'Unknown error'

      logger.warn(
        `Backend API health check failed (attempt ${attempt}/${retries}): ${errorMessage}`
      )
    }

    if (attempt < retries) {
      logger.info(`Retrying in ${interval}ms...`)
      await sleep(interval)
    }
  }

  return false
}

export { checkBackendHealth }
