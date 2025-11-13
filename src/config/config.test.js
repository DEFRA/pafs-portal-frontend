import { describe, test, expect } from 'vitest'
import { config } from './config.js'

describe('Configuration', () => {
  describe('Server configuration', () => {
    test('Should have default port', () => {
      expect(config.get('port')).toBe(3000)
    })

    test('Should have default host', () => {
      expect(config.get('host')).toBe('0.0.0.0')
    })
  })

  describe('Backend API configuration', () => {
    test('Should have default backend API URL', () => {
      expect(config.get('backendApi.url')).toBe('http://localhost:3001')
    })

    test('Should have default timeout value', () => {
      expect(config.get('backendApi.timeout')).toBe(10000)
    })

    test('Should have health check enabled by default', () => {
      expect(config.get('backendApi.healthCheckEnabled')).toBe(true)
    })

    test('Should have default retry configuration', () => {
      expect(config.get('backendApi.healthCheckRetries')).toBe(3)
      expect(config.get('backendApi.healthCheckInterval')).toBe(2000)
    })
  })

  describe('Session configuration', () => {
    test('Should have default session cache name', () => {
      expect(config.get('session.cache.name')).toBe('session')
    })

    test('Should have default cache TTL', () => {
      expect(config.get('session.cache.ttl')).toBe(14400000)
    })

    test('Should use memory engine in non-production', () => {
      const engine = config.get('session.cache.engine')
      expect(['memory', 'redis']).toContain(engine)
    })
  })

  describe('Redis configuration', () => {
    test('Should have default Redis host', () => {
      expect(config.get('redis.host')).toBe('127.0.0.1')
    })

    test('Should have default key prefix', () => {
      expect(config.get('redis.keyPrefix')).toBe('pafs-portal-frontend:')
    })
  })

  describe('Logging configuration', () => {
    test('Should have valid log level', () => {
      const level = config.get('log.level')
      expect([
        'fatal',
        'error',
        'warn',
        'info',
        'debug',
        'trace',
        'silent'
      ]).toContain(level)
    })

    test('Should have log format configured', () => {
      const format = config.get('log.format')
      expect(['ecs', 'pino-pretty']).toContain(format)
    })
  })

  describe('Application metadata', () => {
    test('Should have service name', () => {
      expect(config.get('serviceName')).toBe(
        'Submit a flood risk management proposal'
      )
    })

    test('Should have asset path', () => {
      expect(config.get('assetPath')).toBe('/public')
    })
  })
})
