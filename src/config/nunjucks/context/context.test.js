import { describe, test, expect, vi, beforeEach, beforeAll } from 'vitest'

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()

vi.mock('node:fs', async () => {
  const nodeFs = await import('node:fs')
  return {
    ...nodeFs,
    readFileSync: () => mockReadFileSync()
  }
})

vi.mock('../../../server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

vi.mock('../../../server/common/helpers/i18n/index.js', () => ({
  translate: (key) => key
}))

describe('Nunjucks context builder', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockLoggerError.mockReset()
    vi.resetModules()
  })

  describe('context function', () => {
    const createMockRequest = (overrides = {}) => ({
      path: '/',
      yar: {
        get: vi.fn(() => ({ user: { id: 1, email: 'test@example.com' } }))
      },
      ...overrides
    })

    describe('basic context structure', () => {
      let contextImport
      let result

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(() => {
        mockReadFileSync.mockReturnValue(
          JSON.stringify({
            'application.js': 'javascripts/application.js',
            'stylesheets/application.scss': 'stylesheets/application.css'
          })
        )

        result = contextImport.context(createMockRequest())
      })

      test('includes asset path configuration', () => {
        expect(result.assetPath).toBe('/public/assets')
      })

      test('includes service name from config', () => {
        expect(result.serviceName).toBe(
          'Submit a flood risk management proposal'
        )
      })

      test('includes service URL', () => {
        expect(result.serviceUrl).toBe('/')
      })

      test('includes empty breadcrumbs array', () => {
        expect(result.breadcrumbs).toEqual([])
      })

      test('includes navigation array', () => {
        expect(result.navigation).toBeInstanceOf(Array)
      })

      test('includes original request object', () => {
        const mockReq = createMockRequest()
        const ctx = contextImport.context(mockReq)
        expect(ctx.request).toBe(mockReq)
      })

      test('includes translation function', () => {
        expect(result.t).toBeTypeOf('function')
      })

      test('includes getAssetPath function', () => {
        expect(result.getAssetPath).toBeTypeOf('function')
      })
    })

    describe('user session handling', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(() => {
        mockReadFileSync.mockReturnValue('{}')
      })

      test('includes user when session exists', () => {
        const mockReq = createMockRequest()
        const result = contextImport.context(mockReq)

        expect(result.user).toEqual({ id: 1, email: 'test@example.com' })
      })

      test('user is undefined when no session', () => {
        const mockReq = {
          path: '/',
          yar: {
            get: vi.fn(() => null)
          }
        }
        const result = contextImport.context(mockReq)

        expect(result.user).toBeUndefined()
      })

      test('user is undefined when yar returns empty object', () => {
        const mockReq = {
          path: '/',
          yar: {
            get: vi.fn(() => ({}))
          }
        }
        const result = contextImport.context(mockReq)

        expect(result.user).toBeUndefined()
      })
    })

    describe('translation function', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(() => {
        mockReadFileSync.mockReturnValue('{}')
      })

      test('translation function works', () => {
        const result = contextImport.context(createMockRequest())
        expect(result.t('common.sign_in')).toBe('common.sign_in')
      })

      test('translation function accepts parameters', () => {
        const result = contextImport.context(createMockRequest())
        expect(result.t('some.key', { param: 'value' })).toBe('some.key')
      })
    })
  })

  describe('asset path resolution', () => {
    let contextImport
    let result

    beforeAll(async () => {
      contextImport = await import('./context.js')
    })

    describe('with valid webpack manifest', () => {
      beforeEach(() => {
        mockReadFileSync.mockReturnValue(
          JSON.stringify({
            'application.js': 'javascripts/application.abc123.js',
            'stylesheets/application.scss':
              'stylesheets/application.def456.css',
            'images/logo.png': 'images/logo.xyz789.png'
          })
        )

        result = contextImport.context({
          path: '/',
          yar: { get: vi.fn(() => null) }
        })
      })

      test('resolves JavaScript file with hash', () => {
        expect(result.getAssetPath('application.js')).toBe(
          '/public/javascripts/application.abc123.js'
        )
      })

      test('resolves CSS file with hash', () => {
        expect(result.getAssetPath('stylesheets/application.scss')).toBe(
          '/public/stylesheets/application.def456.css'
        )
      })

      test('resolves image file with hash', () => {
        expect(result.getAssetPath('images/logo.png')).toBe(
          '/public/images/logo.xyz789.png'
        )
      })

      test('returns original path for unmapped assets', () => {
        expect(result.getAssetPath('unknown-file.js')).toBe(
          '/public/unknown-file.js'
        )
      })

      test('handles paths with leading slash', () => {
        expect(result.getAssetPath('/application.js')).toBe(
          '/public//application.js'
        )
      })
    })

    describe('without webpack manifest', () => {
      beforeEach(async () => {
        // Reset modules to clear cached manifest
        vi.resetModules()
        mockLoggerError.mockClear()

        mockReadFileSync.mockImplementation(() => {
          throw new Error('ENOENT: no such file or directory')
        })

        // Re-import after reset
        const freshImport = await import('./context.js')
        result = freshImport.context({
          path: '/',
          yar: { get: vi.fn(() => null) }
        })
      })

      test('falls back to original asset path', () => {
        expect(result.getAssetPath('application.js')).toBe(
          '/public/application.js'
        )
      })

      test('logs error when manifest cannot be read', () => {
        expect(mockLoggerError).toHaveBeenCalledWith(
          expect.any(Error),
          'Webpack assets-manifest.json not found'
        )
      })
    })
  })

  describe('webpack manifest caching', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('./context.js')
    })

    beforeEach(() => {
      mockReadFileSync.mockReturnValue(
        JSON.stringify({
          'application.js': 'javascripts/application.js'
        })
      )
    })

    test('reads manifest file on first call', () => {
      contextImport.context({ path: '/', yar: { get: vi.fn(() => null) } })
      expect(mockReadFileSync).toHaveBeenCalledTimes(1)
    })

    test('uses cached manifest on subsequent calls', () => {
      mockReadFileSync.mockClear()

      contextImport.context({ path: '/', yar: { get: vi.fn(() => null) } })
      contextImport.context({ path: '/other', yar: { get: vi.fn(() => null) } })

      expect(mockReadFileSync).not.toHaveBeenCalled()
    })

    test('cached context has correct structure', () => {
      const result = contextImport.context({
        path: '/',
        yar: { get: vi.fn(() => ({ user: { id: 1 } })) }
      })

      expect(result).toMatchObject({
        assetPath: '/public/assets',
        breadcrumbs: [],
        serviceName: 'Submit a flood risk management proposal',
        serviceUrl: '/',
        user: { id: 1 }
      })
    })
  })

  describe('navigation integration', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('./context.js')
    })

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('{}')
    })

    test('includes navigation for authenticated user', () => {
      const result = contextImport.context({
        path: '/',
        yar: { get: vi.fn(() => ({ user: { id: 1 } })) }
      })

      expect(result.navigation).toBeInstanceOf(Array)
      expect(result.navigation.length).toBeGreaterThan(0)
    })

    test('navigation is empty for unauthenticated user', () => {
      const result = contextImport.context({
        path: '/',
        yar: { get: vi.fn(() => null) }
      })

      expect(result.navigation).toEqual([])
    })

    test('navigation reflects current path', () => {
      const result = contextImport.context({
        path: '/download',
        yar: { get: vi.fn(() => ({ user: { id: 1 } })) }
      })

      const downloadNav = result.navigation.find(
        (item) => item.href === '/download'
      )
      expect(downloadNav?.current).toBe(true)
    })
  })

  describe('edge cases', () => {
    let contextImport

    beforeAll(async () => {
      contextImport = await import('./context.js')
    })

    beforeEach(() => {
      mockReadFileSync.mockReturnValue('{}')
    })

    test('handles request without yar', () => {
      const result = contextImport.context({ path: '/' })
      expect(result.user).toBeUndefined()
      expect(result.navigation).toEqual([])
    })

    test('handles request without path', () => {
      const result = contextImport.context({
        yar: { get: vi.fn(() => ({ user: { id: 1 } })) }
      })

      expect(result).toBeDefined()
      expect(result.navigation).toBeInstanceOf(Array)
    })

    test('handles malformed webpack manifest', async () => {
      // Reset modules to clear cached manifest
      vi.resetModules()
      mockReadFileSync.mockReturnValue('not valid json')

      // Need to re-import after reset
      const contextModule = await import('./context.js')
      const result = contextModule.context({
        path: '/',
        yar: { get: vi.fn(() => null) }
      })

      expect(result.getAssetPath('test.js')).toBe('/public/test.js')
      expect(mockLoggerError).toHaveBeenCalled()
    })
  })
})
