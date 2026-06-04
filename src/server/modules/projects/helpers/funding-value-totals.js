const FUNDING_AMOUNT_FIELDS = [
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

// Maps contributor array field → the corresponding source total field.
// Used to derive contributor totals from the per-contributor arrays when
// the legacy system stored amounts only in pafs_core_funding_contributors.
const CONTRIBUTOR_ARRAY_TO_SOURCE = {
  publicContributors: 'publicContributions',
  privateContributors: 'privateContributions',
  otherEaContributors: 'otherEaContributions'
}

// These are the sub-source fields grouped under "Additional FCRM Grant-in-Aid"
// in the overview summary table.  Pre-computing their combined total in JS
// avoids Nunjucks doing string + string arithmetic (which concatenates).
const ADDITIONAL_GIA_FIELDS = [
  'assetReplacementAllowance',
  'environmentStatutoryFunding',
  'frequentlyFloodedCommunities',
  'otherAdditionalGrantInAid',
  'otherGovernmentDepartment',
  'recovery',
  'summerEconomicFund'
]

function toBigInt(v) {
  if (v == null || v === '' || v === 0 || v === '0') {
    return 0n
  }
  const s = String(v).trim()
  if (!s || s === '0') {
    return 0n
  }
  const isNegative = s.startsWith('-')
  const digits = s.replaceAll(/\D/g, '')
  if (!digits) {
    return 0n
  }
  return isNegative ? -BigInt(digits) : BigInt(digits)
}

function hasFundingValueData(processedRows, field) {
  return processedRows.some(
    (row) => row[field] != null && Number(row[field]) !== 0
  )
}

function sumContributorArray(row, arrayField) {
  const items = row[arrayField]
  if (!Array.isArray(items)) {
    return 0n
  }
  return items.reduce((sum, c) => sum + toBigInt(c.amount), 0n)
}

function buildContributorFallbacks(activeFields, processedRows) {
  const fallbacks = new Map()
  for (const [arrayField, sourceField] of Object.entries(
    CONTRIBUTOR_ARRAY_TO_SOURCE
  )) {
    if (
      activeFields.includes(sourceField) &&
      !hasFundingValueData(processedRows, sourceField)
    ) {
      fallbacks.set(sourceField, arrayField)
    }
  }
  return fallbacks
}

function accumulateYearTotals(
  processedRows,
  activeFields,
  contributorFallbacks,
  sourceTotalsBig
) {
  return processedRows.map((row) => {
    let yearTotal = 0n
    for (const field of activeFields) {
      const val = contributorFallbacks.has(field)
        ? sumContributorArray(row, contributorFallbacks.get(field))
        : toBigInt(row[field])
      sourceTotalsBig[field] += val
      yearTotal += val
    }
    return yearTotal
  })
}

function sumContributorsByName(processedRows, arrayField) {
  const nameMap = {}
  for (const row of processedRows) {
    const items = Array.isArray(row[arrayField]) ? row[arrayField] : []
    for (const c of items) {
      if (c.name) {
        nameMap[c.name] = (nameMap[c.name] || 0n) + toBigInt(c.amount)
      }
    }
  }
  return Object.fromEntries(
    Object.entries(nameMap).map(([name, total]) => [name, total.toString()])
  )
}

function buildContributorRowTotals(processedRows) {
  return Object.fromEntries(
    Object.keys(CONTRIBUTOR_ARRAY_TO_SOURCE).map((arrayField) => [
      arrayField,
      sumContributorsByName(processedRows, arrayField)
    ])
  )
}

/**
 * Pre-compute all totals needed by the funding sources overview card.
 * Uses BigInt arithmetic to preserve full precision for values with 16+
 * significant digits (beyond IEEE 754 Number safe range).
 * Returns all totals as strings — formatNumberWithCommas handles strings
 * correctly and Nunjucks > 0 comparisons coerce strings safely.
 *
 * @param {Array} processedRows - Output of buildProcessedFundingValues
 * @param {Object} projectData - Project session data (boolean flags per source)
 * @returns {{ sourceTotals: Object, yearTotals: string[], grandTotal: string, additionalGiaTotal: string, contributorRowTotals: Object }}
 */
export function computeFundingSourceTotals(processedRows, projectData = {}) {
  const activeFields = FUNDING_AMOUNT_FIELDS.filter((field) =>
    Boolean(projectData[field])
  )
  const contributorFallbacks = buildContributorFallbacks(
    activeFields,
    processedRows
  )
  const sourceTotalsBig = Object.fromEntries(
    FUNDING_AMOUNT_FIELDS.map((f) => [f, 0n])
  )
  const yearTotalsBig = accumulateYearTotals(
    processedRows,
    activeFields,
    contributorFallbacks,
    sourceTotalsBig
  )
  const grandTotalBig = yearTotalsBig.reduce((sum, t) => sum + t, 0n)
  const additionalGiaTotalBig = ADDITIONAL_GIA_FIELDS.filter((f) =>
    activeFields.includes(f)
  ).reduce((sum, f) => sum + sourceTotalsBig[f], 0n)
  const sourceTotals = Object.fromEntries(
    Object.entries(sourceTotalsBig).map(([k, v]) => [k, v.toString()])
  )
  return {
    sourceTotals,
    yearTotals: yearTotalsBig.map((t) => t.toString()),
    grandTotal: grandTotalBig.toString(),
    additionalGiaTotal: additionalGiaTotalBig.toString(),
    contributorRowTotals: buildContributorRowTotals(processedRows)
  }
}
