import { describe, test, expect } from 'vitest'
import {
  MAIN_FUNDING_SOURCE_FIELDS,
  ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS,
  SPENDING_FUNDING_SOURCE_FIELDS,
  fundingSourcesSelectedSchema,
  additionalFcrmGiaSelectedSchema,
  publicContributorNamesSchema,
  privateContributorNamesSchema,
  otherEaContributorNamesSchema,
  fundingValueRowSchema,
  createFundingValuesSchema
} from './project-funding-sources-schemas.js'

const allMainFalse = () =>
  Object.fromEntries(MAIN_FUNDING_SOURCE_FIELDS.map((field) => [field, false]))

const allMainTrue = () =>
  Object.fromEntries(MAIN_FUNDING_SOURCE_FIELDS.map((field) => [field, true]))

const allGiaFalse = () =>
  Object.fromEntries(
    ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS.map((field) => [field, false])
  )

const validRow = (overrides = {}) => ({
  financialYear: 2025,
  ...overrides
})

describe('project-funding-sources-schemas', () => {
  test('exports expected field arrays', () => {
    expect(MAIN_FUNDING_SOURCE_FIELDS).toHaveLength(7)
    expect(ADDITIONAL_GIA_FUNDING_SOURCE_FIELDS).toHaveLength(7)
    expect(SPENDING_FUNDING_SOURCE_FIELDS).toHaveLength(13)
    expect(SPENDING_FUNDING_SOURCE_FIELDS).not.toContain('additionalFcermGia')
  })

  describe('fundingSourcesSelectedSchema', () => {
    test('accepts when at least one source is selected', () => {
      const { error } = fundingSourcesSelectedSchema.validate({
        ...allMainFalse(),
        fcermGia: true
      })

      expect(error).toBeUndefined()
    })

    test('rejects when no source is selected', () => {
      const { error } = fundingSourcesSelectedSchema.validate(allMainFalse())

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('object.atLeastOneRequired')
    })

    test('rejects non-boolean values', () => {
      const { error } = fundingSourcesSelectedSchema.validate({
        ...allMainTrue(),
        fcermGia: 'true'
      })

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('boolean.base')
    })
  })

  describe('additionalFcrmGiaSelectedSchema', () => {
    test('accepts when at least one additional source is selected', () => {
      const { error } = additionalFcrmGiaSelectedSchema.validate({
        ...allGiaFalse(),
        assetReplacementAllowance: true
      })

      expect(error).toBeUndefined()
    })

    test('rejects when none are selected', () => {
      const { error } = additionalFcrmGiaSelectedSchema.validate(allGiaFalse())

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('object.atLeastOneRequired')
    })
  })

  describe('contributor names schemas', () => {
    test('accepts a valid public contributor name', () => {
      const { error } = publicContributorNamesSchema.validate('Org A')
      expect(error).toBeUndefined()
    })

    test('rejects public contributor name containing a comma', () => {
      const { error } = publicContributorNamesSchema.validate('Org A, Org B')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })

    test('accepts private contributor names', () => {
      const { error } = privateContributorNamesSchema.validate('Company X')
      expect(error).toBeUndefined()
    })

    test('rejects empty other EA contributor names', () => {
      const { error } = otherEaContributorNamesSchema.validate('   ')
      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.empty')
    })
  })

  describe('fundingValueRowSchema', () => {
    test('accepts valid spend row', () => {
      const { error } = fundingValueRowSchema.validate(
        validRow({
          fcermGia: '50000',
          localLevy: '10000'
        })
      )

      expect(error).toBeUndefined()
    })

    test('accepts contributor breakdown arrays', () => {
      const { error } = fundingValueRowSchema.validate(
        validRow({
          publicContributors: [
            {
              name: 'Local Authority A',
              contributorType: 'public_contributions',
              amount: '15000'
            }
          ],
          privateContributors: [
            {
              name: 'Company X',
              contributorType: 'private_contributions',
              amount: '5000'
            }
          ],
          otherEaContributors: [
            {
              name: 'Company Y',
              contributorType: 'other_ea_contributions',
              amount: '5000'
            }
          ]
        })
      )

      expect(error).toBeUndefined()
    })

    test('rejects contributor amount with non-digits', () => {
      const { error } = fundingValueRowSchema.validate(
        validRow({
          publicContributors: [
            {
              name: 'Local Authority A',
              contributorType: 'public_contributions',
              amount: '15,000'
            }
          ]
        })
      )

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.pattern.base')
    })

    test('rejects spend value exceeding 18 digits', () => {
      const { error } = fundingValueRowSchema.validate(
        validRow({
          fcermGia: '1234567890123456789' // 19 digits
        })
      )

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('string.max')
    })

    test('accepts spend value with exactly 18 digits', () => {
      const { error } = fundingValueRowSchema.validate(
        validRow({
          fcermGia: '123456789012345678' // 18 digits
        })
      )

      expect(error).toBeUndefined()
    })

    test('rejects mismatched contributor type inside contributor array', () => {
      const { error } = fundingValueRowSchema.validate(
        validRow({
          privateContributors: [
            {
              name: 'Company X',
              contributorType: 'public_contributions',
              amount: '5000'
            }
          ]
        })
      )

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('any.only')
    })
  })

  describe('createFundingValuesSchema', () => {
    test('rejects empty array', () => {
      const schema = createFundingValuesSchema()
      const { error } = schema.validate([])

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('array.min')
    })

    test('requires selected sources to have at least one value', () => {
      const schema = createFundingValuesSchema(['fcermGia'])
      const { error } = schema.validate([
        validRow({ financialYear: 2025, fcermGia: null }),
        validRow({ financialYear: 2026, fcermGia: '' })
      ])

      expect(error).toBeDefined()
      expect(error.details[0].type).toBe('array.sourceRequiresValue')
    })

    test('accepts selected source when at least one row has value', () => {
      const schema = createFundingValuesSchema(['fcermGia'])
      const { error } = schema.validate([
        validRow({ financialYear: 2025, fcermGia: '' }),
        validRow({ financialYear: 2026, fcermGia: '1' })
      ])

      expect(error).toBeUndefined()
    })
  })
})
