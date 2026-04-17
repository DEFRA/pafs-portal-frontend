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
      amount: c.amount != null ? String(c.amount) : ''
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
 * Merge flat pafs_core_funding_values rows with pafs_core_funding_contributors
 * into the combined fundingValues format used by the form and upsert payload.
 * @private
 */
function buildFundingValuesFromProjectData(sessionData) {
  const dbValues = sessionData.pafs_core_funding_values || []
  const dbContributors = sessionData.pafs_core_funding_contributors || []

  if (!dbValues.length) {
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

  return sortedValues.map((fv) => buildFundingValueRow(fv, contributorsByYear))
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
    return parseInt(String(fvRow[row.field] || '0').replace(/\D/g, ''), 10) || 0
  }
  if (row.kind === 'contributor') {
    const items = fvRow[row.contributorArrayField] || []
    const match = items.find((c) => c.name === row.contributorName)
    return parseInt(String(match?.amount || '0').replace(/\D/g, ''), 10) || 0
  }
  return 0
}

/**
 * Calculate row totals, column totals, and grand total server-side
 * for no-JS rendering.
 * @private
 */
function calculateServerTotals(spendRows, existingValues, financialYears) {
  const colTotals = new Array(financialYears.length).fill(0)
  const rowTotals = {}
  let grandTotal = 0

  for (const row of spendRows) {
    if (row.kind === 'group-heading') {
      continue
    }

    const rowKey =
      row.kind === 'contributor'
        ? `${row.contributorArrayField}-${row.contributorIndex}`
        : row.field
    let rowTotal = 0

    for (let colIdx = 0; colIdx < financialYears.length; colIdx++) {
      const year = financialYears[colIdx].value
      const fvRow = existingValues.find(
        (r) => Number(r[PROJECT_PAYLOAD_FIELDS.FINANCIAL_YEAR]) === year
      )
      if (!fvRow) {
        continue
      }

      const val = getRowValue(row, fvRow)
      rowTotal += val
      colTotals[colIdx] += val
    }

    rowTotals[rowKey] = rowTotal
  }

  for (const ct of colTotals) {
    grandTotal += ct
  }

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
 * Build field-level and global errors from Joi validation output and
 * contributor coverage check.
 * @private
 */
function buildSpendValidationErrors(error, contributorCoverageError, t) {
  const fieldErrors = {}
  let globalError = null

  if (contributorCoverageError) {
    globalError = t(contributorCoverageError)
  }

  if (!error) {
    return { fieldErrors, globalError }
  }

  for (const detail of error.details) {
    const path = detail.path
    const isTopLevel =
      path.length === 0 || (path.length === 1 && typeof path[0] === 'number')
    if (isTopLevel) {
      if (!globalError) {
        globalError = t(
          'projects.funding_sources.estimated_spend.errors.required'
        )
      }
    } else {
      const fieldKey = path[path.length - 1]
      if (fieldKey && !fieldErrors[fieldKey]) {
        const msgKey =
          detail.type === 'string.max'
            ? 'projects.funding_sources.estimated_spend.errors.max_digits'
            : 'projects.funding_sources.estimated_spend.errors.invalid'
        fieldErrors[fieldKey] = t(msgKey)
      }
    }
  }

  return { fieldErrors, globalError }
}

// ─── View data builder ──────────────────────────────────────────────────────

/**
 * Build common view data for the estimated spend step.
 * @private
 */
function buildEstimatedSpendViewData(
  request,
  { existingValues, fieldErrors, globalError } = {}
) {
  const sessionData = getSessionData(request)
  const step = PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
  const config = FUNDING_SOURCES_CONFIG[step]
  const backLinkOptions = resolveBackLinkOptions(step, sessionData)

  const startYear = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR] || 0
  )
  const endYear = Number(
    sessionData[PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR] || startYear
  )
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
      const { fieldErrors, globalError } = buildSpendValidationErrors(
        error,
        contributorCoverageError,
        t
      )
      const errorViewData = buildEstimatedSpendViewData(request, {
        existingValues: fundingValues,
        fieldErrors,
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
