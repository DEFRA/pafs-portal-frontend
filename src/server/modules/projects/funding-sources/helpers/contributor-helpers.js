import { extractJoiErrors } from '../../../../common/helpers/error-renderer/index.js'
import { REFERENCE_NUMBER_PARAM } from '../../../../common/constants/projects.js'
import { FUNDING_SOURCES_CONFIG } from '../../helpers/config/funding-sources.js'
import {
  getUniqueContributorNamesFromDb,
  updateSessionData
} from '../../helpers/project-utils.js'
import { CONTRIBUTOR_STEP_ROUTE } from './navigation-helpers.js'
import { parseContributorsPayload } from './payload-helpers.js'
import {
  localizeContributorErrorMessage,
  CONTRIBUTOR_SPEND_GROUPS
} from './estimated-spending-helpers.js'

// ─── Contributor name validation ────────────────────────────────────────────

/**
 * Validate an array of contributor names for emptiness, schema conformance
 * and duplicates.
 *
 * @param {string[]} cleanNames - Trimmed names (may include empty strings)
 * @param {string[]} nonEmptyNames - Only non-empty names
 * @param {object} config - Step config with Joi schema
 * @param {Function} t - i18n translation function
 * @returns {{ fieldErrors: object, hasError: boolean }}
 */
export function validateContributorNames(cleanNames, nonEmptyNames, config, t) {
  const fieldErrors = {}
  let hasError = false

  if (nonEmptyNames.length === 0) {
    fieldErrors['contributors[0]'] = t(
      'projects.funding_sources.contributors.errors.required'
    )
    hasError = true
  }

  for (let i = 0; i < cleanNames.length; i++) {
    if (!cleanNames[i]) {
      continue
    }
    const { error } = config.schema.validate(cleanNames[i], {
      abortEarly: false
    })
    if (error) {
      const extracted = extractJoiErrors(error)
      const rawMessage = extracted[Object.keys(extracted)[0]]
      fieldErrors[`contributors[${i}]`] = localizeContributorErrorMessage(
        rawMessage,
        t
      )
      hasError = true
    }
  }

  // Duplicate name check (case-insensitive) — mark only the duplicate
  const seenNames = new Set()
  for (let i = 0; i < cleanNames.length; i++) {
    if (!cleanNames[i]) {
      continue
    }
    const normalised = cleanNames[i].toLowerCase()
    if (seenNames.has(normalised)) {
      fieldErrors[`contributors[${i}]`] = t(
        'projects.funding_sources.contributors.errors.duplicate'
      )
      hasError = true
    } else {
      seenNames.add(normalised)
    }
  }

  return { fieldErrors, hasError }
}

// ─── Shared helper: load contributors from session or CSV ───────────────────

/**
 * Load contributor names from session key or funding_contributors table fallback.
 */
export function loadContributors(sessionData, sessionKey, namesField, step) {
  let contributors = sessionData[sessionKey] || []

  // Fallback: extract unique names from pafs_core_funding_contributors
  if (!contributors.length && step) {
    const group = CONTRIBUTOR_SPEND_GROUPS.find(
      (g) => g.sessionKey === sessionKey
    )
    if (group) {
      const dbContributors = sessionData.pafs_core_funding_contributors || []
      contributors = getUniqueContributorNamesFromDb(
        dbContributors,
        group.contributorType
      )
    }
  }

  // Ensure at least one empty slot for input
  if (!contributors.length) {
    contributors = ['']
  }

  return contributors
}

// ─── Handle the "add another contributor" action ────────────────────────────

/**
 * Parse submitted names, preserve them, and append one blank slot.
 */
export function handleAddAction(
  request,
  sessionContributors,
  sessionKey,
  step
) {
  const addSubmitted = parseContributorsPayload(
    request.payload,
    sessionContributors
  )
  const preserved = addSubmitted.map((name) =>
    typeof name === 'string' ? name.trim() : ''
  )
  updateSessionData(request, { [sessionKey]: [...preserved, ''] })

  const { referenceNumber } = request.params
  const stepRoute = CONTRIBUTOR_STEP_ROUTE[step]
  return stepRoute.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
}

// ─── Handle the "remove contributor" action ─────────────────────────────────

/**
 * Parse submitted names, persist them in the session, and redirect to the
 * delete-confirmation page for the contributor at the given index.
 */
export function handleRemoveAction(
  request,
  sessionContributors,
  sessionKey,
  step,
  index
) {
  const submitted = parseContributorsPayload(
    request.payload,
    sessionContributors
  )
  const preserved = submitted.map((name) =>
    typeof name === 'string' ? name.trim() : ''
  )
  updateSessionData(request, { [sessionKey]: preserved })

  const { referenceNumber } = request.params
  const config = FUNDING_SOURCES_CONFIG[step]
  const deleteUrl = config.deleteRoute
    .replace(REFERENCE_NUMBER_PARAM, referenceNumber)
    .concat(`/${index}`)
  return deleteUrl
}
