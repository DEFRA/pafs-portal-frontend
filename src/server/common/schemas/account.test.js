import { describe, test, expect } from 'vitest'
import Joi from 'joi'
import {
  emailSchema,
  passwordSchema,
  passwordStrengthSchema,
  confirmPasswordSchema,
  tokenSchema,
  firstNameSchema,
  lastNameSchema,
  jobTitleSchema,
  organisationSchema,
  telephoneNumberSchema,
  responsibilitySchema,
  adminFlagSchema,
  userIdSchema
} from './account.js'

describe('Account Schemas', () => {
  describe('emailSchema', () => {
    test('validates correct email', () => {
      const result = emailSchema.validate('test@example.com')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('test@example.com')
    })

    test('trims and lowercases email', () => {
      const result = emailSchema.validate('  TEST@EXAMPLE.COM  ')
      expect(result.error).toBeUndefined()
      expect(result.value).toBe('test@example.com')
    })

    test('rejects email with local part longer than 64 characters', () => {
      const longLocal = 'a'.repeat(65) + '@example.com'
      const result = emailSchema.validate(longLocal)
      expect(result.error).toBeDefined()
      // Note: Joi email validation may fail before custom validator
    })

    test('accepts email with local part exactly 64 characters', () => {
      const exactLocal = 'a'.repeat(64) + '@example.com'
      const result = emailSchema.validate(exactLocal)
      expect(result.error).toBeUndefined()
    })

    test('rejects invalid email format', () => {
      const result = emailSchema.validate('invalid-email')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('EMAIL_INVALID_FORMAT')
    })

    test('rejects empty email', () => {
      const result = emailSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('EMAIL_REQUIRED')
    })

    test('rejects email longer than 254 characters', () => {
      const longEmail = 'test@' + 'a'.repeat(250) + '.com'
      const result = emailSchema.validate(longEmail)
      expect(result.error).toBeDefined()
      // Note: Joi email validation may fail before max length check
    })
  })

  describe('passwordSchema', () => {
    test('validates non-empty password', () => {
      const result = passwordSchema.validate('password123')
      expect(result.error).toBeUndefined()
    })

    test('rejects empty password', () => {
      const result = passwordSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_REQUIRED')
    })
  })

  describe('passwordStrengthSchema', () => {
    test('validates strong password', () => {
      const result = passwordStrengthSchema.validate('StrongP@ss123')
      expect(result.error).toBeUndefined()
    })

    test('rejects password without uppercase', () => {
      const result = passwordStrengthSchema.validate('weakp@ss123')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_STRENGTH_UPPERCASE')
    })

    test('rejects password without lowercase', () => {
      const result = passwordStrengthSchema.validate('WEAKP@SS123')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_STRENGTH_LOWERCASE')
    })

    test('rejects password without number', () => {
      const result = passwordStrengthSchema.validate('WeakP@ssword')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_STRENGTH_NUMBER')
    })

    test('rejects password without special character', () => {
      const result = passwordStrengthSchema.validate('WeakPass123')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_STRENGTH_SPECIAL')
    })

    test('rejects password shorter than 8 characters', () => {
      const result = passwordStrengthSchema.validate('Sh0rt!')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_MIN_LENGTH')
    })

    test('rejects password longer than 128 characters', () => {
      const longPassword = 'A1!' + 'a'.repeat(126)
      const result = passwordStrengthSchema.validate(longPassword)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_MAX_LENGTH')
    })
  })

  describe('confirmPasswordSchema', () => {
    test('validates matching passwords', () => {
      const schema = Joi.object({
        password: Joi.string(),
        confirmPassword: confirmPasswordSchema
      })
      const result = schema.validate({
        password: 'password123',
        confirmPassword: 'password123'
      })
      expect(result.error).toBeUndefined()
    })

    test('rejects non-matching passwords', () => {
      const schema = Joi.object({
        password: Joi.string(),
        confirmPassword: confirmPasswordSchema
      })
      const result = schema.validate({
        password: 'password123',
        confirmPassword: 'different'
      })
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('PASSWORD_MISMATCH')
    })
  })

  describe('tokenSchema', () => {
    test('validates non-empty token', () => {
      const result = tokenSchema.validate('valid-token-123')
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = tokenSchema.validate('  token  ')
      expect(result.value).toBe('token')
    })

    test('rejects empty token', () => {
      const result = tokenSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('TOKEN_REQUIRED')
    })
  })

  describe('firstNameSchema', () => {
    test('validates valid first name', () => {
      const result = firstNameSchema.validate('John')
      expect(result.error).toBeUndefined()
    })

    test('validates name with hyphen and apostrophe', () => {
      const result = firstNameSchema.validate("Mary-Jane O'Brien")
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = firstNameSchema.validate('  John  ')
      expect(result.value).toBe('John')
    })

    test('rejects empty first name', () => {
      const result = firstNameSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('FIRST_NAME_REQUIRED')
    })

    test('rejects first name with invalid characters', () => {
      const result = firstNameSchema.validate('John123')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('FIRST_NAME_INVALID_FORMAT')
    })

    test('rejects first name longer than 255 characters', () => {
      const longName = 'a'.repeat(256)
      const result = firstNameSchema.validate(longName)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('FIRST_NAME_TOO_LONG')
    })
  })

  describe('lastNameSchema', () => {
    test('validates valid last name', () => {
      const result = lastNameSchema.validate('Smith')
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = lastNameSchema.validate('  Smith  ')
      expect(result.value).toBe('Smith')
    })

    test('rejects empty last name', () => {
      const result = lastNameSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('LAST_NAME_REQUIRED')
    })

    test('rejects last name with invalid characters', () => {
      const result = lastNameSchema.validate('Smith123')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('LAST_NAME_INVALID_FORMAT')
    })

    test('rejects last name longer than 255 characters', () => {
      const longName = 'a'.repeat(256)
      const result = lastNameSchema.validate(longName)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('LAST_NAME_TOO_LONG')
    })
  })

  describe('jobTitleSchema', () => {
    test('validates valid job title', () => {
      const result = jobTitleSchema.validate('Senior Engineer')
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = jobTitleSchema.validate('  Manager  ')
      expect(result.value).toBe('Manager')
    })

    test('allows null job title', () => {
      const result = jobTitleSchema.validate(null)
      expect(result.error).toBeUndefined()
    })

    test('allows empty job title', () => {
      const result = jobTitleSchema.validate('')
      expect(result.error).toBeUndefined()
    })

    test('rejects job title with invalid characters', () => {
      const result = jobTitleSchema.validate('Manager<script>')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('JOB_TITLE_INVALID_FORMAT')
    })

    test('rejects job title longer than 255 characters', () => {
      const longTitle = 'a'.repeat(256)
      const result = jobTitleSchema.validate(longTitle)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('JOB_TITLE_TOO_LONG')
    })
  })

  describe('organisationSchema', () => {
    test('validates valid organisation', () => {
      const result = organisationSchema.validate('ACME Corp')
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = organisationSchema.validate('  ACME Corp  ')
      expect(result.value).toBe('ACME Corp')
    })

    test('allows empty organisation', () => {
      const result = organisationSchema.validate('')
      expect(result.error).toBeUndefined()
    })

    test('rejects organisation with invalid characters', () => {
      const result = organisationSchema.validate('ACME<script>')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('ORGANISATION_INVALID_FORMAT')
    })

    test('rejects organisation longer than 255 characters', () => {
      const longOrg = 'a'.repeat(256)
      const result = organisationSchema.validate(longOrg)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('ORGANISATION_TOO_LONG')
    })
  })

  describe('telephoneNumberSchema', () => {
    test('validates valid UK telephone number', () => {
      const result = telephoneNumberSchema.validate('01234567890')
      expect(result.error).toBeUndefined()
    })

    test('validates telephone with spaces and dashes', () => {
      const result = telephoneNumberSchema.validate('01234 567-890')
      expect(result.error).toBeUndefined()
    })

    test('trims whitespace', () => {
      const result = telephoneNumberSchema.validate('  01234567890  ')
      expect(result.value).toBe('01234567890')
    })

    test('allows null telephone number', () => {
      const result = telephoneNumberSchema.validate(null)
      expect(result.error).toBeUndefined()
    })

    test('allows empty telephone number', () => {
      const result = telephoneNumberSchema.validate('')
      expect(result.error).toBeUndefined()
    })

    test('rejects telephone with invalid characters', () => {
      const result = telephoneNumberSchema.validate('01234abc')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('TELEPHONE_INVALID_FORMAT')
    })

    test('rejects telephone longer than 255 characters', () => {
      const longTel = '0'.repeat(256)
      const result = telephoneNumberSchema.validate(longTel)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('TELEPHONE_TOO_LONG')
    })
  })

  describe('responsibilitySchema', () => {
    test('validates EA responsibility', () => {
      const result = responsibilitySchema.validate('EA')
      expect(result.error).toBeUndefined()
    })

    test('validates RMA responsibility', () => {
      const result = responsibilitySchema.validate('RMA')
      expect(result.error).toBeUndefined()
    })

    test('validates PSO responsibility', () => {
      const result = responsibilitySchema.validate('PSO')
      expect(result.error).toBeUndefined()
    })

    test('rejects invalid responsibility', () => {
      const result = responsibilitySchema.validate('INVALID')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('RESPONSIBILITY_INVALID')
    })

    test('rejects empty responsibility', () => {
      const result = responsibilitySchema.validate('')
      expect(result.error).toBeDefined()
      // Empty string triggers RESPONSIBILITY_INVALID (not in valid list)
      expect(result.error.message).toContain('RESPONSIBILITY_INVALID')
    })
  })

  describe('adminFlagSchema', () => {
    test('validates true admin flag', () => {
      const result = adminFlagSchema.validate(true)
      expect(result.error).toBeUndefined()
    })

    test('validates false admin flag', () => {
      const result = adminFlagSchema.validate(false)
      expect(result.error).toBeUndefined()
    })

    test('defaults to false when undefined', () => {
      const result = adminFlagSchema.validate(undefined)
      expect(result.value).toBe(false)
    })

    test('converts string to boolean if possible', () => {
      // Joi boolean schema with default(false) converts truthy values
      const result = adminFlagSchema.validate('true')
      // String 'true' is truthy so gets converted to true
      expect(result.value).toBe(true)
    })
  })

  describe('userIdSchema', () => {
    test('validates positive integer', () => {
      const result = userIdSchema.validate(123)
      expect(result.error).toBeUndefined()
    })

    test('rejects negative number', () => {
      const result = userIdSchema.validate(-1)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('USER_ID_INVALID')
    })

    test('rejects zero', () => {
      const result = userIdSchema.validate(0)
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('USER_ID_INVALID')
    })

    test('rejects non-number', () => {
      const result = userIdSchema.validate('abc')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('USER_ID_INVALID')
    })

    test('rejects decimal number', () => {
      const result = userIdSchema.validate(123.45)
      expect(result.error).toBeDefined()
    })
  })
})
