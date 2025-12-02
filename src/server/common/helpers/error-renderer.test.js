import { describe, test, expect } from 'vitest'
import {
  extractJoiErrors,
  extractApiValidationErrors,
  extractApiError
} from './error-renderer.js'

describe('error-renderer', () => {
  describe('extractJoiErrors', () => {
    test('returns empty object for null error', () => {
      expect(extractJoiErrors(null)).toEqual({})
    })

    test('returns empty object for error without details', () => {
      expect(extractJoiErrors({})).toEqual({})
    })

    test('extracts field errors from Joi details using label', () => {
      const err = {
        details: [
          {
            context: { label: 'email' },
            message: 'VALIDATION_EMAIL_REQUIRED',
            path: ['email']
          },
          {
            context: { label: 'password' },
            message: 'VALIDATION_PASSWORD_REQUIRED',
            path: ['password']
          }
        ]
      }
      expect(extractJoiErrors(err)).toEqual({
        email: 'VALIDATION_EMAIL_REQUIRED',
        password: 'VALIDATION_PASSWORD_REQUIRED'
      })
    })

    test('uses path when label not available', () => {
      const err = {
        details: [{ path: ['email'], message: 'VALIDATION_EMAIL_REQUIRED' }]
      }
      expect(extractJoiErrors(err)).toEqual({
        email: 'VALIDATION_EMAIL_REQUIRED'
      })
    })
  })

  describe('extractApiValidationErrors', () => {
    test('returns empty object for null result', () => {
      expect(extractApiValidationErrors(null)).toEqual({})
    })

    test('returns empty object when no validationErrors', () => {
      expect(extractApiValidationErrors({ validationErrors: [] })).toEqual({})
    })

    test('extracts field errors from validationErrors array', () => {
      const result = {
        validationErrors: [
          { field: 'email', errorCode: 'VALIDATION_EMAIL_REQUIRED' },
          { field: 'password', errorCode: 'VALIDATION_PASSWORD_REQUIRED' }
        ]
      }
      expect(extractApiValidationErrors(result)).toEqual({
        email: 'VALIDATION_EMAIL_REQUIRED',
        password: 'VALIDATION_PASSWORD_REQUIRED'
      })
    })
  })

  describe('extractApiError', () => {
    test('returns null for successful result', () => {
      expect(extractApiError({ success: true })).toBeNull()
    })

    test('returns null for null result', () => {
      expect(extractApiError(null)).toBeNull()
    })

    test('extracts error from errors array', () => {
      const result = {
        success: false,
        errors: [{ errorCode: 'AUTH_INVALID_CREDENTIALS' }]
      }
      expect(extractApiError(result)).toEqual({
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        warningCode: null,
        supportCode: null
      })
    })

    test('extracts warning and support codes', () => {
      const result = {
        success: false,
        errors: [
          {
            errorCode: 'AUTH_INVALID_CREDENTIALS',
            warningCode: 'AUTH_LAST_ATTEMPT',
            supportCode: 'CONTACT_SUPPORT'
          }
        ]
      }
      expect(extractApiError(result)).toEqual({
        errorCode: 'AUTH_INVALID_CREDENTIALS',
        warningCode: 'AUTH_LAST_ATTEMPT',
        supportCode: 'CONTACT_SUPPORT'
      })
    })

    test('returns UNKNOWN_ERROR when no errors array', () => {
      expect(extractApiError({ success: false })).toEqual({
        errorCode: 'UNKNOWN_ERROR'
      })
    })
  })
})
