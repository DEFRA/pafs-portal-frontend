import { timingSafeEqual, createHash } from 'node:crypto'
import Boom from '@hapi/boom'
import { config } from '../../../config/config.js'

export const HEALTH_BEARER_SCHEME = 'health-bearer-scheme'
export const HEALTH_BEARER_STRATEGY = 'health-bearer'

const BEARER_PREFIX = 'bearer '

export function extractToken(authHeader) {
  if (!authHeader) {
    return null
  }
  if (!authHeader.toLowerCase().startsWith(BEARER_PREFIX)) {
    return null
  }
  return authHeader.slice(BEARER_PREFIX.length)
}

function hashToken(token) {
  return createHash('sha256').update(token).digest()
}

export function isValidToken(provided, expected) {
  return (
    expected.length > 0 &&
    timingSafeEqual(hashToken(provided), hashToken(expected))
  )
}

export function authenticate(request, h) {
  const token = extractToken(request.headers.authorization)
  if (!token) {
    return h.unauthenticated(Boom.unauthorized(null, 'Bearer'))
  }

  const expectedToken = config.get('security.healthBearerToken')
  if (!isValidToken(token, expectedToken)) {
    return h.unauthenticated(Boom.unauthorized(null, 'Bearer'))
  }

  return h.authenticated({ credentials: { scope: 'health' } })
}

export function registerHealthBearerAuth(server) {
  server.auth.scheme(HEALTH_BEARER_SCHEME, () => ({ authenticate }))
  server.auth.strategy(HEALTH_BEARER_STRATEGY, HEALTH_BEARER_SCHEME)
}
