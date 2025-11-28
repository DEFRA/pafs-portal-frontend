import { config } from '../../../config/config.js'
import { statusCodes } from '../constants/status-codes.js'

const BASE_URL = config.get('backendApi.url')
const TIMEOUT = config.get('backendApi.timeout')
const MAX_RETRIES = config.get('backendApi.retries')
const RETRY_DELAY = config.get('backendApi.retryDelay')

const RETRYABLE_STATUS_CODES = new Set([
  statusCodes.networkError,
  statusCodes.tooManyRequests,
  statusCodes.internalServerError,
  statusCodes.badGateway,
  statusCodes.serviceUnavailable,
  statusCodes.gatewayTimeout
])

function isRetryable(error) {
  return error.name === 'AbortError' || error.name === 'TypeError'
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function shouldRetry(statusOrError, attempt, retries) {
  if (attempt >= retries) {
    return false
  }
  if (typeof statusOrError === 'number') {
    return RETRYABLE_STATUS_CODES.has(statusOrError)
  }
  return isRetryable(statusOrError)
}

async function parseResponseData(response) {
  const contentType = response.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return response.json()
  }
  return null
}

function buildErrorResponse(status, data) {
  const response = {
    success: false,
    status,
    validationErrors: data?.validationErrors || null,
    errors: data?.errors || null
  }

  if (!response.validationErrors && !response.errors) {
    response.errors = [{ errorCode: 'UNKNOWN_ERROR' }]
  }

  return response
}

function buildNetworkErrorResponse(error) {
  return {
    success: false,
    status: 0,
    errors: [{ errorCode: 'NETWORK_ERROR', message: error?.message }]
  }
}

async function executeRequest(url, options, controller) {
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  const data = await parseResponseData(response)

  if (response.ok) {
    return { success: true, status: response.status, data }
  }

  return buildErrorResponse(response.status, data)
}

async function attemptRequest(url, options) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    const result = await executeRequest(url, options, controller)
    clearTimeout(timeoutId)
    return { result, error: null }
  } catch (error) {
    clearTimeout(timeoutId)
    return { result: null, error }
  }
}

export async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const retries = options.retries ?? MAX_RETRIES
  let lastError = null
  let lastResponse = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    const { result, error } = await attemptRequest(url, options)

    if (error) {
      lastError = error
      if (!shouldRetry(error, attempt, retries)) {
        return buildNetworkErrorResponse(error)
      }
    } else if (result.success) {
      return result
    } else {
      lastResponse = result
      if (!shouldRetry(result.status, attempt, retries)) {
        return lastResponse
      }
    }

    await sleep(RETRY_DELAY * (attempt + 1))
  }

  return lastResponse || buildNetworkErrorResponse(lastError)
}
