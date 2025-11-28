import { describe, test, expect } from 'vitest'
import { SIZE, VALIDATION_CODES } from './validation.js'

describe('Validation Constants', () => {
  test('SIZE constants are defined', () => {
    expect(SIZE.LENGTH_8).toBe(8)
    expect(SIZE.LENGTH_32).toBe(32)
    expect(SIZE.LENGTH_128).toBe(128)
    expect(SIZE.LENGTH_254).toBe(254)
  })

  test('VALIDATION_CODES are defined', () => {
    expect(VALIDATION_CODES.EMAIL_REQUIRED).toBe('VALIDATION_EMAIL_REQUIRED')
    expect(VALIDATION_CODES.PASSWORD_REQUIRED).toBe(
      'VALIDATION_PASSWORD_REQUIRED'
    )
  })
})
