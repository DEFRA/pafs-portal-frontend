import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadModules } from './index.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('loadModules', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      register: vi.fn(),
      logger: {
        warn: vi.fn()
      }
    }
  })

  describe('successful module loading', () => {
    it('loads and registers a single module', async () => {
      const basePath = join(__dirname, '../../../modules')
      const patterns = ['health']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            plugin: expect.any(Object)
          })
        ])
      )
    })

    it('loads and registers multiple modules from same directory', async () => {
      const basePath = join(__dirname, '../../../modules/general')
      const patterns = ['home', 'download', 'archive']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object)
        ])
      )
    })

    it('loads modules from nested directories', async () => {
      const basePath = join(__dirname, '../../../modules/admin')
      const patterns = ['users', 'users/pending', 'users/active']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object)
        ])
      )
    })

    it('loads auth modules', async () => {
      const basePath = join(__dirname, '../../../modules/auth')
      const patterns = ['login', 'logout', 'forgot-password']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object)
        ])
      )
    })
  })

  describe('error handling', () => {
    it('logs warning when module file does not exist', async () => {
      const basePath = join(__dirname, '../../../modules')
      const patterns = ['non-existent-module']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('non-existent-module'),
          error: expect.any(String)
        }),
        'Failed to load module'
      )
      expect(mockServer.register).not.toHaveBeenCalled()
    })

    it('continues loading other modules when one fails', async () => {
      const basePath = join(__dirname, '../../../modules/general')
      const patterns = ['home', 'non-existent', 'download']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.logger.warn).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([expect.any(Object), expect.any(Object)])
      )
    })

    it('does not call register when all modules fail to load', async () => {
      const basePath = join(__dirname, '../../../modules')
      const patterns = ['non-existent-1', 'non-existent-2']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.logger.warn).toHaveBeenCalledTimes(2)
      expect(mockServer.register).not.toHaveBeenCalled()
    })

    it('handles empty patterns array', async () => {
      const basePath = join(__dirname, '../../../modules')
      const patterns = []

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).not.toHaveBeenCalled()
      expect(mockServer.logger.warn).not.toHaveBeenCalled()
    })
  })

  describe('module validation', () => {
    it('loads modules that export plugins correctly', async () => {
      const basePath = join(__dirname, '../../../modules')
      const patterns = ['health']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            plugin: expect.objectContaining({
              name: expect.any(String),
              register: expect.any(Function)
            })
          })
        ])
      )
    })

    it('extracts first exported value from module', async () => {
      const basePath = join(__dirname, '../../../modules/auth')
      const patterns = ['login']

      await loadModules(mockServer, basePath, patterns)

      const registerCall = mockServer.register.mock.calls[0][0]
      expect(registerCall).toHaveLength(1)
      expect(registerCall[0]).toHaveProperty('plugin')
      expect(registerCall[0].plugin).toHaveProperty('name')
      expect(registerCall[0].plugin).toHaveProperty('register')
    })

    it('logs warning when module does not export a plugin', async () => {
      const basePath = join(__dirname, 'test-fixtures')
      const patterns = ['empty-module']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining('empty-module')
        }),
        'Module does not export a plugin'
      )
      expect(mockServer.register).not.toHaveBeenCalled()
    })
  })

  describe('path handling', () => {
    it('handles absolute paths', async () => {
      const basePath = join(__dirname, '../../../modules/general')
      const patterns = ['home']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
    })

    it('handles relative nested paths', async () => {
      const basePath = join(__dirname, '../../../modules/admin')
      const patterns = ['users/pending']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
    })

    it('normalizes path separators', async () => {
      const basePath = join(__dirname, '../../../modules/admin')
      const patterns = ['users/active'] // forward slash

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
    })
  })

  describe('batch registration', () => {
    it('registers all successful modules in a single call', async () => {
      const basePath = join(__dirname, '../../../modules/auth')
      const patterns = [
        'login',
        'logout',
        'forgot-password',
        'reset-password',
        'set-password'
      ]

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
      expect(mockServer.register).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
          expect.any(Object),
          expect.any(Object)
        ])
      )
    })

    it('only registers successfully loaded modules', async () => {
      const basePath = join(__dirname, '../../../modules/general')
      const patterns = ['home', 'invalid-module', 'download']

      await loadModules(mockServer, basePath, patterns)

      expect(mockServer.register).toHaveBeenCalledTimes(1)
      const registeredModules = mockServer.register.mock.calls[0][0]
      expect(registeredModules).toHaveLength(2) // Only home and download
    })
  })
})
