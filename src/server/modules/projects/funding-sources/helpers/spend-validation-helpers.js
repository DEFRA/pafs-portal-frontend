// ─── Validation error classification helpers ────────────────────────────────

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
    yearIdx: contribYearIdx,
    strippedIdx: contribIdx,
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
 * Classify a single Joi validation detail into a kind tag.
 * @param {object} detail - A single Joi error detail.
 * @returns {{ kind: string, ... }|null}
 */
export function classifyValidationDetail(detail) {
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

// ─── Index remapping ────────────────────────────────────────────────────────

/**
 * Resolve the original contributor index from the stripped index using
 * the per-year index maps.  Returns the original index, or falls back
 * to the stripped index when the mapping is unavailable.
 * @private
 */
function remapContributorIndex(classified, contributorIndexMaps) {
  if (!contributorIndexMaps.length || classified.yearIdx === undefined) {
    return classified.strippedIdx
  }

  const yearMaps = contributorIndexMaps[classified.yearIdx]
  const mapping = yearMaps?.[classified.contributorArrayField]

  if (!mapping) {
    return classified.strippedIdx
  }

  const originalIdx = mapping[classified.strippedIdx]
  return originalIdx !== undefined ? originalIdx : classified.strippedIdx
}

// ─── Error application ──────────────────────────────────────────────────────

/**
 * Apply a contributor-cell classified error to fieldErrors / cellErrors.
 * @private
 */
function applyContributorCellError(
  classified,
  fieldErrors,
  cellErrors,
  ERROR_PREFIX,
  t,
  contributorIndexMaps
) {
  const originalIdx = remapContributorIndex(classified, contributorIndexMaps)
  const cellKey = `${classified.contributorArrayField}-${originalIdx}-${classified.yearIdx}`

  if (!cellErrors[cellKey]) {
    cellErrors[cellKey] = true
  }

  // Ensure one field-level error exists per array field for the error summary
  if (!fieldErrors[classified.contributorArrayField]) {
    fieldErrors[classified.contributorArrayField] = t(
      `${ERROR_PREFIX}${classified.msgSuffix}`
    )
  }
}

/**
 * Apply a field-kind classified error to fieldErrors / cellErrors.
 * @private
 */
function applyFieldError(classified, fieldErrors, cellErrors, ERROR_PREFIX, t) {
  if (!fieldErrors[classified.fieldKey]) {
    fieldErrors[classified.fieldKey] = t(
      `${ERROR_PREFIX}${classified.msgSuffix}`
    )
  }
  if (classified.yearIdx !== null) {
    cellErrors[`${classified.fieldKey}-${classified.yearIdx}`] = true
  }
}

/**
 * Mutate fieldErrors / cellErrors with the result of a classified detail.
 * Global-kind details are handled by the caller.
 * @param {object} classified
 * @param {object} fieldErrors
 * @param {object} cellErrors
 * @param {string} ERROR_PREFIX
 * @param {Function} t
 * @param {Array} contributorIndexMaps
 */
export function applyClassifiedError(
  classified,
  fieldErrors,
  cellErrors,
  ERROR_PREFIX,
  t,
  contributorIndexMaps = []
) {
  if (classified.kind === 'contributor-cell') {
    applyContributorCellError(
      classified,
      fieldErrors,
      cellErrors,
      ERROR_PREFIX,
      t,
      contributorIndexMaps
    )
    return
  }

  if (classified.kind === 'field') {
    applyFieldError(classified, fieldErrors, cellErrors, ERROR_PREFIX, t)
  }
}

/**
 * Build field-level and global errors from Joi validation output and
 * contributor coverage check.
 * @param {object|null} error - Joi validation error.
 * @param {string|null} contributorCoverageError - Translation key or null.
 * @param {Function} t - Translation function.
 * @param {Array} contributorIndexMaps - Per-year index maps.
 * @returns {{ fieldErrors: object, cellErrors: object, globalError: string|null }}
 */
export function buildSpendValidationErrors(
  error,
  contributorCoverageError,
  t,
  contributorIndexMaps = []
) {
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
      applyClassifiedError(
        classified,
        fieldErrors,
        cellErrors,
        ERROR_PREFIX,
        t,
        contributorIndexMaps
      )
    }
  }

  return { fieldErrors, cellErrors, globalError }
}
