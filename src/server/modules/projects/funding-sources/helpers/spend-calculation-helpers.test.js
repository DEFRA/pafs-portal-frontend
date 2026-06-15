import { describe, it, expect } from 'vitest'
import {
  getRowValue,
  calculateServerTotals,
  checkContributorCoverage
} from './spend-calculation-helpers.js'

// ─── shared fixtures ────────────────────────────────────────────────────────

const YEAR_2025 = { value: 2025, label: '25/26' }
const YEAR_2026 = { value: 2026, label: '26/27' }
const YEARS = [YEAR_2025, YEAR_2026]

/** Minimal funding-value row for a given financial year */
function fvRow(year, extra = {}) {
  return { financialYear: year, ...extra }
}

// ─── getRowValue ────────────────────────────────────────────────────────────

describe('getRowValue', () => {
  describe('source rows', () => {
    const sourceRow = { kind: 'source', field: 'fcermGia' }

    it('returns the numeric value of a plain field', () => {
      expect(getRowValue(sourceRow, fvRow(2025, { fcermGia: 5000 }))).toBe(5000)
    })

    it('strips non-digit characters (formatted strings)', () => {
      expect(
        getRowValue(sourceRow, fvRow(2025, { fcermGia: '1,234,567' }))
      ).toBe(1234567)
    })

    it('returns 0 when the field is null', () => {
      expect(getRowValue(sourceRow, fvRow(2025, { fcermGia: null }))).toBe(0)
    })

    it('returns 0 when the field is undefined', () => {
      expect(getRowValue(sourceRow, fvRow(2025, {}))).toBe(0)
    })

    it('returns 0 when the field is an empty string', () => {
      expect(getRowValue(sourceRow, fvRow(2025, { fcermGia: '' }))).toBe(0)
    })

    it('returns 0 when the field is the string "0"', () => {
      expect(getRowValue(sourceRow, fvRow(2025, { fcermGia: '0' }))).toBe(0)
    })

    it('coerces a numeric string without formatting characters', () => {
      expect(getRowValue(sourceRow, fvRow(2025, { fcermGia: '9999' }))).toBe(
        9999
      )
    })
  })

  describe('contributor rows', () => {
    const contributorRow = {
      kind: 'contributor',
      contributorArrayField: 'publicContributors',
      contributorName: 'Acme Council'
    }

    it('returns the amount for the matching contributor', () => {
      const row = fvRow(2025, {
        publicContributors: [
          { name: 'Acme Council', amount: '2500' },
          { name: 'Beta LLC', amount: '1000' }
        ]
      })
      expect(getRowValue(contributorRow, row)).toBe(2500)
    })

    it('strips non-digit characters from contributor amount', () => {
      const row = fvRow(2025, {
        publicContributors: [{ name: 'Acme Council', amount: '£3,000' }]
      })
      expect(getRowValue(contributorRow, row)).toBe(3000)
    })

    it('returns 0 when the contributor name is not found', () => {
      const row = fvRow(2025, {
        publicContributors: [{ name: 'Other Name', amount: '5000' }]
      })
      expect(getRowValue(contributorRow, row)).toBe(0)
    })

    it('returns 0 when the contributor array is empty', () => {
      const row = fvRow(2025, { publicContributors: [] })
      expect(getRowValue(contributorRow, row)).toBe(0)
    })

    it('returns 0 when the contributor array field is absent', () => {
      expect(getRowValue(contributorRow, fvRow(2025, {}))).toBe(0)
    })

    it('returns 0 when the matching contributor amount is null', () => {
      const row = fvRow(2025, {
        publicContributors: [{ name: 'Acme Council', amount: null }]
      })
      expect(getRowValue(contributorRow, row)).toBe(0)
    })

    it('returns 0 when the matching contributor amount is undefined', () => {
      const row = fvRow(2025, {
        publicContributors: [{ name: 'Acme Council' }]
      })
      expect(getRowValue(contributorRow, row)).toBe(0)
    })
  })

  describe('unknown row kind', () => {
    it('returns 0 for an unrecognised kind', () => {
      expect(getRowValue({ kind: 'group-heading' }, fvRow(2025, {}))).toBe(0)
    })
  })
})

// ─── calculateServerTotals ──────────────────────────────────────────────────

describe('calculateServerTotals', () => {
  describe('single source row, single year', () => {
    it('calculates row total, column total, and grand total', () => {
      const spendRows = [{ kind: 'source', field: 'fcermGia' }]
      const existingValues = [fvRow(2025, { fcermGia: '1000' })]

      const { rowTotals, colTotals, grandTotal } = calculateServerTotals(
        spendRows,
        existingValues,
        [YEAR_2025]
      )

      expect(rowTotals['fcermGia']).toBe('1000')
      expect(colTotals).toEqual(['1000'])
      expect(grandTotal).toBe('1000')
    })
  })

  describe('multiple source rows, multiple years', () => {
    it('sums across years for each row and across rows for each column', () => {
      const spendRows = [
        { kind: 'source', field: 'fcermGia' },
        { kind: 'source', field: 'localLevy' }
      ]
      const existingValues = [
        fvRow(2025, { fcermGia: '1000', localLevy: '500' }),
        fvRow(2026, { fcermGia: '2000', localLevy: '300' })
      ]

      const { rowTotals, colTotals, grandTotal } = calculateServerTotals(
        spendRows,
        existingValues,
        YEARS
      )

      expect(rowTotals['fcermGia']).toBe('3000') // 1000 + 2000
      expect(rowTotals['localLevy']).toBe('800') // 500 + 300
      expect(colTotals[0]).toBe('1500') // 1000 + 500
      expect(colTotals[1]).toBe('2300') // 2000 + 300
      expect(grandTotal).toBe('3800')
    })
  })

  describe('contributor rows', () => {
    it('uses contributorArrayField-contributorIndex as the row key', () => {
      const spendRows = [
        {
          kind: 'contributor',
          contributorArrayField: 'publicContributors',
          contributorName: 'Acme Council',
          contributorIndex: 0
        }
      ]
      const existingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Acme Council', amount: '4000' }]
        })
      ]

      const { rowTotals, colTotals, grandTotal } = calculateServerTotals(
        spendRows,
        existingValues,
        [YEAR_2025]
      )

      expect(rowTotals['publicContributors-0']).toBe('4000')
      expect(colTotals[0]).toBe('4000')
      expect(grandTotal).toBe('4000')
    })

    it('sums the same contributor across multiple years', () => {
      const spendRows = [
        {
          kind: 'contributor',
          contributorArrayField: 'publicContributors',
          contributorName: 'Acme Council',
          contributorIndex: 0
        }
      ]
      const existingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Acme Council', amount: '1000' }]
        }),
        fvRow(2026, {
          publicContributors: [{ name: 'Acme Council', amount: '2000' }]
        })
      ]

      const { rowTotals } = calculateServerTotals(
        spendRows,
        existingValues,
        YEARS
      )

      expect(rowTotals['publicContributors-0']).toBe('3000')
    })

    it('returns 0 when the contributor name is absent in a year', () => {
      const spendRows = [
        {
          kind: 'contributor',
          contributorArrayField: 'publicContributors',
          contributorName: 'Missing Corp',
          contributorIndex: 0
        }
      ]
      const existingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Other Name', amount: '5000' }]
        })
      ]

      const { rowTotals, grandTotal } = calculateServerTotals(
        spendRows,
        existingValues,
        [YEAR_2025]
      )

      expect(rowTotals['publicContributors-0']).toBe('0')
      expect(grandTotal).toBe('0')
    })
  })

  describe('group-heading rows', () => {
    it('skips group-heading rows and does not add them to rowTotals', () => {
      const spendRows = [
        { kind: 'group-heading', label: 'Public Sector' },
        { kind: 'source', field: 'fcermGia' }
      ]
      const existingValues = [fvRow(2025, { fcermGia: '100' })]

      const { rowTotals } = calculateServerTotals(spendRows, existingValues, [
        YEAR_2025
      ])

      expect(Object.keys(rowTotals)).not.toContain('label')
      expect(Object.keys(rowTotals)).not.toContain('group-heading')
      expect(rowTotals['fcermGia']).toBe('100')
    })
  })

  describe('missing financial year rows', () => {
    it('treats a missing year row as 0 for that column', () => {
      const spendRows = [{ kind: 'source', field: 'fcermGia' }]
      // existingValues only has 2025, not 2026
      const existingValues = [fvRow(2025, { fcermGia: '500' })]

      const { rowTotals, colTotals, grandTotal } = calculateServerTotals(
        spendRows,
        existingValues,
        YEARS
      )

      expect(rowTotals['fcermGia']).toBe('500')
      expect(colTotals[0]).toBe('500')
      expect(colTotals[1]).toBe('0')
      expect(grandTotal).toBe('500')
    })
  })

  describe('empty inputs', () => {
    it('returns empty rowTotals, zero colTotals, and zero grandTotal for no rows', () => {
      const { rowTotals, colTotals, grandTotal } = calculateServerTotals(
        [],
        [],
        YEARS
      )

      expect(rowTotals).toEqual({})
      expect(colTotals).toEqual(['0', '0'])
      expect(grandTotal).toBe('0')
    })

    it('returns zero totals when existingValues is empty', () => {
      const spendRows = [{ kind: 'source', field: 'fcermGia' }]

      const { rowTotals, colTotals, grandTotal } = calculateServerTotals(
        spendRows,
        [],
        YEARS
      )

      expect(rowTotals['fcermGia']).toBe('0')
      expect(colTotals).toEqual(['0', '0'])
      expect(grandTotal).toBe('0')
    })
  })

  describe('large values (BigInt precision)', () => {
    it('handles values that exceed Number safe integer range without rounding', () => {
      // 9_007_199_254_740_993 is Number.MAX_SAFE_INTEGER + 2 — rounds in Number
      const spendRows = [{ kind: 'source', field: 'fcermGia' }]
      const existingValues = [fvRow(2025, { fcermGia: '9007199254740993' })]

      const { grandTotal } = calculateServerTotals(spendRows, existingValues, [
        YEAR_2025
      ])

      expect(grandTotal).toBe('9007199254740993')
    })

    it('sums two large values without loss of precision', () => {
      const spendRows = [
        { kind: 'source', field: 'fcermGia' },
        { kind: 'source', field: 'localLevy' }
      ]
      const existingValues = [
        fvRow(2025, {
          fcermGia: '9007199254740993',
          localLevy: '9007199254740993'
        })
      ]

      const { grandTotal } = calculateServerTotals(spendRows, existingValues, [
        YEAR_2025
      ])

      expect(grandTotal).toBe('18014398509481986')
    })
  })

  describe('string formatting in field values', () => {
    it('strips commas and non-digit characters before summing', () => {
      const spendRows = [{ kind: 'source', field: 'fcermGia' }]
      const existingValues = [fvRow(2025, { fcermGia: '1,000,000' })]

      const { grandTotal } = calculateServerTotals(spendRows, existingValues, [
        YEAR_2025
      ])

      expect(grandTotal).toBe('1000000')
    })

    it('treats null field values as 0', () => {
      const spendRows = [{ kind: 'source', field: 'fcermGia' }]
      const existingValues = [fvRow(2025, { fcermGia: null })]

      const { grandTotal } = calculateServerTotals(spendRows, existingValues, [
        YEAR_2025
      ])

      expect(grandTotal).toBe('0')
    })
  })
})

// ─── checkContributorCoverage ────────────────────────────────────────────────

describe('checkContributorCoverage', () => {
  // The PUBLIC_CONTRIBUTIONS group is the first in CONTRIBUTOR_SPEND_GROUPS.
  // sessionKey for public contributors is '_publicContributorsSession'.

  describe('when no contributor groups are enabled', () => {
    it('returns null', () => {
      const sessionData = {
        publicContributions: false,
        privateContributions: false,
        otherEaContributions: false
      }
      expect(checkContributorCoverage(sessionData, [])).toBeNull()
    })
  })

  describe('when a contributor group is enabled with session names', () => {
    it('returns null when every contributor has at least one amount', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council', 'Beta Ltd']
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [
            { name: 'Acme Council', amount: '1000' },
            { name: 'Beta Ltd', amount: '500' }
          ]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBeNull()
    })

    it('returns the error key when a contributor has no amount across any year', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council', 'Beta Ltd']
      }
      const fundingValues = [
        fvRow(2025, {
          // Beta Ltd has no entry at all
          publicContributors: [{ name: 'Acme Council', amount: '1000' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })

    it('returns the error key when a contributor amount is empty string', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council']
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Acme Council', amount: '' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })

    it('returns the error key when a contributor amount is the string "0"', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council']
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Acme Council', amount: '0' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })

    it('returns the error key when a contributor amount is null', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council']
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Acme Council', amount: null }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })

    it('passes when the contributor has a non-zero amount in at least one year', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council']
      }
      // Year 2025 has 0, year 2026 has a real value — should still pass
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Acme Council', amount: '0' }]
        }),
        fvRow(2026, {
          publicContributors: [{ name: 'Acme Council', amount: '5000' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBeNull()
    })
  })

  describe('when a contributor group is enabled with DB fallback names', () => {
    it('returns null when the DB contributor has coverage', () => {
      const sessionData = {
        publicContributions: true,
        // No session key — falls back to pafs_core_funding_contributors
        pafs_core_funding_contributors: [
          { name: 'DB Corp', contributorType: 'public_contributions' }
        ]
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'DB Corp', amount: '7500' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBeNull()
    })

    it('returns the error key when the DB contributor has no coverage', () => {
      const sessionData = {
        publicContributions: true,
        pafs_core_funding_contributors: [
          { name: 'DB Corp', contributorType: 'public_contributions' }
        ]
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'DB Corp', amount: null }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })
  })

  describe('multiple contributor groups', () => {
    it('returns null only when all enabled groups are fully covered', () => {
      const sessionData = {
        publicContributions: true,
        privateContributions: true,
        _publicContributorsSession: ['Pub A'],
        _privateContributorsSession: ['Priv B']
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Pub A', amount: '1000' }],
          privateContributors: [{ name: 'Priv B', amount: '2000' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBeNull()
    })

    it('returns error key when first group is uncovered even if second is covered', () => {
      const sessionData = {
        publicContributions: true,
        privateContributions: true,
        _publicContributorsSession: ['Pub A'],
        _privateContributorsSession: ['Priv B']
      }
      const fundingValues = [
        fvRow(2025, {
          // Pub A has no amount — fails
          publicContributors: [{ name: 'Pub A', amount: null }],
          privateContributors: [{ name: 'Priv B', amount: '2000' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })

    it('returns error key when second group is uncovered but first is covered', () => {
      const sessionData = {
        publicContributions: true,
        privateContributions: true,
        _publicContributorsSession: ['Pub A'],
        _privateContributorsSession: ['Priv B']
      }
      const fundingValues = [
        fvRow(2025, {
          publicContributors: [{ name: 'Pub A', amount: '1000' }],
          // Priv B has no entry — fails
          privateContributors: []
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })

    it('skips disabled groups even when the array has entries', () => {
      const sessionData = {
        publicContributions: false, // disabled — skip even if array present
        privateContributions: true,
        _publicContributorsSession: ['Pub A'],
        _privateContributorsSession: ['Priv B']
      }
      const fundingValues = [
        fvRow(2025, {
          // Pub A has no amount but the group is disabled — should not trigger error
          publicContributors: [{ name: 'Pub A', amount: null }],
          privateContributors: [{ name: 'Priv B', amount: '2000' }]
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBeNull()
    })
  })

  describe('contributor array is not an array', () => {
    it('treats non-array contributor field as uncovered', () => {
      const sessionData = {
        publicContributions: true,
        _publicContributorsSession: ['Acme Council']
      }
      const fundingValues = [
        fvRow(2025, {
          // Malformed — not an array
          publicContributors: null
        })
      ]

      expect(checkContributorCoverage(sessionData, fundingValues)).toBe(
        'projects.funding_sources.estimated_spend.errors.required'
      )
    })
  })

  describe('no session names and no DB contributors', () => {
    it('returns null when the enabled group has no contributor names at all', () => {
      // If no names, every() over an empty array returns true (vacuous truth)
      const sessionData = {
        publicContributions: true
        // No session key, no pafs_core_funding_contributors
      }

      expect(checkContributorCoverage(sessionData, [])).toBeNull()
    })
  })
})
