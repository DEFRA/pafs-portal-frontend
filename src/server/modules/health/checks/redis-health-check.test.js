import { vi, describe, test, expect, beforeEach } from 'vitest'

const mockPing = vi.fn()
const mockDisconnect = vi.fn()

vi.mock('../../../common/helpers/redis-client.js', () => ({
  buildRedisClient: vi.fn(() => ({
    ping: mockPing,
    disconnect: mockDisconnect,
    on: vi.fn()
  }))
}))

vi.mock('../../../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      const values = {
        redis: {
          host: '127.0.0.1',
          keyPrefix: 'pafs-portal-frontend:',
          useSingleInstanceCache: true
        }
      }
      return values[key]
    })
  }
}))

import { checkRedisHealth } from './redis-health-check.js'

describe('#checkRedisHealth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('Should return healthy when Redis responds with PONG', async () => {
    mockPing.mockResolvedValue('PONG')

    const result = await checkRedisHealth()

    expect(result.healthy).toBe(true)
    expect(result.status).toBe('connected')
    expect(result.responseTime).toBeTypeOf('number')
  })

  test('Should return unhealthy when Redis responds unexpectedly', async () => {
    mockPing.mockResolvedValue('UNEXPECTED')

    const result = await checkRedisHealth()

    expect(result.healthy).toBe(false)
    expect(result.status).toBe('unexpected_response')
  })

  test('Should return unhealthy when Redis throws an error', async () => {
    mockPing.mockRejectedValue(new Error('Connection refused'))

    const result = await checkRedisHealth()

    expect(result.healthy).toBe(false)
    expect(result.status).toBe('error')
    expect(result.error).toBe('Connection refused')
  })

  test('Should always disconnect the client', async () => {
    mockPing.mockResolvedValue('PONG')

    await checkRedisHealth()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  test('Should disconnect even when ping throws', async () => {
    mockPing.mockRejectedValue(new Error('timeout'))

    await checkRedisHealth()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })
})
