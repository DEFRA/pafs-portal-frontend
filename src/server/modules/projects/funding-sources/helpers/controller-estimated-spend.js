import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { FUNDING_SOURCES_CONFIG } from '../../helpers/config/funding-sources.js'
import { saveProjectWithErrorHandling } from '../../helpers/project-submission.js'
import {
  buildViewData,
  buildFinancialYearLabel,
  buildIdToYearMap,
  buildContributorsByYear,
  formatNumberWithCommas,
  getCurrentFinancialYearStartYear,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../../helpers/project-utils.js'
import { resolveBackLinkOptions } from './navigation-helpers.js'
import {
  sanitiseFundingValueRow,
  setSourceTotalsFromContributorArrays,
  stripEmptyContributorEntries,
  parseFundingValuesPayload
} from './payload-helpers.js'
import {
  buildEstimatedSpendRows,
  getContributorNames,
  getSelectedEstimatedSpendSourceFields,
  CONTRIBUTOR_SPEND_GROUPS
} from './estimated-spending-helpers.js'

// ─── Standalone helper functions ────────────────────────────────────────────

/**
 * Map from funding value camelCase keys to PROJECT_PAYLOAD_FIELDS constants.
 * @private
 */
const FUNDING_VALUE_FIELD_MAP = [
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
 * @private
 */
function resolveSafeFinancialYears(sessionData) {
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
 * @private
 */
function loadEstimatedSpendValues(sessionData) {
  const sessionFv = sessionData[PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]
  if (Array.isArray(sessionFv) && sessionFv.length) {
    return sessionFv
  }
  return buildFundingValuesFromProjectData(sessionData)
}

/**
 * Extract a numeric value from a spend row for a given funding value row.
 * @private
 */
function getRowValue(row, fvRow) {
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

/**
 * Calculate row totals, column totals, and grand total server-side
 * for no-JS rendering.
 * @private
 */
function calculateServerTotals(spendRows, existingValues, financialYears) {
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
      (c) => c.name === name && c.amount != null && c.amount !== ''
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
 * @private
 */
function checkContributorCoverage(sessionData, fundingValues) {
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

/**
 * Classify a contributor-cell Joi error.
 * Path shape: [yearIdx, contributorArrayField, contributorIdx, ...]
 * @private
 */
function classifyContributorDetail(detail, path) {
  const contribYearIdx = path[0]
  const contributorArrayField = path[1]
  const contribIdx = path[2]
  const msgSuffix = detail.type === 'string.max' ? 'max_digits' : 'invalid'
  return {
    kind: 'contributor-cell',
    cellKey: `${contributorArrayField}-${contribIdx}-${contribYearIdx}`,
    msgSuffix,
    contributorArrayField
  }
}

/**
 * Return true when the Joi error path matches a contributor-cell shape:
 * [yearIdx, contributorArrayField, contributorIdx, ...]
 * @private
 */
function isContributorPath(path) {
  return (
    path.length >= 4 &&
    typeof path[0] === 'number' &&
    typeof path[1] === 'string' &&
    typeof path[2] === 'number'
  )
}

/**
 * Build field-level and global errors from Joi validation output and
 * contributor coverage check.
 * @private
 */
function classifyValidationDetail(detail) {
  const path = detail.path
  const isTopLevel =
    path.length === 0 || (path.length === 1 && typeof path[0] === 'number')

  if (isTopLevel) {
    return { kind: 'global' }
  }

  if (isContributorPath(path)) {
    return classifyContributorDetail(detail, path)
  }

  const fieldKey = path[path.length - 1]
  if (!fieldKey) {
    return null
  }

  const yearIdx = typeof path[0] === 'number' ? path[0] : null
  const msgSuffix = detail.type === 'string.max' ? 'max_digits' : 'invalid'
  return { kind: 'field', fieldKey, yearIdx, msgSuffix }
}

/**
 * Mutate fieldErrors / cellErrors with the result of a classified detail.
 * Global-kind details are handled by the caller.
 * @private
 */
function applyClassifiedError(
  classified,
  fieldErrors,
  cellErrors,
  ERROR_PREFIX,
  t
) {
  if (classified.kind === 'contributor-cell') {
    if (!cellErrors[classified.cellKey]) {
      cellErrors[classified.cellKey] = true
    }
    // Ensure one field-level error exists per array field for the error summary
    if (!fieldErrors[classified.contributorArrayField]) {
      fieldErrors[classified.contributorArrayField] = t(
        `${ERROR_PREFIX}${classified.msgSuffix}`
      )
    }
    return
  }
  if (classified.kind === 'field') {
    if (!fieldErrors[classified.fieldKey]) {
      fieldErrors[classified.fieldKey] = t(
        `${ERROR_PREFIX}${classified.msgSuffix}`
      )
    }
    if (classified.yearIdx !== null) {
      cellErrors[`${classified.fieldKey}-${classified.yearIdx}`] = true
    }
  }
}

function buildSpendValidationErrors(error, contributorCoverageError, t) {
  const fieldErrors = {}
  const cellErrors = {}
  let globalError = contributorCoverageError
    ? t(contributorCoverageError)
    : null

  if (!error) {
    return { fieldErrors, cellErrors, globalError }
  }

  const ERROR_PREFIX = 'projects.funding_sources.estimated_spend.errors.'

  for (const detail of error.details) {
    const classified = classifyValidationDetail(detail)
    if (classified?.kind === 'global' && !globalError) {
      globalError = t(`${ERROR_PREFIX}required`)
    }
    if (classified && classified.kind !== 'global') {
      applyClassifiedError(classified, fieldErrors, cellErrors, ERROR_PREFIX, t)
    }
  }

  return { fieldErrors, cellErrors, globalError }
}

// ─── View data builder ──────────────────────────────────────────────────────

/**
 * Build common view data for the estimated spend step.
 * @private
 */
function buildEstimatedSpendViewData(
  request,
  { existingValues, fieldErrors, cellErrors, globalError } = {}
) {
  const sessionData = getSessionData(request)
  const step = PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
  const config = FUNDING_SOURCES_CONFIG[step]
  const backLinkOptions = resolveBackLinkOptions(step, sessionData)

  const { startYear, endYear } = resolveSafeFinancialYears(sessionData)
  const financialYears = []
  for (let y = startYear; y <= endYear; y++) {
    financialYears.push({ value: y, label: buildFinancialYearLabel(y) })
  }

  const spendRows = buildEstimatedSpendRows(
    sessionData,
    request.t.bind(request)
  )
  const values = existingValues || loadEstimatedSpendValues(sessionData)
  const serverTotals = calculateServerTotals(spendRows, values, financialYears)

  return buildViewData(request, {
    localKeyPrefix: config.localKeyPrefix,
    backLinkOptions,
    additionalData: {
      step,
      financialYears,
      spendRows,
      existingValues: values,
      serverTotals,
      fieldErrors: fieldErrors || {},
      cellErrors: cellErrors || {},
      globalError: globalError || null,
      formatNumberWithCommas,
      PROJECT_PAYLOAD_FIELDS,
      columnWidth: 'full'
    }
  })
}

// ─── Controller Class ──────────────────────────────────────────────────────────

class EstimatedSpendController {
  async getEstimatedSpend(request, h) {
    const viewData = buildEstimatedSpendViewData(request)
    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND, viewData)
  }

  async postEstimatedSpend(request, h) {
    const sessionData = getSessionData(request)
    const step = PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    const rawValues = parseFundingValuesPayload(request.payload)
    const fundingValues = rawValues
      .map((row) => sanitiseFundingValueRow(row))
      .map((row) => setSourceTotalsFromContributorArrays(row))

    updateSessionData(request, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: fundingValues
    })

    // Update-totals action (no-JS reload path)
    if (request.payload?.action === 'update-totals') {
      return h
        .redirect(
          ROUTES.PROJECT.EDIT.FUNDING_SOURCES.ESTIMATED_SPEND.replace(
            REFERENCE_NUMBER_PARAM,
            referenceNumber
          )
        )
        .takeover()
    }

    const fundingValuesForValidation = fundingValues.map((row) =>
      stripEmptyContributorEntries({ ...row })
    )

    const contributorCoverageError = checkContributorCoverage(
      sessionData,
      fundingValuesForValidation
    )

    const selectedSources = getSelectedEstimatedSpendSourceFields(sessionData)
    const schema = config.schema(selectedSources)
    const { error } = schema.validate(fundingValuesForValidation, {
      abortEarly: false
    })

    if (error || contributorCoverageError) {
      const t = request.t.bind(request)
      const { fieldErrors, cellErrors, globalError } =
        buildSpendValidationErrors(error, contributorCoverageError, t)
      const errorViewData = buildEstimatedSpendViewData(request, {
        existingValues: fundingValues,
        fieldErrors,
        cellErrors,
        globalError
      })
      return h.view(
        PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
        errorViewData
      )
    }

    updateSessionData(request, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: fundingValuesForValidation
    })

    const saveViewData = buildEstimatedSpendViewData(request, {
      existingValues: fundingValuesForValidation
    })

    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.FUNDING_SOURCES_ESTIMATED_SPEND,
      saveViewData,
      PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND
    )
    if (saveError) {
      return saveError
    }

    return navigateToProjectOverview(referenceNumber, h)
  }
}

// ─── Singleton + exported controller object ─────────────────────────────────

const ctrl = new EstimatedSpendController()

export const estimatedSpendController = {
  getHandler: (req, h) => ctrl.getEstimatedSpend(req, h),
  postHandler: (req, h) => ctrl.postEstimatedSpend(req, h)
}
