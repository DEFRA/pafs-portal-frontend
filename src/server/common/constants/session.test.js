import { describe, test, expect } from 'vitest'
import { SESSION } from './session.js'

describe('Session Constants', () => {
  test('SESSION.REFRESH_BUFFER_MS is 1 minute', () => {
    expect(SESSION.REFRESH_BUFFER_MS).toBe(60000)
  })

  test('SESSION.INACTIVE_TIMEOUT_MS is 30 minutes', () => {
    expect(SESSION.INACTIVE_TIMEOUT_MS).toBe(30 * 60 * 1000)
  })
})
