import { describe, test, expect } from 'vitest'
import { getAuthSession } from './session-helper.js'

describe('getAuthSession', () => {
  test('returns session when yar.get is available', () => {
    const session = { user: 'test' }
    const req = { yar: { get: (k) => (k === 'auth' ? session : null) } }

    expect(getAuthSession(req)).toBe(session)
  })

  test('returns null when request is falsy', () => {
    expect(getAuthSession(null)).toBeNull()
  })

  test('returns null when yar is missing', () => {
    expect(getAuthSession({})).toBeNull()
  })

  test('returns null when yar.get is not a function', () => {
    expect(getAuthSession({ yar: { get: null } })).toBeNull()
  })

  test('propagates error when yar.get throws', () => {
    const req = {
      yar: {
        get: () => {
          throw new Error('boom')
        }
      }
    }
    expect(() => getAuthSession(req)).toThrow('boom')
  })
})
