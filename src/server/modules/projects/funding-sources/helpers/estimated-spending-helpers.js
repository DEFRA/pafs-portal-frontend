import {
  CONTRIBUTOR_REQUIRED_ERROR_CODES,
  CONTRIBUTOR_INVALID_ERROR_CODES,
  CONTRIBUTOR_DUPLICATE_ERROR_CODES,
  CONTRIBUTOR_SPEND_GROUPS,
  MAIN_SPEND_SOURCES
} from '../../../../common/constants/projects.js'

/**
 * Retrieve the list of contributor names for a given contributor group.
 * Prefers the in-progress session array, then falls back to the stored
 * comma-separated CSV field from the database.
 *
 * @param {object} sessionData - Current session data
 * @param {object} group - A CONTRIBUTOR_SPEND_GROUPS entry
 * @returns {string[]} Trimmed, non-empty contributor names
 */
export function getContributorNames(sessionData, group) {
  const sessionValues = sessionData[group.sessionKey]
  if (Array.isArray(sessionValues) && sessionValues.length) {
    return sessionValues.map((name) => `${name || ''}`.trim()).filter(Boolean)
  }

  const csv = sessionData[group.namesField]
  if (typeof csv === 'string' && csv.trim()) {
    return csv
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  }

  return []
}

/**
 * Build rows for a contributor group (internal helper).
 */
function buildContributorGroupRows(
  rows,
  _src,
  sessionData,
  contributorGroup,
  t
) {
  const overviewPrefix = 'projects.overview.funding_sources_summary_card'
  const contributorNames = getContributorNames(sessionData, contributorGroup)

  if (contributorNames.length) {
    rows.push({
      kind: 'group-heading',
      label: t(`${overviewPrefix}.${contributorGroup.sectionLabelKey}`)
    })

    contributorNames.forEach((name, contributorIndex) => {
      rows.push({
        kind: 'contributor',
        sourceField: contributorGroup.sourceField,
        contributorArrayField: contributorGroup.contributorArrayField,
        contributorType: contributorGroup.contributorType,
        contributorName: name,
        contributorIndex,
        label: name
      })
    })
    return true
  }
  return false
}

/**
 * Build the ordered list of spending rows for the estimated-spend table.
 *
 * Each row is one of:
 *   - `{ kind: 'source', field, label }` – a plain funding source amount cell
 *   - `{ kind: 'group-heading', label }` – a contributor section heading
 *   - `{ kind: 'contributor', sourceField, contributorArrayField,
 *          contributorType, contributorName, contributorIndex, label }` –
 *       a per-contributor amount cell
 *
 * Additional-GIA sub-sources are only included when explicitly selected in
 * the session (their `additionalGia` flag is `true` and the session field is
 * truthy).
 *
 * @param {object} sessionData - Current session data
 * @param {Function} t - i18n translation function
 * @returns {Array} Ordered array of spend row descriptor objects
 */
export function buildEstimatedSpendRows(sessionData, t) {
  const rows = []
  const overviewPrefix = 'projects.overview.funding_sources_summary_card'

  for (const src of MAIN_SPEND_SOURCES) {
    // Skip sources that have not been selected in this session
    if (!sessionData[src.field]) {
      continue
    }

    // Additional-GIA sub-sources are always plain source rows
    if (src.additionalGia) {
      rows.push({
        kind: 'source',
        field: src.field,
        label: t(`${overviewPrefix}.${src.labelKey}`)
      })
      continue
    }

    // Contributor-backed sources render as contributor rows when names exist
    const contributorGroup = CONTRIBUTOR_SPEND_GROUPS.find(
      (group) => group.sourceField === src.field
    )
    if (contributorGroup) {
      const hasContributors = buildContributorGroupRows(
        rows,
        src,
        sessionData,
        contributorGroup,
        t
      )
      if (hasContributors) {
        continue
      }
    }

    // Fallback: plain source row
    rows.push({
      kind: 'source',
      field: src.field,
      label: t(`${overviewPrefix}.${src.labelKey}`)
    })
  }

  return rows
}

/**
 * Return the list of directly-entered (non-contributor) funding source fields
 * that are currently selected in the session.
 *
 * Contributor source fields (publicContributions, privateContributions,
 * otherEaContributions) are excluded because their totals are derived from
 * the per-contributor arrays rather than entered directly — the schema should
 * only enforce directly-entered rows.
 *
 * @param {object} sessionData - Current session data
 * @returns {string[]} Array of selected funding source field names
 */
export function getSelectedEstimatedSpendSourceFields(sessionData) {
  const contributorSourceFields = new Set(
    CONTRIBUTOR_SPEND_GROUPS.map((g) => g.sourceField)
  )
  return MAIN_SPEND_SOURCES.filter((src) => {
    if (contributorSourceFields.has(src.field)) {
      return false
    }
    return Boolean(sessionData[src.field])
  }).map((src) => src.field)
}

/**
 * Translate a raw contributor error code from the API/Joi response into
 * a localised user-facing message.
 *
 * Falls back to returning the rawMessage unchanged if it does not match any
 * known error code set.
 *
 * @param {string} rawMessage - Error code or message from validation
 * @param {Function} t - i18n translation function
 * @returns {string} Localised error message
 */
export function localizeContributorErrorMessage(rawMessage, t) {
  if (CONTRIBUTOR_REQUIRED_ERROR_CODES.has(rawMessage)) {
    return t('projects.funding_sources.contributors.errors.required')
  }
  if (CONTRIBUTOR_INVALID_ERROR_CODES.has(rawMessage)) {
    return t('projects.funding_sources.contributors.errors.invalid')
  }
  if (CONTRIBUTOR_DUPLICATE_ERROR_CODES.has(rawMessage)) {
    return t('projects.funding_sources.contributors.errors.duplicate')
  }
  return rawMessage
}

/**
 * Return the CONTRIBUTOR_SPEND_GROUPS constant (re-exported for convenience).
 * Controllers can import this to iterate over contributor groups without
 * needing to import the constants module directly.
 */
export { CONTRIBUTOR_SPEND_GROUPS }
