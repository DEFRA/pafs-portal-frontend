import { vi } from 'vitest'

import hapi from '@hapi/hapi'
import { statusCodes } from '../constants/status-codes.js'

const mockCheckBackendHealth = vi.fn()

vi.mock('./backend-health-check/index.js', () => ({
  checkBackendHealth: () => mockCheckBackendHealth()
}))

describe('#startServer', () => {
  let createServerSpy
  let hapiServerSpy
  let startServerImport
  let createServerImport

  beforeAll(async () => {
    vi.stubEnv('PORT', '3097')
    vi.stubEnv('BACKEND_API_HEALTH_CHECK_ENABLED', 'true')

    createServerImport = await import('../../server.js')
    startServerImport = await import('./start-server.js')

    createServerSpy = vi.spyOn(createServerImport, 'createServer')
    hapiServerSpy = vi.spyOn(hapi, 'server')
  }, 10000)

  beforeEach(() => {
    mockCheckBackendHealth.mockReset()
    mockCheckBackendHealth.mockResolvedValue(true)
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  describe('When server starts', () => {
    let server

    afterAll(async () => {
      if (server) {
        await server.stop({ timeout: 0 })
      }
    }, 10000)

    test('Should start up server as expected', async () => {
      server = await startServerImport.startServer()

      expect(createServerSpy).toHaveBeenCalled()
      expect(hapiServerSpy).toHaveBeenCalled()
      expect(mockCheckBackendHealth).toHaveBeenCalled()

      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: '/health'
      })

      expect(result).toEqual({ message: 'success' })
      expect(statusCode).toBe(statusCodes.ok)
    }, 120000)

    test('Should disable HTTP timeouts', async () => {
      expect(server.listener.requestTimeout).toBe(0)
      expect(server.listener.headersTimeout).toBe(0)
      expect(server.listener.keepAliveTimeout).toBe(0)
    })

    test('Should continue when backend health check fails', async () => {
      mockCheckBackendHealth.mockResolvedValue(false)

      // Stop the previous server first to avoid port conflicts
      if (server) {
        await server.stop()
      }

      server = await startServerImport.startServer()

      expect(mockCheckBackendHealth).toHaveBeenCalled()
      expect(server).toBeDefined()
    }, 120000)
  })

  describe('When server start fails', () => {
    test('Should log failed startup message', async () => {
      createServerSpy.mockRejectedValueOnce(new Error('Server failed to start'))

      await expect(startServerImport.startServer()).rejects.toThrow(
        'Server failed to start'
      )

      // Restore the spy to its original implementation
      createServerSpy.mockRestore()
    })
  })
})
