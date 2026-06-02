const GROUP_SIZE = 3
import { SIZE } from '../../../common/constants/common.js'
import {
  PROJECT_SESSION_KEY,
  PROJECT_TYPES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_VIEW_ERROR_CODES,
  REFERENCE_NUMBER_PARAM,
  EDITABLE_STATUSES
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getAuthSession } from '../../../common/helpers/auth/session-manager.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'

/**
 * Get the GOV.UK tag class for a project state
 * @param {string} projectState - The project state/status
 * @returns {string} The GOV.UK tag class modifier
 */
export function getProjectStateTag(projectState) {
  if (EDITABLE_STATUSES.includes(projectState)) {
    return 'govuk-tag--light-blue'
  }
  return 'govuk-tag--grey'
}

/**
 * Check if a project type is restricted from updating confidence fields
 * Restricted types: ELO, HCR, STR, STU
 * @param {string} projectType - The project type
 * @returns {boolean} True if the project type is restricted
 */
export function isConfidenceRestrictedProjectType(projectType) {
  const restrictedTypes = [
    PROJECT_TYPES.ELO,
    PROJECT_TYPES.HCR,
    PROJECT_TYPES.STR,
    PROJECT_TYPES.STU
  ]
  return restrictedTypes.includes(projectType)
}

export function getBackLink(request, options = {}) {
  const { targetURL = '/', conditionalRedirect = false } = options

  const defaultLinkText = request.t('common.back_link')
  const overviewText = request.t('common.back_to_overview')
  const referenceNumber = request.params?.referenceNumber
  const isEditMode = Boolean(referenceNumber)

  // Pages which go back to overview only in edit mode
  if (conditionalRedirect && isEditMode) {
    return {
      text: overviewText,
      href: ROUTES.PROJECT.OVERVIEW.replace(
        REFERENCE_NUMBER_PARAM,
        referenceNumber
      )
    }
  }
  const targetEditURL = options?.targetEditURL || ''

  // Default behaviour for pages not in edit mode and don't go back to overview
  return {
    text: defaultLinkText,
    href:
      isEditMode && targetEditURL
        ? targetEditURL.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
        : targetURL
  }
}

/**
 * Validate payload and render error view if invalid
 * @private
 */
export function validatePayload(request, h, options) {
  const { template, schema, viewData, formData } = options

  // Skip validation if no schema defined (e.g., START step)
  if (!schema) {
    return null
  }

  const { error } = schema.validate(request.payload, { abortEarly: false })
  if (!error) {
    return null
  }

  const fieldErrors = extractJoiErrors(error)
  const errors = Object.entries(fieldErrors).map(([field, text]) => ({
    text,
    href: `#${field}`
  }))

  // Preserve submitted form data on validation error
  return h.view(template, {
    ...viewData,
    fieldErrors,
    errors,
    formData: formData || request.payload
  })
}

/**
 * Get project session data
 * @param {Object} request - Hapi request object
 * @returns {Object} Project session data
 */
export function getSessionData(request) {
  return request.yar.get(PROJECT_SESSION_KEY) || {}
}

/**
 * Update project session data
 * @param {Object} request - Hapi request object
 * @param {Object} data - Data to merge with existing session
 */
export function updateSessionData(request, data) {
  const sessionData = getSessionData(request)
  request.yar.set(PROJECT_SESSION_KEY, { ...sessionData, ...data })
}

/**
 * Reset project session data
 * @param {Object} request - Hapi request object
 */
export function resetSessionData(request) {
  request.yar.set(PROJECT_SESSION_KEY, {
    journeyStarted: true,
    isEdit: false,
    [PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER]: '',
    [PROJECT_PAYLOAD_FIELDS.SLUG]: ''
  })
}

/**
 * Build view data for a project step
 * @param {Object} request - Hapi request object
 * @param {Object} options - Additional options
 * @returns {Object} View data object
 */
export function buildViewData(request, options = {}) {
  const {
    formData = {},
    fieldErrors = null,
    errorCode = '',
    additionalData = {}
  } = options

  const sessionData = getSessionData(request)
  const referenceNumber = request.params?.referenceNumber || ''
  const isEditMode = !!referenceNumber

  const backLink = getBackLink(request, options.backLinkOptions)

  return {
    pageTitle: request.t(`${options.localKeyPrefix}.title`),
    localKeyPrefix: options.localKeyPrefix,
    backLinkURL: backLink.href,
    backLinkText: backLink.text,
    isEditMode,
    referenceNumber,
    fieldErrors,
    errorCode,
    formData: { ...sessionData, ...formData },
    sessionData,
    ERROR_CODES: PROJECT_VIEW_ERROR_CODES,
    PROJECT_PAYLOAD_FIELDS,
    ...additionalData
  }
}

export function loggedInUserAreas(request) {
  const session = getAuthSession(request)
  const user = session?.user

  if (user?.admin) {
    // Admin users can create proposals for any RMA area
    const areasByType = request.server.app.areasByType
    return areasByType?.RMA || []
  }

  return user?.areas || []
}

export function loggedInUserMainArea(request) {
  const areas = loggedInUserAreas(request)
  if (areas.length) {
    return areas.find((a) => a.primary) || areas[0]
  }
  return null
}

export function loggedInUserAreaOptions(request) {
  const areas = loggedInUserAreas(request)

  const areasOption = [
    {
      text: request.t('projects.area_selection.select_rma_option_text'),
      value: ''
    }
  ]
  return areasOption.concat(
    areas.map((area) => ({
      text: area.name,
      value: Number(area.areaId || area.id)
    }))
  )
}

export function navigateToProjectOverview(referenceNumber, h) {
  return h
    .redirect(
      ROUTES.PROJECT.OVERVIEW.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
    )
    .takeover()
}

export function requiredInterventionTypesForProjectType(projectType) {
  const skipInterventionTypes = [
    PROJECT_TYPES.HCR,
    PROJECT_TYPES.STR,
    PROJECT_TYPES.STU,
    PROJECT_TYPES.ELO
  ]
  return !skipInterventionTypes.includes(projectType)
}

export function getProjectStep(request) {
  const pathname = request.route.path
  const lastPart = pathname.split('/').pop()
  return lastPart
}

export function getCurrentFinancialYearStartYear(date = new Date()) {
  const year = date.getFullYear()
  const month = date.getMonth() + SIZE.LENGTH_1
  return month >= SIZE.LENGTH_4 ? year : year - SIZE.LENGTH_1
}

export function buildFinancialYearLabel(startYear) {
  return `April ${startYear} to March ${startYear + SIZE.LENGTH_1}`
}

export function buildFinancialYearOptions(startYear, count = SIZE.LENGTH_6) {
  return Array.from({ length: count }, (_, index) => {
    const year = startYear + index
    return {
      value: Number(year),
      text: buildFinancialYearLabel(year)
    }
  })
}

export function getAfterMarchYear(startYear, count = SIZE.LENGTH_6) {
  return startYear + count
}

/**
 * Check if a year is beyond the range of years to display
 * @param {number} year - The year to check
 * @param {number} minYear - The minimum year in the range
 * @returns {boolean} True if the year is beyond the range
 */
export function isYearBeyondRange(year, minYear) {
  if (!year) {
    return false
  }
  const maxYear = getAfterMarchYear(minYear) - SIZE.LENGTH_1
  return year > maxYear
}

export function getMonthName(monthNumber) {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  const monthIndex = Number.parseInt(monthNumber, 10) - 1
  return months[monthIndex] || monthNumber
}

export function formatDate(month, year) {
  if (!month || !year) {
    return null
  }
  return `${getMonthName(month)} ${year}`
}

/**
 * Format file size from bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size string
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) {
    return '0 B'
  }

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Insert commas into a digit string (linear time, no regex).
 * @param {string} digits - String of digits only
 * @returns {string} Formatted string with commas
 * @private
 */
function insertCommas(digits) {
  const n = digits.length
  if (n <= GROUP_SIZE) {
    return digits
  }

  let out = ''
  let i = n % GROUP_SIZE

  if (i > 0) {
    out = digits.slice(0, i)
    if (n > GROUP_SIZE) {
      out += ','
    }
  }

  while (i < n) {
    out += digits.slice(i, i + GROUP_SIZE)
    i += GROUP_SIZE
    if (i < n) {
      out += ','
    }
  }

  return out
}

/**
 * Format an integer-like value with comma separators.
 * Returns null when value is empty/invalid.
 * @param {string|number|bigint|null|undefined} value
 * @returns {string|null}
 */
export function formatNumberWithCommas(value) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const str = String(value)
  const isNegative = str.startsWith('-')
  const digits = str.replaceAll(/\D/g, '')

  if (!digits) {
    return null
  }

  const formatted = insertCommas(digits)
  return isNegative ? '-' + formatted : formatted
}

/**
 * Build ID-to-year mapping from funding values
 */
export function buildIdToYearMap(sortedValues, referencedIds) {
  const idToYear = new Map()
  const hasIds = sortedValues.some((fv) => fv.id != null)

  if (hasIds) {
    for (const fv of sortedValues) {
      idToYear.set(String(fv.id), Number(fv.financialYear))
    }
  } else {
    const sortedRefIds = [...referencedIds].sort(
      (a, b) => Number(a) - Number(b)
    )
    sortedRefIds.forEach((refId, idx) => {
      if (idx < sortedValues.length) {
        idToYear.set(refId, Number(sortedValues[idx].financialYear))
      }
    })
  }

  return idToYear
}

/**
 * Group contributors by financial year
 */
export function buildContributorsByYear(dbContributors, idToYear) {
  const contributorsByYear = {}
  for (const c of dbContributors) {
    const year = idToYear.get(String(c.fundingValueId))
    if (year == null) {
      continue
    }
    const key = String(year)
    if (!contributorsByYear[key]) {
      contributorsByYear[key] = []
    }
    contributorsByYear[key].push(c)
  }
  return contributorsByYear
}

/**
 * Format a funding value row with contributors
 * @private
 */
function formatFundingValueRow(fv, contributorsByYear) {
  // Keep values as strings to preserve full BigInt precision from the API.
  // Converting to Number loses digits beyond IEEE 754's ~15 significant digit
  // limit, causing rounding for values with 16+ digits.
  const toStr = (v) => (v != null && v !== '' ? String(v) : null)

  const row = {
    financialYear: Number(fv.financialYear),
    fcermGia: toStr(fv.fcermGia),
    localLevy: toStr(fv.localLevy),
    publicContributions: toStr(fv.publicContributions),
    privateContributions: toStr(fv.privateContributions),
    otherEaContributions: toStr(fv.otherEaContributions),
    notYetIdentified: toStr(fv.notYetIdentified),
    assetReplacementAllowance: toStr(fv.assetReplacementAllowance),
    environmentStatutoryFunding: toStr(fv.environmentStatutoryFunding),
    frequentlyFloodedCommunities: toStr(fv.frequentlyFloodedCommunities),
    otherAdditionalGrantInAid: toStr(fv.otherAdditionalGrantInAid),
    otherGovernmentDepartment: toStr(fv.otherGovernmentDepartment),
    recovery: toStr(fv.recovery),
    summerEconomicFund: toStr(fv.summerEconomicFund)
  }

  const yearContributors = contributorsByYear[String(row.financialYear)] || []
  const publicContributors = []
  const privateContributors = []
  const otherEaContributors = []

  for (const c of yearContributors) {
    const entry = {
      name: c.name,
      contributorType: c.contributorType,
      amount: c.amount == null ? '' : String(c.amount)
    }
    if (c.contributorType === 'public_contributions') {
      publicContributors.push(entry)
    }
    if (c.contributorType === 'private_contributions') {
      privateContributors.push(entry)
    }
    if (c.contributorType === 'other_ea_contributions') {
      otherEaContributors.push(entry)
    }
  }

  if (publicContributors.length) {
    row.publicContributors = publicContributors
  }

  if (privateContributors.length) {
    row.privateContributors = privateContributors
  }

  if (otherEaContributors.length) {
    row.otherEaContributors = otherEaContributors
  }

  return row
}

/**
 * Build processed funding values from raw project data.
 * Merges pafs_core_funding_values with pafs_core_funding_contributors into
 * rows with publicContributors / privateContributors / otherEaContributors arrays.
 * All numeric values are converted to plain Numbers so they work reliably
 * in Nunjucks templates regardless of BigInt or string serialization.
 *
 * @param {Object} projectData - Session/project data containing raw DB arrays
 * @returns {Array} Processed funding value rows
 */
/**
 * Ensure the processed funding rows cover every year from startYear to endYear.
 * Inserts empty placeholder rows for any missing years.
 * @private
 */
function fillMissingYears(processedRows, startYear, endYear) {
  if (!startYear || !endYear || startYear > endYear) {
    return processedRows
  }

  const existingYears = new Set(processedRows.map((r) => r.financialYear))
  const filled = [...processedRows]

  for (let y = startYear; y <= endYear; y++) {
    if (!existingYears.has(y)) {
      filled.push({ financialYear: y })
    }
  }

  return filled.toSorted((a, b) => a.financialYear - b.financialYear)
}

/**
 * Resolve safe start/end years from project data.
 * Falls back to the current financial year when explicit values are missing.
 * @private
 */
function resolveYearRange(projectData) {
  const rawStart = Number(projectData.financialStartYear || 0)
  const rawEnd = Number(projectData.financialEndYear || 0)
  const hasExplicitRange = rawStart > 0 && rawEnd > 0

  let startYear = rawStart
  let endYear = rawEnd
  if (startYear <= 0) {
    startYear = getCurrentFinancialYearStartYear()
  }
  if (endYear <= 0) {
    endYear = startYear
  }

  return { rawStart, hasExplicitRange, startYear, endYear }
}

/**
 * Build and merge funding value rows with contributor arrays.
 * @private
 */
function buildMergedRows(dbValues, dbContributors) {
  const sortedValues = [...dbValues].toSorted(
    (a, b) => Number(a.financialYear) - Number(b.financialYear)
  )

  const referencedIds = new Set(
    dbContributors.map((c) => String(c.fundingValueId)).filter(Boolean)
  )

  const idToYear = buildIdToYearMap(sortedValues, referencedIds)
  const contributorsByYear = buildContributorsByYear(dbContributors, idToYear)

  return sortedValues.map((fv) => formatFundingValueRow(fv, contributorsByYear))
}

export function buildProcessedFundingValues(projectData) {
  const dbValues = projectData.pafs_core_funding_values || []
  const dbContributors = projectData.pafs_core_funding_contributors || []
  const { rawStart, hasExplicitRange, startYear, endYear } =
    resolveYearRange(projectData)

  if (!dbValues.length && !rawStart) {
    return []
  }

  let rows = buildMergedRows(dbValues, dbContributors)

  // Filter out years outside the financial year range (legacy data may have stale rows)
  if (hasExplicitRange) {
    rows = rows.filter(
      (r) => r.financialYear >= startYear && r.financialYear <= endYear
    )
  }

  return fillMissingYears(rows, startYear, endYear)
}

export { computeFundingSourceTotals } from './funding-value-totals.js'

/**
 * Extract unique contributor names from pafs_core_funding_contributors for a
 * given contributor type.  Used as a fallback when the project-level
 * contributor names CSV field is empty (legacy data).
 *
 * @param {Array} dbContributors - Raw pafs_core_funding_contributors array
 * @param {string} contributorType - e.g. 'public_contributions'
 * @returns {string[]} Unique, trimmed, non-empty names
 */
export function getUniqueContributorNamesFromDb(
  dbContributors,
  contributorType
) {
  if (!Array.isArray(dbContributors) || !dbContributors.length) {
    return []
  }
  const seen = new Set()
  const names = []
  for (const c of dbContributors) {
    if (c.contributorType !== contributorType) {
      continue
    }
    const name = (c.name || '').trim()
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase())
      names.push(name)
    }
  }
  return names
}
