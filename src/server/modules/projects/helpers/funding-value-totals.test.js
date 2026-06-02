import { describe, test, expect } from 'vitest'
import { computeFundingSourceTotals } from './funding-value-totals.js'

// ─── helpers ─────────────────────────────────────────────────────────────────

const ALL_FIELDS = [
  'fcermGia',
  'localLevy',
  'publicContributions',
  'privateContributions',
  'otherEaContributions',
  'notYetIdentified',
  'assetReplacementAllowance',
  'environmentStatutoryFunding',
  'frequentlyFloodedCommunities',
  'otherAdditionalGrantInAid',
  'otherGovernmentDepartment',
  'recovery',
  'summerEconomicFund'
]

const ADDITIONAL_GIA_FIELDS = [
  'assetReplacementAllowance',
  'environmentStatutoryFunding',
  'frequentlyFloodedCommunities',
  'otherAdditionalGrantInAid',
  'otherGovernmentDepartment',
  'recovery',
  'summerEconomicFund'
]

// Build a projectData object that marks the given fields as selected
const active = (...fields) => Object.fromEntries(fields.map((f) => [f, true]))

// ─── Return shape ─────────────────────────────────────────────────────────────

describe('computeFundingSourceTotals – return shape', () => {
  test('returns all four keys on the result object', () => {
    const result = computeFundingSourceTotals([], {})
    expect(result).toHaveProperty('sourceTotals')
    expect(result).toHaveProperty('yearTotals')
    expect(result).toHaveProperty('grandTotal')
    expect(result).toHaveProperty('additionalGiaTotal')
  })

  test('all numeric values are returned as strings, not numbers', () => {
    const rows = [{ financialYear: 2025, fcermGia: '5000' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(typeof result.grandTotal).toBe('string')
    expect(typeof result.yearTotals[0]).toBe('string')
    expect(typeof result.sourceTotals.fcermGia).toBe('string')
    expect(typeof result.additionalGiaTotal).toBe('string')
  })

  test('initialises all 13 sourceTotals fields to "0"', () => {
    const result = computeFundingSourceTotals([], {})
    for (const field of ALL_FIELDS) {
      expect(result.sourceTotals).toHaveProperty(field, '0')
    }
  })

  test('yearTotals length matches the number of processed rows', () => {
    const rows = [
      { financialYear: 2025, fcermGia: '100' },
      { financialYear: 2026, fcermGia: '200' },
      { financialYear: 2027, fcermGia: '300' }
    ]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.yearTotals).toHaveLength(3)
  })
})

// ─── Empty / zero cases ───────────────────────────────────────────────────────

describe('computeFundingSourceTotals – empty / zero cases', () => {
  test('empty rows returns zero totals and empty yearTotals', () => {
    const result = computeFundingSourceTotals([], {})
    expect(result.grandTotal).toBe('0')
    expect(result.yearTotals).toEqual([])
    expect(result.additionalGiaTotal).toBe('0')
  })

  test('no active projectData fields returns all zeros regardless of row values', () => {
    const rows = [
      { financialYear: 2025, fcermGia: '99999', localLevy: '12345' }
    ]
    const result = computeFundingSourceTotals(rows, {})
    expect(result.grandTotal).toBe('0')
    expect(result.yearTotals).toEqual(['0'])
    expect(result.sourceTotals.fcermGia).toBe('0')
    expect(result.sourceTotals.localLevy).toBe('0')
  })

  test('defaults projectData to empty object when omitted', () => {
    const rows = [{ financialYear: 2025, fcermGia: '1000' }]
    const result = computeFundingSourceTotals(rows)
    expect(result.grandTotal).toBe('0')
  })

  test('null row field values are treated as zero', () => {
    const rows = [{ financialYear: 2025, fcermGia: null, localLevy: null }]
    const result = computeFundingSourceTotals(
      rows,
      active('fcermGia', 'localLevy')
    )
    expect(result.sourceTotals.fcermGia).toBe('0')
    expect(result.sourceTotals.localLevy).toBe('0')
    expect(result.grandTotal).toBe('0')
  })

  test('undefined row field values are treated as zero', () => {
    const rows = [{ financialYear: 2025 }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('0')
    expect(result.yearTotals).toEqual(['0'])
  })
})

// ─── Active field filtering ───────────────────────────────────────────────────

describe('computeFundingSourceTotals – active field filtering', () => {
  test('sums only the fields selected in projectData', () => {
    const rows = [{ financialYear: 2025, fcermGia: '1000', localLevy: '500' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('1000')
    expect(result.sourceTotals.localLevy).toBe('0')
    expect(result.grandTotal).toBe('1000')
  })

  test('deselected field (false) does not contribute to totals', () => {
    const rows = [{ financialYear: 2025, fcermGia: '1000', localLevy: '500' }]
    const projectData = { fcermGia: true, localLevy: false }
    const result = computeFundingSourceTotals(rows, projectData)
    expect(result.sourceTotals.fcermGia).toBe('1000')
    expect(result.sourceTotals.localLevy).toBe('0')
  })

  test('multiple active fields are each summed independently', () => {
    const rows = [
      {
        financialYear: 2025,
        fcermGia: '1000',
        localLevy: '500',
        notYetIdentified: '250'
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('fcermGia', 'localLevy', 'notYetIdentified')
    )
    expect(result.sourceTotals.fcermGia).toBe('1000')
    expect(result.sourceTotals.localLevy).toBe('500')
    expect(result.sourceTotals.notYetIdentified).toBe('250')
    expect(result.grandTotal).toBe('1750')
  })
})

// ─── Multi-row aggregation ────────────────────────────────────────────────────

describe('computeFundingSourceTotals – multi-row aggregation', () => {
  test('sums source field across multiple rows', () => {
    const rows = [
      { financialYear: 2025, fcermGia: '1000' },
      { financialYear: 2026, fcermGia: '500' },
      { financialYear: 2027, fcermGia: '250' }
    ]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('1750')
    expect(result.grandTotal).toBe('1750')
  })

  test('yearTotals contains per-row totals across all active fields', () => {
    const rows = [
      { financialYear: 2025, fcermGia: '1000', localLevy: '200' },
      { financialYear: 2026, fcermGia: '500', localLevy: '300' }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('fcermGia', 'localLevy')
    )
    expect(result.yearTotals).toEqual(['1200', '800'])
    expect(result.grandTotal).toBe('2000')
  })
})

// ─── BigInt precision — THE critical case ─────────────────────────────────────

describe('computeFundingSourceTotals – BigInt precision for large values', () => {
  test('preserves 17-digit values without rounding', () => {
    // Number("12345678901234567") === 12345678901234568 (rounded by IEEE 754)
    const rows = [{ financialYear: 2025, fcermGia: '12345678901234567' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('12345678901234567')
    expect(result.grandTotal).toBe('12345678901234567')
  })

  test('sums two 17-digit values without precision loss', () => {
    const rows = [
      { financialYear: 2025, fcermGia: '99999999999999999' },
      { financialYear: 2026, fcermGia: '10000000000000001' }
    ]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('110000000000000000')
    expect(result.grandTotal).toBe('110000000000000000')
  })

  test('preserves precision when summing multiple large fields in one row', () => {
    const rows = [
      {
        financialYear: 2025,
        fcermGia: '10000000000000001',
        localLevy: '10000000000000002'
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('fcermGia', 'localLevy')
    )
    expect(result.grandTotal).toBe('20000000000000003')
  })

  test('handles values at the exact IEEE 754 safe integer boundary', () => {
    // 9007199254740991 === Number.MAX_SAFE_INTEGER — safe for both Number and BigInt
    const rows = [{ financialYear: 2025, fcermGia: '9007199254740991' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('9007199254740991')
  })

  test('handles values one above MAX_SAFE_INTEGER — would round as Number', () => {
    // 9007199254740992 is Number.MAX_SAFE_INTEGER + 1; Number arithmetic rounds it
    const rows = [{ financialYear: 2025, fcermGia: '9007199254740993' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    // If Number were used: Number("9007199254740993") === 9007199254740992
    expect(result.sourceTotals.fcermGia).toBe('9007199254740993')
  })
})

// ─── additionalGiaTotal ───────────────────────────────────────────────────────

describe('computeFundingSourceTotals – additionalGiaTotal', () => {
  test('additionalGiaTotal sums all 7 Additional GIA sub-fields', () => {
    const rowData = Object.fromEntries(
      ADDITIONAL_GIA_FIELDS.map((f) => [f, '100'])
    )
    const rows = [{ financialYear: 2025, ...rowData }]
    const result = computeFundingSourceTotals(
      rows,
      active(...ADDITIONAL_GIA_FIELDS)
    )
    expect(result.additionalGiaTotal).toBe('700')
  })

  test('additionalGiaTotal is "0" when no GIA sub-fields are active', () => {
    const rows = [
      {
        financialYear: 2025,
        fcermGia: '5000',
        assetReplacementAllowance: '1000'
      }
    ]
    // Only fcermGia active — none of the GIA sub-fields selected
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.additionalGiaTotal).toBe('0')
  })

  test('additionalGiaTotal excludes non-GIA fields (fcermGia, localLevy, etc.)', () => {
    const rows = [
      {
        financialYear: 2025,
        fcermGia: '9000',
        assetReplacementAllowance: '300'
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('fcermGia', 'assetReplacementAllowance')
    )
    expect(result.additionalGiaTotal).toBe('300')
    expect(result.grandTotal).toBe('9300')
  })

  test('additionalGiaTotal preserves precision for large GIA values', () => {
    const rows = [
      {
        financialYear: 2025,
        assetReplacementAllowance: '10000000000000001',
        recovery: '10000000000000002'
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('assetReplacementAllowance', 'recovery')
    )
    expect(result.additionalGiaTotal).toBe('20000000000000003')
  })

  test('additionalGiaTotal is included in grandTotal', () => {
    const rows = [
      {
        financialYear: 2025,
        fcermGia: '1000',
        assetReplacementAllowance: '500'
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('fcermGia', 'assetReplacementAllowance')
    )
    expect(result.grandTotal).toBe('1500')
    expect(result.additionalGiaTotal).toBe('500')
  })
})

// ─── Input value variety (toBigInt coverage) ──────────────────────────────────

describe('computeFundingSourceTotals – input value variety', () => {
  test('accepts plain numeric string values', () => {
    const rows = [{ financialYear: 2025, fcermGia: '42000' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('42000')
  })

  test('accepts numeric number values (from legacy non-string rows)', () => {
    const rows = [{ financialYear: 2025, fcermGia: 42000 }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('42000')
  })

  test('currency-formatted strings (£1,000) are parsed correctly', () => {
    const rows = [{ financialYear: 2025, fcermGia: '£1,000' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('1000')
  })

  test('empty string values are treated as zero', () => {
    const rows = [{ financialYear: 2025, fcermGia: '' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('0')
  })

  test('"0" string values are treated as zero', () => {
    const rows = [{ financialYear: 2025, fcermGia: '0' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('0')
  })

  // ── toBigInt L44 branch: String(v).trim() is '' or '0' ──────────────────────

  test('whitespace-only string is treated as zero', () => {
    // String('   ').trim() === '' → !s is true → return 0n
    const rows = [{ financialYear: 2025, fcermGia: '   ' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('0')
  })

  test('whitespace-padded zero "  0  " is treated as zero', () => {
    // String('  0  ').trim() === '0' → s === '0' is true → return 0n
    const rows = [{ financialYear: 2025, fcermGia: '  0  ' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('0')
  })

  // ── toBigInt L49 branch: all non-digit characters, digits === '' ─────────────

  test('non-digit string (e.g. "n/a") is treated as zero', () => {
    // replaceAll(/\D/g, '') on 'n/a' produces '' → !digits is true → return 0n
    const rows = [{ financialYear: 2025, fcermGia: 'n/a' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('0')
  })

  // ── toBigInt L52 branch: negative value → isNegative ? -BigInt : BigInt ─────

  test('negative value string is preserved as a negative total', () => {
    // '-500' → isNegative=true, digits='500' → -500n
    const rows = [{ financialYear: 2025, fcermGia: '-500' }]
    const result = computeFundingSourceTotals(rows, active('fcermGia'))
    expect(result.sourceTotals.fcermGia).toBe('-500')
    expect(result.grandTotal).toBe('-500')
  })
})

// ─── Contributor array fallback ───────────────────────────────────────────────

describe('computeFundingSourceTotals – contributor array fallback', () => {
  test('falls back to publicContributors when publicContributions is all null/zero', () => {
    const rows = [
      {
        financialYear: 2025,
        publicContributions: null,
        publicContributors: [
          { name: 'Alice', amount: '1000' },
          { name: 'Bob', amount: '500' }
        ]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('publicContributions')
    )
    expect(result.sourceTotals.publicContributions).toBe('1500')
    expect(result.grandTotal).toBe('1500')
  })

  test('does NOT fall back when publicContributions has a non-zero value', () => {
    const rows = [
      {
        financialYear: 2025,
        publicContributions: '700',
        publicContributors: [{ name: 'A', amount: '999' }]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('publicContributions')
    )
    expect(result.sourceTotals.publicContributions).toBe('700')
  })

  test('falls back for privateContributors when privateContributions is all zero', () => {
    const rows = [
      {
        financialYear: 2025,
        privateContributions: '0',
        privateContributors: [{ name: 'B', amount: '200' }]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('privateContributions')
    )
    expect(result.sourceTotals.privateContributions).toBe('200')
  })

  test('falls back for otherEaContributors when otherEaContributions is all zero', () => {
    const rows = [
      {
        financialYear: 2025,
        otherEaContributions: null,
        otherEaContributors: [{ name: 'C', amount: '300' }]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('otherEaContributions')
    )
    expect(result.sourceTotals.otherEaContributions).toBe('300')
  })

  test('contributor fallback handles currency-formatted amounts', () => {
    const rows = [
      {
        financialYear: 2025,
        privateContributions: 0,
        privateContributors: [
          { name: 'A', amount: '£1,000' },
          { name: 'B', amount: '' }
        ]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('privateContributions')
    )
    expect(result.sourceTotals.privateContributions).toBe('1000')
  })

  test('contributor fallback sums across multiple rows', () => {
    const rows = [
      {
        financialYear: 2025,
        publicContributions: null,
        publicContributors: [{ name: 'Alice', amount: '1000' }]
      },
      {
        financialYear: 2026,
        publicContributions: null,
        publicContributors: [{ name: 'Alice', amount: '2000' }]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active('publicContributions')
    )
    expect(result.sourceTotals.publicContributions).toBe('3000')
    expect(result.yearTotals).toEqual(['1000', '2000'])
  })

  test('missing contributor array returns zero rather than throwing', () => {
    const rows = [{ financialYear: 2025, otherEaContributions: 0 }]
    const result = computeFundingSourceTotals(
      rows,
      active('otherEaContributions')
    )
    expect(result.sourceTotals.otherEaContributions).toBe('0')
  })

  test('all three contributor types fall back simultaneously', () => {
    const rows = [
      {
        financialYear: 2025,
        publicContributions: 0,
        privateContributions: 0,
        otherEaContributions: 0,
        publicContributors: [{ name: 'A', amount: '100' }],
        privateContributors: [{ name: 'B', amount: '200' }],
        otherEaContributors: [{ name: 'C', amount: '300' }]
      }
    ]
    const result = computeFundingSourceTotals(
      rows,
      active(
        'publicContributions',
        'privateContributions',
        'otherEaContributions'
      )
    )
    expect(result.sourceTotals.publicContributions).toBe('100')
    expect(result.sourceTotals.privateContributions).toBe('200')
    expect(result.sourceTotals.otherEaContributions).toBe('300')
    expect(result.grandTotal).toBe('600')
  })
})
