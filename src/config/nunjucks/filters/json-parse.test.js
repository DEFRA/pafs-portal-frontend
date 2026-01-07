import { describe, it, expect } from 'vitest'

import { jsonParse } from './json-parse.js'

describe('jsonParse filter', () => {
  it('parses valid JSON string to object', () => {
    const jsonString = JSON.stringify({
      analytics: 'yes',
      preferencesSet: true
    })
    const result = jsonParse(jsonString)

    expect(result).toEqual({ analytics: 'yes', preferencesSet: true })
  })

  it('parses valid JSON array', () => {
    const jsonString = JSON.stringify([1, 2, 3])
    const result = jsonParse(jsonString)

    expect(result).toEqual([1, 2, 3])
  })

  it('parses simple JSON values', () => {
    expect(jsonParse('"hello"')).toBe('hello')
    expect(jsonParse('123')).toBe(123)
    expect(jsonParse('true')).toBe(true)
    expect(jsonParse('null')).toBe(null)
  })

  it('returns default object when string is invalid JSON', () => {
    const result = jsonParse('{invalid json}')

    expect(result).toEqual({})
  })

  it('returns custom default value when string is invalid JSON', () => {
    const customDefault = { fallback: true }
    const result = jsonParse('{invalid json}', customDefault)

    expect(result).toEqual(customDefault)
  })

  it('returns default value when input is null', () => {
    const result = jsonParse(null)

    expect(result).toEqual({})
  })

  it('returns default value when input is undefined', () => {
    const result = jsonParse(undefined)

    expect(result).toEqual({})
  })

  it('returns default value when input is not a string', () => {
    expect(jsonParse(123)).toEqual({})
    expect(jsonParse({ already: 'object' })).toEqual({})
    expect(jsonParse([])).toEqual({})
  })

  it('returns custom default when input is empty string', () => {
    const result = jsonParse('')

    expect(result).toEqual({})
  })

  it('handles complex nested JSON', () => {
    const complex = {
      user: {
        name: 'John',
        preferences: {
          analytics: 'yes',
          cookies: ['session', 'analytics']
        }
      }
    }
    const jsonString = JSON.stringify(complex)
    const result = jsonParse(jsonString)

    expect(result).toEqual(complex)
  })

  it('preserves custom default value parameter', () => {
    const customDefault = { error: true, message: 'Parse failed' }
    const result = jsonParse('not json', customDefault)

    expect(result).toBe(customDefault)
  })
})
