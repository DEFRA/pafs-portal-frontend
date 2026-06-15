import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import {
  clearFundingValueFields,
  sanitiseFundingValueRow,
  setSourceTotalsFromContributorArrays,
  stripEmptyContributorEntries,
  stripEmptyContributorEntriesWithMapping,
  sanitiseZerosFromValidatedRows,
  numericKeysToArrays,
  parseFundingValuesPayload,
  parseContributorsPayload
} from './payload-helpers.js'

// ─── Mock project-utils ─────────────────────────────────────────────────────

const mockSessionData = {}
const mockGetSessionData = vi.fn(() => mockSessionData)
const mockUpdateSessionData = vi.fn()

vi.mock('../../helpers/project-utils.js', () => ({
  getSessionData: (...args) => mockGetSessionData(...args),
  updateSessionData: (...args) => mockUpdateSessionData(...args)
}))

const mockRequest = {}

beforeEach(() => {
  vi.clearAllMocks()
  // Reset mock session data
  Object.keys(mockSessionData).forEach((k) => delete mockSessionData[k])
})

// ─── clearFundingValueFields ─────────────────────────────────────────────────

describe('clearFundingValueFields', () => {
  it('does nothing when fundingValues is not in session', () => {
    mockGetSessionData.mockReturnValue({})
    clearFundingValueFields(mockRequest, ['fcermGia'])
    expect(mockUpdateSessionData).not.toHaveBeenCalled()
  })

  it('does nothing when fundingValues is empty array', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: []
    })
    clearFundingValueFields(mockRequest, ['fcermGia'])
    expect(mockUpdateSessionData).not.toHaveBeenCalled()
  })

  it('does nothing when fundingValues is not an array', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: 'not-an-array'
    })
    clearFundingValueFields(mockRequest, ['fcermGia'])
    expect(mockUpdateSessionData).not.toHaveBeenCalled()
  })

  it('nulls the specified fields in every row', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        { financialYear: 2025, fcermGia: '1000', localLevy: '500' },
        { financialYear: 2026, fcermGia: '2000', localLevy: '300' }
      ]
    })

    clearFundingValueFields(mockRequest, ['fcermGia'])

    expect(mockUpdateSessionData).toHaveBeenCalledWith(mockRequest, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        { financialYear: 2025, fcermGia: null, localLevy: '500' },
        { financialYear: 2026, fcermGia: null, localLevy: '300' }
      ]
    })
  })

  it('nulls multiple fields in every row', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          fcermGia: '1000',
          localLevy: '500',
          recovery: '200'
        }
      ]
    })

    clearFundingValueFields(mockRequest, ['fcermGia', 'localLevy'])

    expect(mockUpdateSessionData).toHaveBeenCalledWith(mockRequest, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          fcermGia: null,
          localLevy: null,
          recovery: '200'
        }
      ]
    })
  })

  it('does not mutate the original rows', () => {
    const originalRow = { financialYear: 2025, fcermGia: '1000' }
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [originalRow]
    })

    clearFundingValueFields(mockRequest, ['fcermGia'])

    // Original row should be unchanged
    expect(originalRow.fcermGia).toBe('1000')
  })

  it('removes companion contributor arrays when a contributor source field is cleared', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          publicContributions: '5000',
          publicContributors: [
            {
              name: 'ABC Ltd',
              contributorType: 'public_contributions',
              amount: '5000'
            }
          ],
          fcermGia: '1000'
        }
      ]
    })

    clearFundingValueFields(mockRequest, ['publicContributions'])

    expect(mockUpdateSessionData).toHaveBeenCalledWith(mockRequest, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          publicContributions: null,
          fcermGia: '1000'
          // publicContributors deleted
        }
      ]
    })
  })

  it('removes all three contributor arrays when all three contributor sources are cleared', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          publicContributions: '1000',
          publicContributors: [
            {
              name: 'A',
              contributorType: 'public_contributions',
              amount: '1000'
            }
          ],
          privateContributions: '2000',
          privateContributors: [
            {
              name: 'B',
              contributorType: 'private_contributions',
              amount: '2000'
            }
          ],
          otherEaContributions: '3000',
          otherEaContributors: [
            {
              name: 'C',
              contributorType: 'other_ea_contributions',
              amount: '3000'
            }
          ],
          fcermGia: '500'
        }
      ]
    })

    clearFundingValueFields(mockRequest, [
      'publicContributions',
      'privateContributions',
      'otherEaContributions'
    ])

    expect(mockUpdateSessionData).toHaveBeenCalledWith(mockRequest, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          publicContributions: null,
          privateContributions: null,
          otherEaContributions: null,
          fcermGia: '500'
          // all three contributor arrays deleted
        }
      ]
    })
  })

  it('does not remove contributor arrays for non-contributor source fields', () => {
    mockGetSessionData.mockReturnValue({
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          fcermGia: '1000',
          publicContributions: '5000',
          publicContributors: [
            {
              name: 'ABC Ltd',
              contributorType: 'public_contributions',
              amount: '5000'
            }
          ]
        }
      ]
    })

    clearFundingValueFields(mockRequest, ['fcermGia'])

    expect(mockUpdateSessionData).toHaveBeenCalledWith(mockRequest, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: [
        {
          financialYear: 2025,
          fcermGia: null,
          publicContributions: '5000',
          publicContributors: [
            {
              name: 'ABC Ltd',
              contributorType: 'public_contributions',
              amount: '5000'
            }
          ]
        }
      ]
    })
  })
})

// ─── sanitiseFundingValueRow ─────────────────────────────────────────────────

describe('sanitiseFundingValueRow', () => {
  it('converts financialYear to a number', () => {
    const result = sanitiseFundingValueRow({ financialYear: '2025' })
    expect(result.financialYear).toBe(2025)
    expect(typeof result.financialYear).toBe('number')
  })

  it('defaults financialYear to 0 for non-numeric string', () => {
    const result = sanitiseFundingValueRow({ financialYear: 'bad' })
    expect(result.financialYear).toBe(0)
  })

  it('strips commas from string amount fields', () => {
    const result = sanitiseFundingValueRow({ fcermGia: '1,000,000' })
    expect(result.fcermGia).toBe('1000000')
  })

  it('trims whitespace from string fields', () => {
    const result = sanitiseFundingValueRow({ fcermGia: '  500  ' })
    expect(result.fcermGia).toBe('500')
  })

  it('leaves non-string, non-array scalar values unchanged', () => {
    const result = sanitiseFundingValueRow({ someNum: 42 })
    expect(result.someNum).toBe(42)
  })

  it('cleans amount/name/contributorType inside array contributor items', () => {
    const result = sanitiseFundingValueRow({
      publicContributors: [
        {
          name: '  Alice ',
          contributorType: ' public_contributions ',
          amount: '1,500'
        }
      ]
    })
    expect(result.publicContributors[0]).toEqual({
      name: 'Alice',
      contributorType: 'public_contributions',
      amount: '1500'
    })
  })

  it('handles contributor arrays delivered as numeric-keyed objects', () => {
    const result = sanitiseFundingValueRow({
      publicContributors: {
        0: {
          name: 'Bob',
          amount: '2,000',
          contributorType: 'public_contributions'
        }
      }
    })
    expect(result.publicContributors[0].amount).toBe('2000')
  })

  it('passes through non-object items inside arrays', () => {
    const result = sanitiseFundingValueRow({
      publicContributors: [null, undefined, 'string']
    })
    expect(result.publicContributors).toEqual([null, undefined, 'string'])
  })

  it('does not mutate the original row', () => {
    const original = { fcermGia: '1,000' }
    sanitiseFundingValueRow(original)
    expect(original.fcermGia).toBe('1,000')
  })
})

// ─── setSourceTotalsFromContributorArrays ───────────────────────────────────

describe('setSourceTotalsFromContributorArrays', () => {
  it('sets publicContributions total from publicContributors', () => {
    const row = {
      publicContributors: [{ amount: '300' }, { amount: '200' }]
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]).toBe('500')
  })

  it('sets privateContributions total from privateContributors', () => {
    const row = {
      privateContributors: [{ amount: '1000' }]
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]).toBe('1000')
  })

  it('sets otherEaContributions total from otherEaContributors', () => {
    const row = {
      otherEaContributors: [{ amount: '750' }]
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]).toBe('750')
  })

  it('does not set source field when total is zero', () => {
    const row = {}
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]).toBeUndefined()
  })

  it('ignores contributor entries with empty amounts', () => {
    const row = {
      publicContributors: [{ amount: '' }, { amount: '100' }]
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]).toBe('100')
  })

  it('ignores contributor entries with non-string amounts', () => {
    const row = {
      publicContributors: [{ amount: null }, { amount: '200' }]
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]).toBe('200')
  })

  it('handles a numeric-keyed object instead of array', () => {
    const row = {
      publicContributors: { 0: { amount: '400' }, 1: { amount: '100' } }
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]).toBe('500')
  })

  it('preserves full precision for amounts with 16+ significant digits', () => {
    const row = {
      publicContributors: [
        { amount: '12345678901234567' },
        { amount: '10000000000000000' }
      ]
    }
    setSourceTotalsFromContributorArrays(row)
    expect(row[PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]).toBe(
      '22345678901234567'
    )
  })
})

// ─── stripEmptyContributorEntries ────────────────────────────────────────────

describe('stripEmptyContributorEntries', () => {
  it('removes contributor entries with empty amount', () => {
    const row = {
      publicContributors: [
        { name: 'Alice', amount: '100' },
        { name: 'Bob', amount: '' }
      ]
    }
    stripEmptyContributorEntries(row)
    expect(row.publicContributors).toHaveLength(1)
    expect(row.publicContributors[0].name).toBe('Alice')
  })

  it('deletes the key entirely when all entries are empty', () => {
    const row = {
      publicContributors: [{ name: 'Alice', amount: '' }]
    }
    stripEmptyContributorEntries(row)
    expect(row.publicContributors).toBeUndefined()
  })

  it('removes non-object items from contributor arrays', () => {
    const row = {
      privateContributors: [null, { name: 'Bob', amount: '50' }, undefined]
    }
    stripEmptyContributorEntries(row)
    expect(row.privateContributors).toHaveLength(1)
    expect(row.privateContributors[0].name).toBe('Bob')
  })

  it('trims whitespace when checking amount', () => {
    const row = {
      otherEaContributors: [
        { name: 'C1', amount: '   ' },
        { name: 'C2', amount: '100' }
      ]
    }
    stripEmptyContributorEntries(row)
    expect(row.otherEaContributors).toHaveLength(1)
    expect(row.otherEaContributors[0].name).toBe('C2')
  })

  it('does not touch non-array contributor values', () => {
    const row = { publicContributors: null }
    stripEmptyContributorEntries(row)
    expect(row.publicContributors).toBeNull()
  })

  it('leaves rows without contributor arrays unchanged', () => {
    const row = { fcermGia: '500' }
    stripEmptyContributorEntries(row)
    expect(row).toEqual({ fcermGia: '500' })
  })
})

// ─── stripEmptyContributorEntriesWithMapping ─────────────────────────────────

describe('stripEmptyContributorEntriesWithMapping', () => {
  it('returns stripped row and index mapping', () => {
    const input = {
      privateContributors: [
        { name: 'Alice', amount: '' },
        { name: 'Bob', amount: '' },
        { name: 'Charlie', amount: '500' }
      ]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.privateContributors).toHaveLength(1)
    expect(row.privateContributors[0].name).toBe('Charlie')
    // Stripped index 0 → original index 2
    expect(indexMaps.privateContributors).toEqual([2])
  })

  it('maps multiple kept entries to their original indices', () => {
    const input = {
      publicContributors: [
        { name: 'A', amount: '100' },
        { name: 'B', amount: '' },
        { name: 'C', amount: '200' },
        { name: 'D', amount: '300' }
      ]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.publicContributors).toHaveLength(3)
    expect(indexMaps.publicContributors).toEqual([0, 2, 3])
  })

  it('deletes array key when all entries are empty', () => {
    const input = {
      otherEaContributors: [{ name: 'X', amount: '' }]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.otherEaContributors).toBeUndefined()
    expect(indexMaps.otherEaContributors).toEqual([])
  })

  it('does not mutate the original row', () => {
    const input = {
      publicContributors: [
        { name: 'A', amount: '' },
        { name: 'B', amount: '100' }
      ]
    }
    stripEmptyContributorEntriesWithMapping(input)
    expect(input.publicContributors).toHaveLength(2)
  })

  it('handles rows with no contributor arrays', () => {
    const input = { fcermGia: '500' }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row).toEqual({ fcermGia: '500' })
    expect(indexMaps).toEqual({})
  })

  it('treats null contributor entries as empty', () => {
    const input = {
      publicContributors: [null, { name: 'A', amount: '100' }]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.publicContributors).toHaveLength(1)
    expect(row.publicContributors[0].name).toBe('A')
    expect(indexMaps.publicContributors).toEqual([1])
  })

  it('treats non-object contributor entries as empty', () => {
    const input = {
      publicContributors: ['not-an-object', { name: 'B', amount: '50' }]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.publicContributors).toHaveLength(1)
    expect(row.publicContributors[0].name).toBe('B')
    expect(indexMaps.publicContributors).toEqual([1])
  })

  it('treats contributor with non-string amount as empty', () => {
    const input = {
      publicContributors: [
        { name: 'A', amount: 0 },
        { name: 'B', amount: '200' }
      ]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.publicContributors).toHaveLength(1)
    expect(row.publicContributors[0].name).toBe('B')
    expect(indexMaps.publicContributors).toEqual([1])
  })

  it('treats contributor with whitespace-only amount as empty', () => {
    const input = {
      privateContributors: [
        { name: 'X', amount: '   ' },
        { name: 'Y', amount: '300' }
      ]
    }
    const { row, indexMaps } = stripEmptyContributorEntriesWithMapping(input)
    expect(row.privateContributors).toHaveLength(1)
    expect(row.privateContributors[0].name).toBe('Y')
    expect(indexMaps.privateContributors).toEqual([1])
  })
})

// ─── sanitiseZerosFromValidatedRows ──────────────────────────────────────────

describe('sanitiseZerosFromValidatedRows', () => {
  it('converts "0" spend fields to empty strings', () => {
    const rows = [{ financialYear: 2025, fcermGia: '0', localLevy: '500' }]
    const result = sanitiseZerosFromValidatedRows(rows)
    expect(result[0].fcermGia).toBe('')
    expect(result[0].localLevy).toBe('500')
  })

  it('converts "0" contributor amounts and strips them', () => {
    const rows = [
      {
        financialYear: 2025,
        publicContributors: [
          { name: 'A', amount: '0' },
          { name: 'B', amount: '100' }
        ]
      }
    ]
    const result = sanitiseZerosFromValidatedRows(rows)
    expect(result[0].publicContributors).toHaveLength(1)
    expect(result[0].publicContributors[0].name).toBe('B')
  })

  it('removes contributor array key when all amounts are zero', () => {
    const rows = [
      {
        financialYear: 2025,
        privateContributors: [{ name: 'A', amount: '0' }]
      }
    ]
    const result = sanitiseZerosFromValidatedRows(rows)
    expect(result[0].privateContributors).toBeUndefined()
  })

  it('does not mutate the original rows', () => {
    const rows = [{ financialYear: 2025, fcermGia: '0' }]
    sanitiseZerosFromValidatedRows(rows)
    expect(rows[0].fcermGia).toBe('0')
  })

  it('leaves non-zero values unchanged', () => {
    const rows = [{ financialYear: 2025, fcermGia: '1000' }]
    const result = sanitiseZerosFromValidatedRows(rows)
    expect(result[0].fcermGia).toBe('1000')
  })

  it('handles null or non-object contributor entries in sanitisation', () => {
    const rows = [
      {
        financialYear: 2025,
        publicContributors: [null, 'not-obj', { name: 'A', amount: '100' }]
      }
    ]
    const result = sanitiseZerosFromValidatedRows(rows)
    // null and non-object are filtered out
    expect(result[0].publicContributors).toHaveLength(1)
    expect(result[0].publicContributors[0].name).toBe('A')
  })

  it('handles contributor with non-string amount in sanitisation', () => {
    const rows = [
      {
        financialYear: 2025,
        privateContributors: [
          { name: 'A', amount: 100 },
          { name: 'B', amount: '200' }
        ]
      }
    ]
    const result = sanitiseZerosFromValidatedRows(rows)
    // amount=100 (number) → treated as empty string → filtered out
    expect(result[0].privateContributors).toHaveLength(1)
    expect(result[0].privateContributors[0].name).toBe('B')
  })
})

// ─── numericKeysToArrays ─────────────────────────────────────────────────────

describe('numericKeysToArrays', () => {
  it('returns primitives unchanged', () => {
    expect(numericKeysToArrays('hello')).toBe('hello')
    expect(numericKeysToArrays(42)).toBe(42)
    expect(numericKeysToArrays(null)).toBeNull()
  })

  it('converts a numeric-keyed object to an array', () => {
    const result = numericKeysToArrays({ 0: 'a', 1: 'b', 2: 'c' })
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('sorts numeric keys correctly before converting', () => {
    const result = numericKeysToArrays({ 2: 'c', 0: 'a', 1: 'b' })
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('returns a plain object with non-numeric keys unchanged', () => {
    const result = numericKeysToArrays({ foo: 'bar', baz: 'qux' })
    expect(result).toEqual({ foo: 'bar', baz: 'qux' })
  })

  it('recursively converts nested numeric-keyed objects', () => {
    const result = numericKeysToArrays({ 0: { 0: 'x', 1: 'y' }, 1: 'z' })
    expect(result).toEqual([['x', 'y'], 'z'])
  })

  it('handles an empty object without crashing', () => {
    const result = numericKeysToArrays({})
    expect(result).toEqual({})
  })
})

// ─── parseFundingValuesPayload ────────────────────────────────────────────────

describe('parseFundingValuesPayload', () => {
  it('returns empty array for null payload', () => {
    expect(parseFundingValuesPayload(null)).toEqual([])
  })

  it('returns empty array for undefined payload', () => {
    expect(parseFundingValuesPayload(undefined)).toEqual([])
  })

  it('returns fundingValues array directly when already an array', () => {
    const rows = [{ financialYear: 2025, fcermGia: '100' }]
    const result = parseFundingValuesPayload({ fundingValues: rows })
    expect(result).toEqual(rows)
  })

  it('converts object-form fundingValues to array', () => {
    const payload = {
      fundingValues: {
        0: { financialYear: '2025', fcermGia: '100' },
        1: { financialYear: '2026', fcermGia: '200' }
      }
    }
    const result = parseFundingValuesPayload(payload)
    expect(result).toHaveLength(2)
  })

  it('parses flat bracket-notation keys into nested rows', () => {
    const payload = {
      'fundingValues[0][financialYear]': '2025',
      'fundingValues[0][fcermGia]': '500',
      'fundingValues[1][financialYear]': '2026',
      'fundingValues[1][fcermGia]': '600'
    }
    const result = parseFundingValuesPayload(payload)
    expect(result).toHaveLength(2)
    expect(result[0].financialYear).toBe('2025')
    expect(result[0].fcermGia).toBe('500')
    expect(result[1].financialYear).toBe('2026')
  })

  it('falls back to bracket-key parsing when fundingValues is a primitive', () => {
    // fundingValues is a string → _parseNestedFundingValues returns null
    const result = parseFundingValuesPayload({ fundingValues: 'not-an-object' })
    expect(result).toEqual([])
  })

  it('skips bracket keys that produce no regex segments', () => {
    // A key that starts with "fundingValues[" but has no valid bracket content
    const result = parseFundingValuesPayload({ 'fundingValues[': 'oops' })
    expect(result).toEqual([])
  })

  it('returns empty array when payload has no fundingValues keys', () => {
    const result = parseFundingValuesPayload({ action: 'continue' })
    expect(result).toEqual([])
  })

  it('handles deeply nested bracket notation (contributors)', () => {
    const payload = {
      'fundingValues[0][financialYear]': '2025',
      'fundingValues[0][publicContributors][0][name]': 'Alice',
      'fundingValues[0][publicContributors][0][amount]': '100'
    }
    const result = parseFundingValuesPayload(payload)
    expect(result[0].publicContributors[0].name).toBe('Alice')
    expect(result[0].publicContributors[0].amount).toBe('100')
  })
})

// ─── parseContributorsPayload ─────────────────────────────────────────────────

describe('parseContributorsPayload', () => {
  it('returns one empty slot when payload is null', () => {
    const result = parseContributorsPayload(null)
    expect(result).toEqual([''])
  })

  it('returns one empty slot when payload has no contributors key', () => {
    const result = parseContributorsPayload({ action: 'continue' })
    expect(result).toEqual([''])
  })

  it('parses array contributors directly', () => {
    const result = parseContributorsPayload({ contributors: ['Alice', 'Bob'] })
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('pads to session length when array is shorter', () => {
    const result = parseContributorsPayload({ contributors: ['Alice'] }, [
      'A',
      'B',
      'C'
    ])
    expect(result).toHaveLength(3)
    expect(result[0]).toBe('Alice')
    expect(result[1]).toBe('')
    expect(result[2]).toBe('')
  })

  it('parses object-form contributors by numeric keys', () => {
    const result = parseContributorsPayload({
      contributors: { 0: 'Alice', 1: 'Bob' }
    })
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('parses top-level bracket-notation contributor keys', () => {
    const result = parseContributorsPayload({
      'contributors[0]': 'Alice',
      'contributors[1]': 'Bob'
    })
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('uses session baseline length when bracket keys are sparse', () => {
    const result = parseContributorsPayload({ 'contributors[0]': 'Alice' }, [
      'A',
      'B',
      'C'
    ])
    expect(result).toHaveLength(3)
    expect(result[0]).toBe('Alice')
    expect(result[1]).toBe('')
  })

  it('replaces non-string values in array with empty string', () => {
    const result = parseContributorsPayload({
      contributors: ['Alice', null, undefined]
    })
    expect(result).toEqual(['Alice', '', ''])
  })
})
