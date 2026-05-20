import path from 'node:path'
import hapi from '@hapi/hapi'
import Crumb from '@hapi/crumb'
import Scooter from '@hapi/scooter'

import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { noCacheHeaders } from './common/helpers/no-cache-headers.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { registerCookieStates } from './common/helpers/cookie-config.js'
import { secureContext } from '@defra/hapi-secure-context'
import { contentSecurityPolicy } from './common/helpers/content-security-policy.js'
import { i18nPlugin } from './common/helpers/i18n/index.js'
import { areasPreloader } from './common/helpers/areas/areas-preloader.js'
import { metrics } from '@defra/cdp-metrics'
import { statusCodes } from './common/constants/status-codes.js'

const INSECURE_COOKIE_DEFAULT =
  'the-password-must-be-at-least-32-characters-long'

// Matches paths a Node.js app would never serve — short-circuits before the
// request logger so scanner noise never reaches logs or Grafana metrics.
const SCRIPT_EXTENSION_PATTERN =
  /\.(php\d?|aspx?|jsp|cgi|pl|cfm|do|action|ashx|shtml)([?#]|$)/i
const PATH_PROBE_PATTERN = /(?:^\/\.)|(?:\.\.[\\/])/

export function collectProductionCookieErrors(isProduction, getConfigValue) {
  if (!isProduction) {
    return []
  }
  const cookiePassword = getConfigValue('session.cookie.password')
  if (!cookiePassword || cookiePassword === INSECURE_COOKIE_DEFAULT) {
    return [
      'SESSION_COOKIE_PASSWORD must be changed from the insecure default value in production'
    ]
  }
  return []
}

function validateProductionConfig() {
  const errors = collectProductionCookieErrors(
    config.get('isProduction'),
    (key) => config.get(key)
  )
  if (errors.length > 0) {
    throw new Error(`Server startup aborted — ${errors.join(', ')}`)
  }
}

function buildServerConfig() {
  return {
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false,
          allowUnknown: true // permits 'crumb' CSRF token field in all POST payloads
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  }
}

// Drop scanner probe requests before the logger sees them so they never
// appear in logs or inflate Grafana 4xx metrics.
export function isScannerProbe(pathway) {
  return (
    SCRIPT_EXTENSION_PATTERN.test(pathway) || PATH_PROBE_PATTERN.test(pathway)
  )
}

// This is a server-side rendered GOV.UK frontend: only GET (page loads) and
// POST (form submissions) are legitimate.  Any other HTTP method is scanner
// noise and should be silently dropped.  We return 404 rather than 405 to
// avoid leaking which routes exist.
export const ALLOWED_METHODS = new Set(['get', 'post'])

function registerScannerProbeFilter(server) {
  // onRequest: short-circuit scanner probe patterns (PHP/ASP/dotfile etc.)
  // and unsupported HTTP methods before route matching.
  server.ext('onRequest', (request, h) => {
    if (!ALLOWED_METHODS.has(request.method) || isScannerProbe(request.path)) {
      request.app.silentDrop = true
      return h.response().code(statusCodes.notFound).takeover()
    }
    return h.continue
  })

  // onPreResponse: suppress logging for requests that fell through to the
  // catch-all /{p*} route.  That route handles all unregistered paths, so
  // any hit on it is bot/noise traffic rather than a genuine application error.
  // Genuine 4xx from real registered routes (validation errors, auth failures,
  // etc.) are NOT affected — their route path is specific, not '/{p*}'.
  server.ext('onPreResponse', (request, h) => {
    if (request.route?.path === '/{p*}') {
      request.app.silentDrop = true
    }
    return h.continue
  })
}

async function registerPlugins(server) {
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache, // Register session cache BEFORE nunjucks
    i18nPlugin,
    nunjucksConfig, // This uses context which needs request.yar
    Scooter,
    {
      plugin: Crumb,
      options: {
        cookieOptions: {
          isSecure: config.get('isProduction'),
          isHttpOnly: true,
          isSameSite: 'Strict'
        }
      }
    },
    contentSecurityPolicy,
    areasPreloader, // Preload areas on first request
    metrics, // AWS EMF metrics (must be after requestTracing)
    router // Register all the controllers/routes defined in src/server/router.js
  ])
}

export async function createServer() {
  validateProductionConfig()
  setupProxy()
  const server = hapi.server(buildServerConfig())
  registerCookieStates(server)
  registerScannerProbeFilter(server)
  await registerPlugins(server)
  server.ext('onPreResponse', catchAll)
  server.ext('onPreResponse', noCacheHeaders)
  return server
}
