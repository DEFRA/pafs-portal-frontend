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
  })

  describe('lastNameSchema', () => {
    test('validates valid last name', () => {
      const result = lastNameSchema.validate('Smith')
      expect(result.error).toBeUndefined()
    })

    test('rejects empty last name', () => {
      const result = lastNameSchema.validate('')
      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('LAST_NAME_REQUIRED')
    })
  })

  describe('jobTitleSchema', () => {
    test('validates valid job title', () => {
      const result = jobTitleSchema.validate('Senior Engineer')
      expect(result.error).toBeUndefined()
    })

    test('allows null job title', () => {
      const result = jobTitleSchema.validate(null)
      expect(result.error).toBeUndefined()
    })

    test('allows empty job title', () => {
      const result = jobTitleSchema.validate('')
      expect(result.error).toBeUndefined()
    })
  })

  describe('organisationSchema', () => {
    test('validates valid organisation', () => {
      const result = organisationSchema.validate('ACME Corp')
      expect(result.error).toBeUndefined()
    })

    test('allows empty organisation', () => {
      const result = organisationSchema.validate('')
      expect(result.error).toBeUndefined()
    })
  })

  describe('telephoneNumberSchema', () => {
    test('validates valid UK telephone number', () => {
      const result = telephoneNumberSchema.validate('01234567890')
      expect(result.error).toBeUndefined()
    })

    test('allows null telephone number', () => {
      const result = telephoneNumberSchema.validate(null)
      expect(result.error).toBeUndefined()
    })

    test('allows empty telephone number', () => {
      const result = telephoneNumberSchema.validate('')
      expect(result.error).toBeUndefined()
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
  })
})
