import { vi } from 'vitest'

import { Cluster, Redis } from 'ioredis'

import { config } from '../../../config/config.js'
import { buildRedisClient } from './redis-client.js'

const mockOn = vi.fn()

vi.mock('ioredis', () => ({
  ...vi.importActual('ioredis'),
  Cluster: vi.fn(function () {
    return { on: mockOn }
  }),
  Redis: vi.fn(function () {
    return { on: mockOn }
  })
}))

describe('#buildRedisClient', () => {
  describe('When Redis Single InstanceCache is requested', () => {
    let client

    beforeEach(() => {
      client = buildRedisClient(config.get('redis'))
    })

    test('Should instantiate a single Redis client', () => {
      expect(Redis).toHaveBeenCalledWith({
        db: 0,
        host: '127.0.0.1',
        keyPrefix: 'pafs-portal-frontend:',
        port: 6379
      })
    })

    test('Should return client instance', () => {
      expect(client).toBeDefined()
    })
  })

  describe('When a Redis Cluster is requested', () => {
    let client

    beforeEach(() => {
      client = buildRedisClient({
        ...config.get('redis'),
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'user',
        password: 'pass'
      })
    })

    test('Should instantiate a Redis Cluster client', () => {
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: '127.0.0.1', port: 6379 }],
        {
          dnsLookup: expect.any(Function),
          keyPrefix: 'pafs-portal-frontend:',
          redisOptions: { db: 0, password: 'pass', tls: {}, username: 'user' },
          slotsRefreshTimeout: 10000
        }
      )
    })

    test('Should return cluster instance', () => {
      expect(client).toBeDefined()
    })
  })

  describe('When Redis with custom config', () => {
    test('Should accept custom configuration', () => {
      Redis.mockClear()

      const customConfig = {
        host: 'custom-redis.example.com',
        port: 6380,
        db: 5,
        keyPrefix: 'custom-prefix:',
        useSingleInstanceCache: true
      }

      buildRedisClient(customConfig)

      expect(Redis).toHaveBeenCalled()
    })

    test('Should handle cluster configuration', () => {
      Cluster.mockClear()

      const clusterConfig = {
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        keyPrefix: 'test:',
        useSingleInstanceCache: false,
        useTLS: true,
        username: 'testuser',
        password: 'testpass'
      }

      buildRedisClient(clusterConfig)

      expect(Cluster).toHaveBeenCalled()
    })
  })

  describe('Event handlers', () => {
    beforeEach(() => {
      mockOn.mockClear()
    })

    test('Should register connect event handler', () => {
      buildRedisClient(config.get('redis'))

      expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function))
    })

    test('Should register error event handler', () => {
      buildRedisClient(config.get('redis'))

      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function))
    })

    test('Should handle connect event', () => {
      buildRedisClient(config.get('redis'))

      const connectHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'connect'
      )[1]

      expect(() => connectHandler()).not.toThrow()
    })

    test('Should handle error event', () => {
      buildRedisClient(config.get('redis'))

      const errorHandler = mockOn.mock.calls.find(
        (call) => call[0] === 'error'
      )[1]

      expect(() => errorHandler(new Error('Test error'))).not.toThrow()
    })
  })
})
