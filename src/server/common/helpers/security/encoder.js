import crypto from 'node:crypto'
import { config } from '../../../../config/config.js'

function getSecret() {
  const secret = config.get('security.idSecret')

  if (!secret || secret.length < 32) {
    throw new Error(
      'ID_SECRET must be configured and at least 32 characters long'
    )
  }

  return secret
}

export function encodeUserId(id) {
  if (id === null || id === undefined || id === '') {
    throw new Error('ID cannot be null, undefined, or empty')
  }

  const idString = String(id)

  // Validate ID is numeric and positive (greater than 0)
  if (!/^\d+$/.test(idString)) {
    throw new Error('ID must be a positive integer')
  }

  // Reject zero as invalid ID
  if (Number(idString) === 0) {
    throw new Error('ID must be a positive integer')
  }

  // Encode ID to base64url
  const payload = Buffer.from(idString).toString('base64url')

  // Generate HMAC signature
  const secret = getSecret()
  const signature = crypto
    .createHmac('sha256', secret)
    .update(idString)
    .digest('base64url')
    .substring(0, 12) // Use first 12 characters for brevity

  return `${payload}.${signature}`
}

export function decodeUserId(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  try {
    const parts = token.split('.')

    if (parts.length !== 2) {
      return null
    }

    const [payload, signature] = parts

    if (!payload || !signature) {
      return null
    }

    // Decode the payload
    const idString = Buffer.from(payload, 'base64url').toString('utf8')

    // Validate decoded ID is numeric
    if (!/^\d+$/.test(idString)) {
      return null
    }

    // Verify signature
    const secret = getSecret()
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(idString)
      .digest('base64url')
      .substring(0, 12)

    // Use timing-safe comparison to prevent timing attacks
    if (
      !crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      )
    ) {
      return null
    }

    const id = Number(idString)

    // Validate the number is safe and positive
    if (!Number.isSafeInteger(id) || id <= 0) {
      return null
    }

    return id
  } catch (error) {
    // Any error in decoding returns null (invalid token)
    return null
  }
}

export function isValidToken(token) {
  return decodeUserId(token) !== null
}

export function encodeUserIds(ids) {
  if (!Array.isArray(ids)) {
    throw new Error('Input must be an array')
  }

  return ids.map((id) => encodeUserId(id))
}

export function decodeUserIds(tokens) {
  if (!Array.isArray(tokens)) {
    throw new Error('Input must be an array')
  }

  return tokens.map((token) => decodeUserId(token)).filter((id) => id !== null)
}
