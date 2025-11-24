import { config } from '../../../config/config.js'

const baseUrl = config.get('backendApi.url')
const timeout = config.get('backendApi.timeout')

export async function apiRequest(path, options = {}) {
  const url = `${baseUrl}${path}`
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

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

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: data
      }
    }

    return {
      success: true,
      status: response.status,
      data
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}
