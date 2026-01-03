import { SESSION } from '../../constants/common.js'
import { AUTH_ERROR_CODES } from '../../constants/validation.js'
import { refreshToken } from '../../services/auth/auth-service.js'

export function setAuthSession(request, authData) {
  const now = Date.now()
  request.yar.set('auth', {
    user: authData.user,
    accessToken: authData.accessToken,
    refreshToken: authData.refreshToken,
    expiresAt: now + parseExpiry(authData.expiresIn),
    lastActivity: now
  })
}

export function getAuthSession(request) {
  return request.yar.get('auth')
}

export function clearAuthSession(request) {
  request.yar.reset()
}

export function isSessionExpired(session) {
  if (!session) {
    return true
  }

  const now = Date.now()
  const inactiveTime = now - session.lastActivity

  return inactiveTime > SESSION.INACTIVE_TIMEOUT_MS
}

export function shouldRefreshToken(session) {
  if (!session) {
    return false
  }

  const now = Date.now()
  const timeUntilExpiry = session.expiresAt - now

  return timeUntilExpiry < SESSION.REFRESH_BUFFER_MS
}

export async function refreshAuthSession(request) {
  const session = getAuthSession(request)
  const logger = request.server?.logger

  if (!session) {
    return { success: false, reason: AUTH_ERROR_CODES.SESSION_TIMEOUT }
  }

  if (isSessionExpired(session)) {
    const userId = session.user?.id
    logger?.info({ userId }, 'Session expired due to inactivity')
    clearAuthSession(request)
    return { success: false, reason: AUTH_ERROR_CODES.SESSION_TIMEOUT }
  }

  try {
    const result = await refreshToken(session.refreshToken)

    if (!result.success) {
      const userId = session.user?.id
      const errorCode = result.errors?.[0]?.errorCode || 'TOKEN_REFRESH_FAILED'

      logger?.warn({ userId, errorCode }, 'Token refresh failed')
      clearAuthSession(request)

      // Return the actual error code for proper handling
      return { success: false, reason: errorCode }
    }

    const now = Date.now()
    request.yar.set('auth', {
      ...session,
      accessToken: result.data.accessToken,
      refreshToken: result.data.refreshToken,
      expiresAt: now + parseExpiry(result.data.expiresIn),
      lastActivity: now
    })

    return { success: true }
  } catch (error) {
    const userId = session.user?.id
    logger?.error({ err: error, userId }, 'Token refresh error')
    clearAuthSession(request)

    // Always return session timeout for user-friendly message
    return { success: false, reason: AUTH_ERROR_CODES.SESSION_TIMEOUT }
  }
}

export function updateActivity(request) {
  const session = getAuthSession(request)
  if (session) {
    session.lastActivity = Date.now()
    request.yar.set('auth', session)
  }
}

function parseExpiry(expiresIn) {
  if (typeof expiresIn === 'number') {
    return expiresIn
  }

  const match = expiresIn.match(/^(\d+)([smhd])$/)
  if (!match) {
    return SESSION.TOKEN_REFRESH_MS
  }

  const value = Number.parseInt(match[1])
  const unit = match[2]

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000
  }

  return value * multipliers[unit]
}
