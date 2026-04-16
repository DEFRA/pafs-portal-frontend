import { describe, it, expect } from 'vitest'
import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import {
  getContributorNames,
  buildEstimatedSpendRows,
  getSelectedEstimatedSpendSourceFields,
  localizeContributorErrorMessage
} from './estimated-spending-helpers.js'

// ─── getContributorNames ─────────────────────────────────────────────────────

describe('getContributorNames', () => {
  const group = {
    sessionKey: '_publicContributorsSession',
    namesField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES
  }

  it('returns names from session array when present', () => {
    const sessionData = { _publicContributorsSession: ['Alice', 'Bob', ''] }
    const result = getContributorNames(sessionData, group)
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('trims names from session array', () => {
    const sessionData = { _publicContributorsSession: ['  Alice  ', ' Bob'] }
    const result = getContributorNames(sessionData, group)
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('falls back to CSV field when session array is empty', () => {
    const sessionData = {
      _publicContributorsSession: [],
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'Alice, Bob, Charlie'
    }
    const result = getContributorNames(sessionData, group)
    expect(result).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('returns empty array when session array is missing and CSV is absent', () => {
    const result = getContributorNames({}, group)
    expect(result).toEqual([])
  })

  it('returns empty array when CSV is an empty string', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: '   '
    }
    const result = getContributorNames(sessionData, group)
    expect(result).toEqual([])
  })

  it('filters out empty names after trimming CSV', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'Alice,,Bob'
    }
    const result = getContributorNames(sessionData, group)
    expect(result).toEqual(['Alice', 'Bob'])
  })

  it('prefers session array over CSV even when array has only empty strings', () => {
    // Empty session array → should fall through to CSV
    const sessionData = {
      _publicContributorsSession: [],
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES]: 'CSV Name'
    }
    const result = getContributorNames(sessionData, group)
    // session array is empty ([]) so falls through to CSV
    expect(result).toEqual(['CSV Name'])
  })
})

// ─── buildEstimatedSpendRows ──────────────────────────────────────────────────────────

describe('buildEstimatedSpendRows', () => {
  const t = (key) => key // identity translator

  it('returns empty array when no sources selected', () => {
    const result = buildEstimatedSpendRows({}, t)
    expect(result).toEqual([])
  })

  it('includes a source row for fcermGia when selected', () => {
    const sessionData = { [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: true }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows).toHaveLength(1)
    expect(rows[0]).toEqual({
      kind: 'source',
      field: PROJECT_PAYLOAD_FIELDS.FCERM_GIA,
      label: 'projects.overview.funding_sources_summary_card.gia'
    })
  })

  it('includes a source row for localLevy when selected', () => {
    const sessionData = { [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: true }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows[0].field).toBe(PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY)
  })

  it('does not include additionalGia sources that are not selected', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]: false
    }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows).toHaveLength(0)
  })

  it('includes additionalGia source row when selected', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]: true
    }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows).toHaveLength(1)
    expect(rows[0].kind).toBe('source')
    expect(rows[0].field).toBe(
      PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE
    )
  })

  it('includes group-heading and contributor rows for publicContributions with names', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
      _publicContributorsSession: ['Alice', 'Bob']
    }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows[0].kind).toBe('group-heading')
    expect(rows[1].kind).toBe('contributor')
    expect(rows[1].contributorName).toBe('Alice')
    expect(rows[1].contributorIndex).toBe(0)
    expect(rows[2].kind).toBe('contributor')
    expect(rows[2].contributorName).toBe('Bob')
    expect(rows[2].contributorIndex).toBe(1)
  })

  it('falls back to plain source row for publicContributions when no names', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true
      // no session names, no CSV
    }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows).toHaveLength(1)
    expect(rows[0].kind).toBe('source')
    expect(rows[0].field).toBe(PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS)
  })

  it('assigns correct contributorArrayField for contributor rows', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true,
      _privateContributorsSession: ['Corp A']
    }
    const rows = buildEstimatedSpendRows(sessionData, t)
    const contributorRow = rows.find((r) => r.kind === 'contributor')
    expect(contributorRow.contributorArrayField).toBe('privateContributors')
    expect(contributorRow.contributorType).toBe('private_contributions')
  })

  it('includes all active sources in order', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: true,
      [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: true,
      [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: true
    }
    const rows = buildEstimatedSpendRows(sessionData, t)
    expect(rows).toHaveLength(3)
    expect(rows[0].field).toBe(PROJECT_PAYLOAD_FIELDS.FCERM_GIA)
    expect(rows[1].field).toBe(PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY)
    expect(rows[2].field).toBe(PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED)
  })
})

// ─── getSelectedEstimatedSpendSourceFields ────────────────────────────────────────────

describe('getSelectedEstimatedSpendSourceFields', () => {
  it('returns empty array when no sources selected', () => {
    expect(getSelectedEstimatedSpendSourceFields({})).toEqual([])
  })

  it('includes fcermGia when selected', () => {
    const sessionData = { [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: true }
    const result = getSelectedEstimatedSpendSourceFields(sessionData)
    expect(result).toContain(PROJECT_PAYLOAD_FIELDS.FCERM_GIA)
  })

  it('excludes contributor source fields even when selected', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]: true,
      [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]: true,
      [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]: true
    }
    const result = getSelectedEstimatedSpendSourceFields(sessionData)
    expect(result).not.toContain(PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS)
    expect(result).not.toContain(PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS)
    expect(result).not.toContain(PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS)
  })

  it('includes additional GIA sources when selected', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]: true,
      [PROJECT_PAYLOAD_FIELDS.RECOVERY]: true
    }
    const result = getSelectedEstimatedSpendSourceFields(sessionData)
    expect(result).toContain(PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE)
    expect(result).toContain(PROJECT_PAYLOAD_FIELDS.RECOVERY)
  })

  it('excludes sources that are falsy', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: false,
      [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: null,
      [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: undefined
    }
    const result = getSelectedEstimatedSpendSourceFields(sessionData)
    expect(result).toEqual([])
  })

  it('returns multiple selected fields in order', () => {
    const sessionData = {
      [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: true,
      [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: true,
      [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: true
    }
    const result = getSelectedEstimatedSpendSourceFields(sessionData)
    expect(result[0]).toBe(PROJECT_PAYLOAD_FIELDS.FCERM_GIA)
    expect(result[1]).toBe(PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY)
    expect(result[result.length - 1]).toBe(
      PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED
    )
  })
})

// ─── localizeContributorErrorMessage ─────────────────────────────────────────

describe('localizeContributorErrorMessage', () => {
  const t = (key) => `[${key}]`

  it('translates PUBLIC_SECTOR_CONTRIBUTORS_REQUIRED', () => {
    const result = localizeContributorErrorMessage(
      'PUBLIC_SECTOR_CONTRIBUTORS_REQUIRED',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.required]'
    )
  })

  it('translates PRIVATE_SECTOR_CONTRIBUTORS_REQUIRED', () => {
    const result = localizeContributorErrorMessage(
      'PRIVATE_SECTOR_CONTRIBUTORS_REQUIRED',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.required]'
    )
  })

  it('translates OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_REQUIRED', () => {
    const result = localizeContributorErrorMessage(
      'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_REQUIRED',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.required]'
    )
  })

  it('translates PUBLIC_SECTOR_CONTRIBUTORS_INVALID', () => {
    const result = localizeContributorErrorMessage(
      'PUBLIC_SECTOR_CONTRIBUTORS_INVALID',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.invalid]'
    )
  })

  it('translates PRIVATE_SECTOR_CONTRIBUTORS_INVALID', () => {
    const result = localizeContributorErrorMessage(
      'PRIVATE_SECTOR_CONTRIBUTORS_INVALID',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.invalid]'
    )
  })

  it('translates OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_INVALID', () => {
    const result = localizeContributorErrorMessage(
      'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_INVALID',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.invalid]'
    )
  })

  it('translates PUBLIC_SECTOR_CONTRIBUTORS_DUPLICATE', () => {
    const result = localizeContributorErrorMessage(
      'PUBLIC_SECTOR_CONTRIBUTORS_DUPLICATE',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.duplicate]'
    )
  })

  it('translates PRIVATE_SECTOR_CONTRIBUTORS_DUPLICATE', () => {
    const result = localizeContributorErrorMessage(
      'PRIVATE_SECTOR_CONTRIBUTORS_DUPLICATE',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.duplicate]'
    )
  })

  it('translates OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DUPLICATE', () => {
    const result = localizeContributorErrorMessage(
      'OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DUPLICATE',
      t
    )
    expect(result).toBe(
      '[projects.funding_sources.contributors.errors.duplicate]'
    )
  })

  it('returns the raw message unchanged for unknown codes', () => {
    const result = localizeContributorErrorMessage('SOME_UNKNOWN_ERROR', t)
    expect(result).toBe('SOME_UNKNOWN_ERROR')
  })
})
