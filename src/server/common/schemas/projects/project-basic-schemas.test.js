import { describe, test, expect } from 'vitest'
import Joi from 'joi'
import {
  projectReferenceNumberSchema,
  projectNameSchema,
  projectAreaIdSchema,
  projectTypeSchema,
  projectInterventionTypeSchema,
  projectMainInterventionTypeSchema
} from './project-basic-schemas.js'
import {
  PROJECT_TYPES,
  PROJECT_INTERVENTION_TYPES,
  PROJECT_PAYLOAD_FIELDS
} from '../../constants/projects.js'

describe('project-basic-schemas', () => {
  describe('projectReferenceNumberSchema', () => {
    test('should allow valid reference number format', () => {
      const { error } =
        projectReferenceNumberSchema.validate('SWC501E/001A/123A')
      expect(error).toBeUndefined()
    })

    test('should allow another valid reference number format', () => {
      const { error } =
        projectReferenceNumberSchema.validate('NWC501E/999A/001A')
      expect(error).toBeUndefined()
    })

    test('should allow empty string', () => {
      const { error } = projectReferenceNumberSchema.validate('')
      expect(error).toBeUndefined()
    })

    test('should allow optional (undefined)', () => {
      const { error } = projectReferenceNumberSchema.validate(undefined)
      expect(error).toBeUndefined()
    })

    test('should trim whitespace from valid reference number', () => {
      const { error, value } = projectReferenceNumberSchema.validate(
        '  SWC501E/001A/123A  '
      )
      expect(error).toBeUndefined()
      expect(value).toBe('SWC501E/001A/123A')
    })

    test('should reject invalid format - missing parts', () => {
      const { error } = projectReferenceNumberSchema.validate('SWC501E/001A')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })

    test('should reject invalid format - wrong structure', () => {
      const { error } = projectReferenceNumberSchema.validate('invalid-format')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })

    test('should reject invalid format - no slashes', () => {
      const { error } = projectReferenceNumberSchema.validate('SWC501E001A123A')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })
  })

  describe('projectNameSchema', () => {
    test('should allow valid project name with alphanumeric characters', () => {
      const { error } = projectNameSchema.validate('Project Name 123')
      expect(error).toBeUndefined()
    })

    test('should allow project name with underscores', () => {
      const { error } = projectNameSchema.validate('Project_Name_Test')
      expect(error).toBeUndefined()
    })

    test('should allow project name with dashes', () => {
      const { error } = projectNameSchema.validate('Project-Name-Test')
      expect(error).toBeUndefined()
    })

    test('should allow project name with mixed valid characters', () => {
      const { error } = projectNameSchema.validate('Project_Name-123 Test')
      expect(error).toBeUndefined()
    })

    test('should trim whitespace from project name', () => {
      const { error, value } = projectNameSchema.validate('  Project Name  ')
      expect(error).toBeUndefined()
      expect(value).toBe('Project Name')
    })

    test('should collapse multiple internal spaces to a single space', () => {
      const { error, value } = projectNameSchema.validate(
        'South  Yorkshire Flood'
      )
      expect(error).toBeUndefined()
      expect(value).toBe('South Yorkshire Flood')
    })

    test('should collapse many consecutive spaces to a single space', () => {
      const { error, value } = projectNameSchema.validate(
        'South   Yorkshire   Flood'
      )
      expect(error).toBeUndefined()
      expect(value).toBe('South Yorkshire Flood')
    })

    test('should reject empty string', () => {
      const { error } = projectNameSchema.validate('')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.empty')
    })

    test('should reject undefined (required field)', () => {
      const { error } = projectNameSchema.validate(undefined)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('any.required')
    })

    test('should reject invalid characters - special symbols', () => {
      const { error } = projectNameSchema.validate('Project@Name!')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })

    test('should reject project name with dots', () => {
      const { error } = projectNameSchema.validate('Project.Name')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })
  })

  describe('projectAreaIdSchema', () => {
    test('should allow valid positive integer', () => {
      const { error } = projectAreaIdSchema.validate(123)
      expect(error).toBeUndefined()
    })

    test('should allow small positive integer', () => {
      const { error } = projectAreaIdSchema.validate(1)
      expect(error).toBeUndefined()
    })

    test('should allow large positive integer', () => {
      const { error } = projectAreaIdSchema.validate(999999)
      expect(error).toBeUndefined()
    })

    test('should reject zero', () => {
      const { error } = projectAreaIdSchema.validate(0)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('number.positive')
    })

    test('should reject negative number', () => {
      const { error } = projectAreaIdSchema.validate(-5)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('number.positive')
    })

    test('should reject decimal number', () => {
      const { error } = projectAreaIdSchema.validate(12.5)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('number.integer')
    })

    test('should reject undefined (required field)', () => {
      const { error } = projectAreaIdSchema.validate(undefined)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('any.required')
    })

    test('should reject null', () => {
      const { error } = projectAreaIdSchema.validate(null)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('number.base')
    })
  })

  describe('projectTypeSchema', () => {
    test('should allow DEF project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.DEF)
      expect(error).toBeUndefined()
    })

    test('should allow REP project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.REP)
      expect(error).toBeUndefined()
    })

    test('should allow REF project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.REF)
      expect(error).toBeUndefined()
    })

    test('should allow HCR project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.HCR)
      expect(error).toBeUndefined()
    })

    test('should allow STR project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.STR)
      expect(error).toBeUndefined()
    })

    test('should allow STU project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.STU)
      expect(error).toBeUndefined()
    })

    test('should allow ELO project type', () => {
      const { error } = projectTypeSchema.validate(PROJECT_TYPES.ELO)
      expect(error).toBeUndefined()
    })

    test('should trim whitespace from project type', () => {
      const { error, value } = projectTypeSchema.validate('  DEF  ')
      expect(error).toBeUndefined()
      expect(value).toBe('DEF')
    })

    test('should reject empty string', () => {
      const { error } = projectTypeSchema.validate('')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('any.only')
    })

    test('should reject undefined (required field)', () => {
      const { error } = projectTypeSchema.validate(undefined)
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('any.required')
    })

    test('should reject invalid project type', () => {
      const { error } = projectTypeSchema.validate('INVALID_TYPE')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('any.only')
    })
  })

  describe('projectInterventionTypeSchema', () => {
    describe('for DEF project type', () => {
      test('should allow NFM for DEF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should allow PFR for DEF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.PFR
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should allow SUDS for DEF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.SUDS
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should allow OTHER for DEF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.OTHER
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should allow multiple valid intervention types for DEF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM,
            PROJECT_INTERVENTION_TYPES.PFR,
            PROJECT_INTERVENTION_TYPES.SUDS
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should reject empty array for DEF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: []
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('array.min')
      })
    })

    describe('for REP project type', () => {
      test('should allow valid intervention types for REP', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REP,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM,
            PROJECT_INTERVENTION_TYPES.PFR
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should reject empty array for REP', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REP,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: []
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('array.min')
      })
    })

    describe('for REF project type', () => {
      test('should allow NFM for REF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should allow SUDS for REF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.SUDS
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should allow OTHER for REF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.OTHER
          ]
        })
        expect(error).toBeUndefined()
      })

      test('should reject empty array for REF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: []
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('array.min')
      })
    })

    describe('for other project types', () => {
      test('should forbid intervention types for HCR', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.HCR,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ]
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.unknown')
      })

      test('should forbid intervention types for STR', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STR,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ]
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.unknown')
      })
    })
  })

  describe('projectMainInterventionTypeSchema', () => {
    describe('for DEF project type', () => {
      test('should allow main intervention type from selected types', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM,
            PROJECT_INTERVENTION_TYPES.PFR
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.NFM
        })
        expect(error).toBeUndefined()
      })

      test('should allow PFR as main when PFR is in selected types', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.PFR,
            PROJECT_INTERVENTION_TYPES.SUDS
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.PFR
        })
        expect(error).toBeUndefined()
      })

      test('should reject main intervention type not in selected types', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.PFR
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.only')
      })

      test('should reject empty string when intervention types provided', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]: ''
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('string.empty')
      })

      test('should reject undefined when intervention types provided', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]: undefined
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.required')
      })

      test('should trim whitespace from main intervention type', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error, value } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]: '  NFM  '
        })
        expect(error).toBeUndefined()
        expect(value[PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]).toBe('NFM')
      })

      test('should allow optional main intervention type when projectInterventionTypes is not provided', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.DEF,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.NFM
        })
        // When projectInterventionTypes is not provided, main intervention type is optional
        expect(error).toBeUndefined()
      })
    })

    describe('for REP project type', () => {
      test('should allow main intervention type from selected types for REP', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REP,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM,
            PROJECT_INTERVENTION_TYPES.PFR
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.PFR
        })
        expect(error).toBeUndefined()
      })

      test('should reject main not in selected types for REP', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REP,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.SUDS
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.only')
      })
    })

    describe('for REF project type', () => {
      test('should allow main intervention type from selected types for REF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.SUDS,
            PROJECT_INTERVENTION_TYPES.OTHER
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.SUDS
        })
        expect(error).toBeUndefined()
      })

      test('should reject main not in selected types for REF', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]:
            projectInterventionTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.REF,
          [PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES]: [
            PROJECT_INTERVENTION_TYPES.NFM
          ],
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.OTHER
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.only')
      })
    })

    describe('for other project types', () => {
      test('should forbid main intervention type for HCR', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.HCR,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.NFM
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.unknown')
      })

      test('should forbid main intervention type for STU', () => {
        const schema = Joi.object({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: projectTypeSchema,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            projectMainInterventionTypeSchema
        })
        const { error } = schema.validate({
          [PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]: PROJECT_TYPES.STU,
          [PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE]:
            PROJECT_INTERVENTION_TYPES.NFM
        })
        expect(error).toBeDefined()
        expect(error.details[0].type).toBe('any.unknown')
      })
    })
  })
})
