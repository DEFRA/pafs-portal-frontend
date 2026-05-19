import {
  describe,
  test,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi
} from 'vitest'
import {
  createServer,
  collectProductionCookieErrors,
  isScannerProbe
} from './server.js'
import { config } from '../config/config.js'

// ---------------------------------------------------------------------------
// createServer integration tests
// ---------------------------------------------------------------------------

describe('createServer', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('creates server with host and port from config', () => {
    expect(server.info.host).toBeDefined()
    expect(server.info.port).toBeDefined()
  })

  test('strips trailing slashes', () => {
    expect(server.settings.router.stripTrailingSlash).toBe(true)
  })

  test('strictHeader is disabled (tolerates legacy browser cookies)', () => {
    expect(server.settings.state.strictHeader).toBe(false)
  })

  describe('security headers', () => {
    test('HSTS maxAge is one year', () => {
      expect(server.settings.routes.security.hsts.maxAge).toBe(31536000)
    })

    test('HSTS includeSubDomains is enabled', () => {
      expect(server.settings.routes.security.hsts.includeSubDomains).toBe(true)
    })

    test('HSTS preload is disabled (not yet in preload list)', () => {
      expect(server.settings.routes.security.hsts.preload).toBe(false)
    })

    test('XSS protection is enabled', () => {
      expect(server.settings.routes.security.xss).toBe('enabled')
    })

    test('noSniff is enabled', () => {
      expect(server.settings.routes.security.noSniff).toBe(true)
    })

    test('xframe is enabled', () => {
      expect(server.settings.routes.security.xframe).toBe(true)
    })
  })

  describe('route validation options', () => {
    test('abortEarly is false (collects all errors)', () => {
      expect(server.settings.routes.validate.options.abortEarly).toBe(false)
    })

    test('allowUnknown is true (permits CSRF token in POST payloads)', () => {
      expect(server.settings.routes.validate.options.allowUnknown).toBe(true)
    })
  })

  describe('plugin registration', () => {
    test('registers hapi-pino for request logging', () => {
      const plugins = Object.keys(server.registrations)
      expect(plugins).toContain('hapi-pino')
    })

    test('registers crumb for CSRF protection', () => {
      const plugins = Object.keys(server.registrations)
      expect(plugins).toContain('@hapi/crumb')
    })

    test('registers scooter for user agent parsing', () => {
      const plugins = Object.keys(server.registrations)
      expect(plugins).toContain('@hapi/scooter')
    })

    test('registers blankie for CSP headers', () => {
      const plugins = Object.keys(server.registrations)
      expect(plugins).toContain('blankie')
    })

    test('registers more than five plugins', () => {
      expect(Object.keys(server.registrations).length).toBeGreaterThan(5)
    })
  })

  describe('routes', () => {
    test('health route is registered', () => {
      const route = server.lookup('health')
      expect(route).toBeDefined()
    })
  })

  describe('scanner probe filter — HTTP behaviour', () => {
    test.each([
      '/wp-login.php',
      '/phpmyadmin/index.php5',
      '/admin/upload.php7',
      '/admin/index.asp',
      '/admin/index.aspx',
      '/app/index.jsp',
      '/cgi-bin/test.cgi',
      '/scripts/test.pl',
      '/app/index.cfm',
      '/api/action.do',
      '/api/save.action',
      '/handler.ashx',
      '/page.shtml'
    ])('returns 404 for server-side script extension: %s', async (url) => {
      const { statusCode } = await server.inject({ method: 'GET', url })
      expect(statusCode).toBe(404)
    })

    test.each(['/.env', '/.git/config', '/.htaccess', '/.DS_Store'])(
      'returns 404 for dotfile probe: %s',
      async (url) => {
        const { statusCode } = await server.inject({ method: 'GET', url })
        expect(statusCode).toBe(404)
      }
    )

    test('scanner probe 404 bypasses the error page (empty response body)', async () => {
      const { result } = await server.inject({
        method: 'GET',
        url: '/wp-login.php'
      })
      expect(result).toBeFalsy()
    })
  })
})

// ---------------------------------------------------------------------------
// isScannerProbe unit tests — no server/HTTP needed, no timeout risk
// ---------------------------------------------------------------------------

describe('isScannerProbe', () => {
  describe('server-side script extensions — returns true', () => {
    test.each([
      '/wp-login.php',
      '/phpmyadmin/index.php5',
      '/admin/upload.php7',
      '/admin/index.asp',
      '/admin/index.aspx',
      '/app/index.jsp',
      '/cgi-bin/test.cgi',
      '/scripts/test.pl',
      '/app/index.cfm',
      '/api/action.do',
      '/api/save.action',
      '/handler.ashx',
      '/page.shtml'
    ])('%s', (path) => {
      expect(isScannerProbe(path)).toBe(true)
    })
  })

  describe('dotfile and traversal probes — returns true', () => {
    test.each(['/.env', '/.git/config', '/.htaccess', '/.DS_Store'])(
      '%s',
      (path) => {
        expect(isScannerProbe(path)).toBe(true)
      }
    )
  })

  describe('legitimate application paths — returns false', () => {
    test.each([
      '/health',
      '/login',
      '/projects',
      '/api/v1/projects',
      '/assets/govuk-frontend.min.js',
      '/'
    ])('%s', (path) => {
      expect(isScannerProbe(path)).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// collectProductionCookieErrors unit tests
// ---------------------------------------------------------------------------

describe('collectProductionCookieErrors', () => {
  const SECURE_PASSWORD = 'super-secure-cookie-password-that-is-long-enough-abc'
  const INSECURE_DEFAULT = 'the-password-must-be-at-least-32-characters-long'

  describe('non-production environment (isProduction = false)', () => {
    test('returns empty array regardless of cookie password value', () => {
      const errors = collectProductionCookieErrors(
        false,
        () => INSECURE_DEFAULT
      )
      expect(errors).toEqual([])
    })

    test('returns empty array when cookie password is empty', () => {
      const errors = collectProductionCookieErrors(false, () => '')
      expect(errors).toEqual([])
    })

    test('returns empty array when cookie password is null', () => {
      const errors = collectProductionCookieErrors(false, () => null)
      expect(errors).toEqual([])
    })
  })

  describe('production environment with valid config', () => {
    test('returns empty array when a strong password is set', () => {
      const errors = collectProductionCookieErrors(true, () => SECURE_PASSWORD)
      expect(errors).toEqual([])
    })
  })

  describe('production environment with insecure config', () => {
    test('reports error when cookie password equals the insecure default', () => {
      const errors = collectProductionCookieErrors(true, () => INSECURE_DEFAULT)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('SESSION_COOKIE_PASSWORD')
    })

    test('reports error when cookie password is empty string', () => {
      const errors = collectProductionCookieErrors(true, () => '')
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('SESSION_COOKIE_PASSWORD')
    })

    test('reports error when cookie password is null', () => {
      const errors = collectProductionCookieErrors(true, () => null)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('SESSION_COOKIE_PASSWORD')
    })

    test('reports error when cookie password is undefined', () => {
      const errors = collectProductionCookieErrors(true, () => undefined)
      expect(errors).toHaveLength(1)
      expect(errors[0]).toContain('SESSION_COOKIE_PASSWORD')
    })

    test('error message describes the required action clearly', () => {
      const errors = collectProductionCookieErrors(true, () => INSECURE_DEFAULT)
      expect(errors[0]).toContain('insecure default')
    })

    test('only returns the cookie password error (exactly one error)', () => {
      const errors = collectProductionCookieErrors(true, () => '')
      expect(errors).toHaveLength(1)
    })
  })
})

// ---------------------------------------------------------------------------
// validateProductionConfig — private but reachable via createServer
// Lines 39 & 42: the getConfigValue callback and the throw are only hit when
// isProduction is true and the cookie password has not been changed.
// ---------------------------------------------------------------------------

describe('validateProductionConfig', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('createServer rejects when production mode uses the insecure cookie default', async () => {
    const originalGet = config.get.bind(config)
    vi.spyOn(config, 'get').mockImplementation((key) => {
      if (key === 'isProduction') return true
      if (key === 'session.cookie.password') {
        return 'the-password-must-be-at-least-32-characters-long'
      }
      return originalGet(key)
    })

    await expect(createServer()).rejects.toThrow('Server startup aborted')
  })
})
