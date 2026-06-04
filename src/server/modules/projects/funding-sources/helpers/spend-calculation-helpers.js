import { PROJECT_PAYLOAD_FIELDS } from '../../../../common/constants/projects.js'
import {
  getContributorNames,
  CONTRIBUTOR_SPEND_GROUPS
} from './estimated-spending-helpers.js'

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
 * Extract a cell value as BigInt directly from string data, bypassing Number
 * conversion so values with 16+ significant digits are not rounded.
 * @private
 */
function _toBigIntCellValue(row, fvRow) {
  let digits
  if (row.kind === 'source') {
    digits = String(fvRow[row.field] || '').replaceAll(/\D/g, '')
  } else if (row.kind === 'contributor') {
    const items = fvRow[row.contributorArrayField] || []
    const match = items.find((c) => c.name === row.contributorName)
    digits = String(match?.amount || '').replaceAll(/\D/g, '')
  } else {
    return 0n
  }
  return digits ? BigInt(digits) : 0n
}

/**
 * Calculate row totals, column totals, and grand total server-side
 * for no-JS rendering.
 * @param {Array} spendRows
 * @param {Array} existingValues
 * @param {Array} financialYears
 * @returns {{ rowTotals: object, colTotals: string[], grandTotal: string }}
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

      const val = _toBigIntCellValue(row, fvRow)
      rowTotal += val
      colTotalsBig[colIdx] += val
    }

    rowTotals[rowKey] = rowTotal.toString()
  }

  const grandTotalBig = colTotalsBig.reduce((sum, ct) => sum + ct, 0n)
  const colTotals = colTotalsBig.map((v) => v.toString())
  const grandTotal = grandTotalBig.toString()

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
