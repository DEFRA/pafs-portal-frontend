import { config } from '../../../config/config.js'
import { statusCodes } from '../constants/status-codes.js'

const BASE_URL = config.get('backendApi.url')
const TIMEOUT = config.get('backendApi.timeout')
const MAX_RETRIES = config.get('backendApi.retries')
const RETRY_DELAY = config.get('backendApi.retryDelay')

const RETRYABLE_STATUS_CODES = [
  statusCodes.networkError,
  statusCodes.tooManyRequests,
  statusCodes.internalServerError,
  statusCodes.badGateway,
  statusCodes.serviceUnavailable,
  statusCodes.gatewayTimeout
]

function isRetryable(error) {
  return error.name === 'AbortError' || error.name === 'TypeError'
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const retries = options.retries ?? MAX_RETRIES
  let lastError = null
  let lastResponse = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      })
      clearTimeout(timeoutId)

      const contentType = response.headers.get('content-type')
      let data = null
      if (contentType?.includes('application/json')) {
        data = await response.json()
      }

      if (response.ok) {
        return { success: true, status: response.status, data }
      }

      // Return both validation errors and general errors from backend
      lastResponse = {
        success: false,
        status: response.status,
        validationErrors: data?.validationErrors || null,
        errors: data?.errors || null
      }

      // If neither present, add unknown error
      if (!lastResponse.validationErrors && !lastResponse.errors) {
        lastResponse.errors = [{ errorCode: 'UNKNOWN_ERROR' }]
      }

      if (
        RETRYABLE_STATUS_CODES.includes(response.status) &&
        attempt < retries
      ) {
        await sleep(RETRY_DELAY * (attempt + 1))
        continue
      }

      return lastResponse
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error

      if (isRetryable(error) && attempt < retries) {
        await sleep(RETRY_DELAY * (attempt + 1))
        continue
      }

      return {
        success: false,
        status: 0,
        errors: [{ errorCode: 'NETWORK_ERROR', message: error.message }]
      }
    }
  }

  return (
    lastResponse || {
      success: false,
      status: 0,
      errors: [{ errorCode: 'NETWORK_ERROR', message: lastError?.message }]
    }
  )
}
