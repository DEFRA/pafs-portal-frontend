import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import {
  buildIdToYearMap,
  buildContributorsByYear,
  getCurrentFinancialYearStartYear
} from '../../helpers/project-utils.js'

// ─── Constants ──────────────────────────────────────────────────────────────

/**
 * Map from funding value camelCase keys to PROJECT_PAYLOAD_FIELDS constants.
 * @private
 */
export const FUNDING_VALUE_FIELD_MAP = [
  ['fcermGia', PROJECT_PAYLOAD_FIELDS.FCERM_GIA],
  ['localLevy', PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY],
  ['publicContributions', PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS],
  ['privateContributions', PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS],
  ['otherEaContributions', PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS],
  ['notYetIdentified', PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED],
  [
    'assetReplacementAllowance',
    PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE
  ],
  [
    'environmentStatutoryFunding',
    PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING
  ],
  [
    'frequentlyFloodedCommunities',
    PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES
  ],
  [
    'otherAdditionalGrantInAid',
    PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID
  ],
  [
    'otherGovernmentDepartment',
    PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT
  ],
  ['recovery', PROJECT_PAYLOAD_FIELDS.RECOVERY],
  ['summerEconomicFund', PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND]
]

/**
 * Contributor type → row array key mapping.
 * @private
 */
const CONTRIBUTOR_TYPE_TO_KEY = {
  public_contributions: 'publicContributors',
  private_contributions: 'privateContributors',
  other_ea_contributions: 'otherEaContributors'
}

// ─── Helper functions ───────────────────────────────────────────────────────

/**
 * Categorise a flat array of contributors into typed groups.
 * @private
 */
function categoriseContributors(yearContributors) {
  const groups = {
    publicContributors: [],
    privateContributors: [],
    otherEaContributors: []
  }

  for (const c of yearContributors) {
    const entry = {
      name: c.name,
      contributorType: c.contributorType,
      amount: c.amount == null ? '' : String(c.amount)
    }
    const key = CONTRIBUTOR_TYPE_TO_KEY[c.contributorType]
    if (key) {
      groups[key].push(entry)
    }
  }

  return groups
}

/**
 * Build a single funding value row with contributor arrays merged in.
 * @private
 */
function buildFundingValueRow(fv, contributorsByYear) {
  const row = { financialYear: Number(fv.financialYear) }

  for (const [srcKey, payloadField] of FUNDING_VALUE_FIELD_MAP) {
    row[payloadField] = fv[srcKey] || null
  }

  const yearContributors = contributorsByYear[String(row.financialYear)] || []
  const groups = categoriseContributors(yearContributors)

  for (const [key, arr] of Object.entries(groups)) {
    if (arr.length) {
      row[key] = arr
    }
  }

  return row
}

/**
 * Ensure the funding value rows cover every year from startYear to endYear.
 * Inserts empty placeholder rows (with just financialYear) for missing years.
 * @private
 */
function fillMissingYearRows(rows, startYear, endYear) {
  if (!startYear || !endYear || startYear > endYear) {
    return rows
  }

  const existingYears = new Set(rows.map((r) => Number(r.financialYear)))
  const filled = [...rows]

  for (let y = startYear; y <= endYear; y++) {
    if (!existingYears.has(y)) {
      filled.push({ financialYear: y })
    }
  }

  return filled.toSorted(
    (a, b) => Number(a.financialYear) - Number(b.financialYear)
  )
}

/**
 * Resolve safe start / end financial years from session data.
 * Falls back to the current financial year when values are missing or invalid.
 * @param {object} sessionData
 * @returns {{ startYear: number, endYear: number }}
 */
export function resolveSafeFinancialYears(sessionData) {
  let startYear = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR] || 0
  )
  let endYear = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR] || 0
  )

  if (!startYear || startYear <= 0) {
    startYear = getCurrentFinancialYearStartYear()
  }
  if (!endYear || endYear <= 0) {
    endYear = startYear
  }

  return { startYear, endYear }
}

/**
 * Merge flat pafs_core_funding_values rows with pafs_core_funding_contributors
 * into the combined fundingValues format used by the form and upsert payload.
 * @private
 */
function buildFundingValuesFromProjectData(sessionData) {
  const dbValues = sessionData.pafs_core_funding_values || []
  const dbContributors = sessionData.pafs_core_funding_contributors || []

  const { startYear, endYear } = resolveSafeFinancialYears(sessionData)

  // Check whether project has explicitly set both boundaries
  const rawStart = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR] || 0
  )
  const rawEnd = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR] || 0
  )
  const hasExplicitRange = rawStart > 0 && rawEnd > 0

  if (!dbValues.length && !startYear) {
    return []
  }

  const sortedValues = [...dbValues].toSorted(
    (a, b) => Number(a.financialYear) - Number(b.financialYear)
  )

  const referencedIds = new Set(
    dbContributors.map((c) => String(c.fundingValueId)).filter(Boolean)
  )

  const idToYear = buildIdToYearMap(sortedValues, referencedIds)
  const contributorsByYear = buildContributorsByYear(dbContributors, idToYear)

  let rows = sortedValues.map((fv) =>
    buildFundingValueRow(fv, contributorsByYear)
  )

  // Filter out years outside the financial year range (legacy data may have stale rows)
  // Only filter when the project has explicitly set both boundaries
  if (hasExplicitRange) {
    rows = rows.filter(
      (r) => r.financialYear >= startYear && r.financialYear <= endYear
    )
  }

  return fillMissingYearRows(rows, startYear, endYear)
}

/**
 * Load the estimated spend values — prefer session, then fall back to
 * building from the raw project data.
 * @param {object} sessionData
 * @returns {Array}
 */
export function loadEstimatedSpendValues(sessionData) {
  const sessionFv = sessionData[PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]
  if (Array.isArray(sessionFv) && sessionFv.length) {
    return sessionFv
  }
  return buildFundingValuesFromProjectData(sessionData)
}
