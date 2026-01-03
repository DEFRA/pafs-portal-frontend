import { describe, test, expect } from 'vitest'
import {
  detailsSchema,
  userSchema,
  validateEmailSchema,
  mainAreaSchema
} from './schema.js'
import { VALIDATION_CODES } from '../../common/constants/validation.js'

describe('Account Schemas', () => {
  describe('detailsSchema', () => {
    test('validates valid user details for non-admin', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA'
      }

      const { error } = detailsSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('validates valid admin user details', () => {
      const validData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        admin: true
      }

      const { error } = detailsSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('requires jobTitle for non-admin users', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA'
      }

      const { error } = detailsSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.JOB_TITLE_REQUIRED)
    })

    test('requires organisation for non-admin users', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        telephoneNumber: '01234567890',
        responsibility: 'EA'
      }

      const { error } = detailsSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(
        VALIDATION_CODES.ORGANISATION_REQUIRED
      )
    })

    test('requires telephone for non-admin users', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        responsibility: 'EA'
      }

      const { error } = detailsSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.TELEPHONE_REQUIRED)
    })

    test('makes fields optional for admin users', () => {
      const validData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        admin: true
      }

      const { error } = detailsSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('allows optional fields in admin context', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        isAdminContext: true,
        responsibility: 'EA'
      }

      const { error } = detailsSchema.validate(validData)
      expect(error).toBeUndefined()
    })
  })

  describe('userSchema', () => {
    test('requires areas for non-admin users', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA'
      }

      const { error } = userSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.AREAS_REQUIRED)
    })

    test('validates user with areas', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA',
        areas: [
          { areaId: 1, primary: true },
          { areaId: 2, primary: false }
        ]
      }

      const { error } = userSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('requires at least one area for non-admin', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA',
        areas: []
      }

      const { error } = userSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.AREAS_REQUIRED)
    })

    test('validates area item with areaId', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA',
        areas: [{ areaId: 1 }]
      }

      const { error } = userSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('requires valid areaId in area items', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        admin: false,
        jobTitle: 'Engineer',
        organisation: 'Test Org',
        telephoneNumber: '01234567890',
        responsibility: 'EA',
        areas: [{ areaId: 'invalid' }]
      }

      const { error } = userSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.AREA_ID_INVALID)
    })

    test('makes areas optional for admin users', () => {
      const validData = {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        admin: true
      }

      const { error } = userSchema.validate(validData)
      expect(error).toBeUndefined()
    })
  })

  describe('validateEmailSchema', () => {
    test('validates valid email', () => {
      const validData = { email: 'test@example.com' }
      const { error } = validateEmailSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('rejects invalid email format', () => {
      const invalidData = { email: 'invalid-email' }
      const { error } = validateEmailSchema.validate(invalidData)
      expect(error).toBeDefined()
    })

    test('requires email field', () => {
      const invalidData = {}
      const { error } = validateEmailSchema.validate(invalidData)
      expect(error).toBeDefined()
    })
  })

  describe('mainAreaSchema', () => {
    test('validates valid main area', () => {
      const validData = { mainArea: '1' }
      const { error } = mainAreaSchema.validate(validData)
      expect(error).toBeUndefined()
    })

    test('requires mainArea field', () => {
      const invalidData = {}
      const { error } = mainAreaSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.MAIN_AREA_REQUIRED)
    })

    test('rejects empty mainArea', () => {
      const invalidData = { mainArea: '' }
      const { error } = mainAreaSchema.validate(invalidData)
      expect(error).toBeDefined()
      expect(error.details[0].message).toBe(VALIDATION_CODES.MAIN_AREA_REQUIRED)
    })
  })
})
