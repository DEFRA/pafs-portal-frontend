import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import { getContributorNames } from './estimated-spending-helpers.js'
import { CONTRIBUTOR_SPEND_GROUPS } from './estimated-spending-helpers.js'

// ─── Row value extraction ───────────────────────────────────────────────────

/**
 * Extract a numeric value from a spend row for a given funding value row.
 * @param {object} row - A spend row descriptor (kind: 'source' | 'contributor').
 * @param {object} fvRow - A funding value row from session data.
 * @returns {number}
 */
export function getRowValue(row, fvRow) {
  if (row.kind === 'source') {
    return (
      Number.parseInt(
        String(fvRow[row.field] || '0').replaceAll(/\D/g, ''),
        10
      ) || 0
    )
  }
  if (row.kind === 'contributor') {
    const items = fvRow[row.contributorArrayField] || []
    const match = items.find((c) => c.name === row.contributorName)
    return (
      Number.parseInt(String(match?.amount || '0').replaceAll(/\D/g, ''), 10) ||
      0
    )
  }
  return 0
}

// ─── Server-side totals ─────────────────────────────────────────────────────

/**
 * Calculate row totals, column totals, and grand total server-side
 * for no-JS rendering.
 * @param {Array} spendRows
 * @param {Array} existingValues
 * @param {Array} financialYears
 * @returns {{ rowTotals: object, colTotals: number[], grandTotal: number }}
 */
export function calculateServerTotals(
  spendRows,
  existingValues,
  financialYears
) {
  const colTotalsBig = Array.from({ length: financialYears.length }, () => 0n)
  const rowTotals = {}

  for (const row of spendRows) {
    if (row.kind === 'group-heading') {
      continue
    }

    const rowKey =
      row.kind === 'contributor'
        ? `${row.contributorArrayField}-${row.contributorIndex}`
        : row.field
    let rowTotal = 0n

    for (let colIdx = 0; colIdx < financialYears.length; colIdx++) {
      const year = financialYears[colIdx].value
      const fvRow = existingValues.find(
        (r) => Number(r[PROJECT_PAYLOAD_FIELDS.FINANCIAL_YEAR]) === year
      )
      if (!fvRow) {
        continue
      }

      const val = BigInt(
        Number.parseInt(
          String(getRowValue(row, fvRow) || '0').replaceAll(/\D/g, '') || '0',
          10
        ) || 0
      )
      rowTotal += val
      colTotalsBig[colIdx] += val
    }

    // Store as regular number for Nunjucks template rendering
    rowTotals[rowKey] = Number(rowTotal)
  }

  const colTotals = colTotalsBig.map(Number)
  const grandTotal = colTotals.reduce((sum, ct) => sum + ct, 0)

  return { rowTotals, colTotals, grandTotal }
}

// ─── Contributor coverage checking ──────────────────────────────────────────

/**
 * Check whether a single contributor name has at least one non-empty amount
 * across all funding value rows.
 * @private
 */
function hasContributorAmount(fundingValues, contributorArrayField, name) {
  return fundingValues.some((row) => {
    const contributors = row[contributorArrayField]
    if (!Array.isArray(contributors)) {
      return false
    }
    return contributors.some(
      (c) =>
        c.name === name &&
        c.amount != null &&
        c.amount !== '' &&
        c.amount !== '0'
    )
  })
}

/**
 * Check whether a single contributor group has full amount coverage.
 * Returns true if every named contributor has at least one non-empty amount.
 * @private
 */
function isGroupFullyCovered(sessionData, fundingValues, group) {
  const names = getContributorNames(sessionData, group)
  return names.every((name) =>
    hasContributorAmount(fundingValues, group.contributorArrayField, name)
  )
}

/**
 * Verify every named contributor in enabled groups has at least one amount.
 * @param {object} sessionData
 * @param {Array} fundingValues
 * @returns {string|null} Error translation key or null.
 */
export function checkContributorCoverage(sessionData, fundingValues) {
  for (const group of CONTRIBUTOR_SPEND_GROUPS) {
    if (!sessionData[group.enabledField]) {
      continue
    }
    if (!isGroupFullyCovered(sessionData, fundingValues, group)) {
      return 'projects.funding_sources.estimated_spend.errors.required'
    }
  }
  return null
}
