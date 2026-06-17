import { vi } from 'vitest'
import { statusCodes } from '../../common/constants/status-codes.js'
import {
  healthController,
  healthDetailedController,
  performHealthChecks
} from './controller.js'

vi.mock('../../common/helpers/backend-health-check/index.js', () => ({
  pingBackendHealth: vi.fn()
}))

vi.mock('./checks/redis-health-check.js', () => ({
  checkRedisHealth: vi.fn()
}))

import { pingBackendHealth } from '../../common/helpers/backend-health-check/index.js'
import { checkRedisHealth } from './checks/redis-health-check.js'

const healthyRedis = { healthy: true, status: 'connected', responseTime: 2 }
const healthyBackend = { healthy: true, status: 'connected', responseTime: 10 }
const unhealthyRedis = {
  healthy: false,
  status: 'error',
  error: 'Connection refused'
}
const unhealthyBackend = {
  healthy: false,
  status: 'error',
  error: 'Request timeout'
}

describe('#performHealthChecks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should return healthy status when all checks pass', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    const result = await performHealthChecks()

    expect(result.status).toBe('healthy')
    expect(result.message).toBe('success')
    expect(result.checks.redis).toEqual(healthyRedis)
    expect(result.checks.backendApi).toEqual(healthyBackend)
    expect(result.uptime).toBeTypeOf('number')
    expect(result.timestamp).toBeTypeOf('string')
  })

  test('Should return unhealthy status when Redis check fails', async () => {
    checkRedisHealth.mockResolvedValue(unhealthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    const result = await performHealthChecks()

    expect(result.status).toBe('unhealthy')
    expect(result.message).toBe('one or more health checks failed')
    expect(result.checks.redis).toEqual(unhealthyRedis)
  })

  test('Should return unhealthy status when backend API check fails', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(unhealthyBackend)

    const result = await performHealthChecks()

    expect(result.status).toBe('unhealthy')
    expect(result.message).toBe('one or more health checks failed')
    expect(result.checks.backendApi).toEqual(unhealthyBackend)
  })

  test('Should return unhealthy status when both checks fail', async () => {
    checkRedisHealth.mockResolvedValue(unhealthyRedis)
    pingBackendHealth.mockResolvedValue(unhealthyBackend)

    const result = await performHealthChecks()

    expect(result.status).toBe('unhealthy')
  })

  test('Should run both checks in parallel', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    await performHealthChecks()

    expect(checkRedisHealth).toHaveBeenCalledTimes(1)
    expect(pingBackendHealth).toHaveBeenCalledTimes(1)
  })
})

describe('#healthController (/health)', () => {
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()
    mockH = {
      response: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }
  })

  test('Should return 200 and only status when all checks are healthy', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    await healthController.handler({}, mockH)

    expect(mockH.code).toHaveBeenCalledWith(statusCodes.ok)
    expect(mockH.response).toHaveBeenCalledWith({ status: 'healthy' })
  })

  test('Should return 503 and only status when Redis is unhealthy', async () => {
    checkRedisHealth.mockResolvedValue(unhealthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    await healthController.handler({}, mockH)

    expect(mockH.code).toHaveBeenCalledWith(statusCodes.serviceUnavailable)
    expect(mockH.response).toHaveBeenCalledWith({ status: 'unhealthy' })
  })

  test('Should return 503 and only status when backend API is unhealthy', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(unhealthyBackend)

    await healthController.handler({}, mockH)

    expect(mockH.code).toHaveBeenCalledWith(statusCodes.serviceUnavailable)
    expect(mockH.response).toHaveBeenCalledWith({ status: 'unhealthy' })
  })

  test('Should have auth disabled', () => {
    expect(healthController.options?.auth).toBe(false)
  })

  test('Should not include checks or uptime in response body', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    await healthController.handler({}, mockH)

    const body = mockH.response.mock.calls[0][0]
    expect(body).not.toHaveProperty('checks')
    expect(body).not.toHaveProperty('uptime')
    expect(body).not.toHaveProperty('timestamp')
  })
})

describe('#healthDetailedController (/health-detailed)', () => {
  let mockH

  beforeEach(() => {
    vi.clearAllMocks()
    mockH = {
      response: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis()
    }
  })

  test('Should return 200 with full details when all checks are healthy', async () => {
    checkRedisHealth.mockResolvedValue(healthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    await healthDetailedController.handler({}, mockH)

    expect(mockH.code).toHaveBeenCalledWith(statusCodes.ok)
    expect(mockH.response).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
        message: 'success',
        uptime: expect.any(Number),
        timestamp: expect.any(String),
        checks: { redis: healthyRedis, backendApi: healthyBackend }
      })
    )
  })

  test('Should return 503 with full details when a check fails', async () => {
    checkRedisHealth.mockResolvedValue(unhealthyRedis)
    pingBackendHealth.mockResolvedValue(healthyBackend)

    await healthDetailedController.handler({}, mockH)

    expect(mockH.code).toHaveBeenCalledWith(statusCodes.serviceUnavailable)
    expect(mockH.response).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'unhealthy',
        checks: { redis: unhealthyRedis, backendApi: healthyBackend }
      })
    )
  })

  test('Should not define auth options (auth is configured at route level)', () => {
    expect(healthDetailedController.options).toBeUndefined()
  })
})
