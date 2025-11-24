import { describe, test, expect } from 'vitest'
import { EMAIL } from './validation.js'

describe('Validation Constants', () => {
  test('EMAIL.MAX_LENGTH is defined', () => {
    expect(EMAIL.MAX_LENGTH).toBe(254)
  })
})
