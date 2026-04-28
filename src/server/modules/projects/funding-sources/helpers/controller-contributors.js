import { PROJECT_VIEWS } from '../../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM,
  CONTRIBUTOR_SESSION_KEY,
  CONTRIBUTOR_NAMES_FIELD,
  CONTRIBUTOR_LEVEL
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { extractJoiErrors } from '../../../../common/helpers/error-renderer/index.js'
import { FUNDING_SOURCES_CONFIG } from '../../helpers/config/funding-sources.js'
import { saveProjectWithErrorHandling } from '../../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  getUniqueContributorNamesFromDb,
  navigateToProjectOverview,
  updateSessionData
} from '../../helpers/project-utils.js'
import {
  resolveBackLinkOptions,
  nextRouteAfterContributors,
  CONTRIBUTOR_STEP_ROUTE
} from './navigation-helpers.js'
import { parseContributorsPayload } from './payload-helpers.js'
import {
  localizeContributorErrorMessage,
  CONTRIBUTOR_SPEND_GROUPS
} from './estimated-spending-helpers.js'

// ─── Session sync ────────────────────────────────────────────────────────────

/**
 * Rename / delete contributor rows inside `pafs_core_funding_contributors` in
 * the session so the estimated-spend page pre-populates amounts correctly
 * after a contributor is renamed.
 *
 * Mirrors the paired rename algorithm used in the backend service:
 * sorted removed names are paired with sorted added names (rename-in-place);
 * any excess removals beyond available pairings are true deletions.
 *
 * @param {object} request
 * @param {string} sessionKey - identifies which contributor group was changed
 * @param {string[]} newNames  - the names that were just saved
 */
function syncSessionContributorNames(request, sessionKey, newNames) {
  const group = CONTRIBUTOR_SPEND_GROUPS.find(
    (g) => g.sessionKey === sessionKey
  )
  if (!group) {
    return
  }

  const sessionData = getSessionData(request)
  const allContributors = sessionData.pafs_core_funding_contributors

  if (!Array.isArray(allContributors) || allContributors.length === 0) {
    return
  }

  const { contributorType } = group
  const typeRows = allContributors.filter(
    (c) => c.contributorType === contributorType
  )
  const existingNames = [...new Set(typeRows.map((c) => c.name))].sort((a, b) =>
    a.localeCompare(b)
  )
  const sortedNew = [...newNames].sort((a, b) => a.localeCompare(b))
  const removed = existingNames
    .filter((n) => !sortedNew.includes(n))
    .sort((a, b) => a.localeCompare(b))
  const added = sortedNew
    .filter((n) => !existingNames.includes(n))
    .sort((a, b) => a.localeCompare(b))

  if (removed.length === 0 && added.length === 0) {
    return
  }

  let updated = [...allContributors]

  for (let i = 0; i < removed.length; i++) {
    if (i < added.length) {
      // Rename in-place — preserves amount so estimated-spend pre-populates
      updated = updated.map((c) =>
        c.contributorType === contributorType && c.name === removed[i]
          ? { ...c, name: added[i] }
          : c
      )
    } else {
      // True deletion
      updated = updated.filter(
        (c) => !(c.contributorType === contributorType && c.name === removed[i])
      )
    }
  }

  updateSessionData(request, { pafs_core_funding_contributors: updated })
}

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
function validateContributorNames(cleanNames, nonEmptyNames, config, t) {
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
 * Load contributor names from session key, database CSV, or contributors table fallback.
 */
function loadContributors(sessionData, sessionKey, namesField, step) {
  let contributors = sessionData[sessionKey] || []

  if (!contributors.length) {
    const csv = sessionData[namesField]
    if (typeof csv === 'string' && csv.trim()) {
      contributors = csv
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean)
    }
  }

  // Fallback: extract unique names from pafs_core_funding_contributors (legacy data)
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
function handleAddAction(request, sessionContributors, sessionKey, step) {
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
function handleRemoveAction(
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

// ─── Controller Class ──────────────────────────────────────────────────────────

class ContributorsController {
  // ── Steps 3–5: Contributor names (shared GET handler) ─────────────────────

  async getContributors(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]

    if (!sessionData[config.gateField]) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const contributors = loadContributors(
      sessionData,
      sessionKey,
      namesField,
      step
    )

    updateSessionData(request, { [sessionKey]: contributors })

    const backLinkOptions = resolveBackLinkOptions(step, sessionData)
    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions,
      additionalData: {
        step,
        contributors,
        sessionKey,
        deleteRoute: config.deleteRoute,
        fieldName: config.fieldName,
        PROJECT_PAYLOAD_FIELDS
      }
    })

    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS, viewData)
  }

  // ── Steps 3–5: Contributor names (shared POST handler) ────────────────────

  async postContributors(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    if (!sessionData[config.gateField]) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    const { action } = request.payload
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const sessionContributors = sessionData[sessionKey] || ['']

    if (action === 'add') {
      const redirectUrl = handleAddAction(
        request,
        sessionContributors,
        sessionKey,
        step
      )
      return h.redirect(redirectUrl).takeover()
    }

    if (typeof action === 'string' && action.startsWith('remove:')) {
      const removeIndex = Number.parseInt(action.split(':')[1], 10)
      const redirectUrl = handleRemoveAction(
        request,
        sessionContributors,
        sessionKey,
        step,
        removeIndex
      )
      return h.redirect(redirectUrl).takeover()
    }

    return this._validateAndSaveContributors(
      request,
      h,
      step,
      config,
      sessionKey,
      sessionContributors,
      referenceNumber
    )
  }

  /**
   * Validate submitted contributor names and save if valid.
   * @private
   */
  async _validateAndSaveContributors(
    request,
    h,
    step,
    config,
    sessionKey,
    sessionContributors,
    referenceNumber
  ) {
    const backLinkOptions = resolveBackLinkOptions(
      step,
      getSessionData(request)
    )
    const saveSubmitted = parseContributorsPayload(
      request.payload,
      sessionContributors
    )
    const cleanNames = saveSubmitted.map((n) =>
      typeof n === 'string' ? n.trim() : ''
    )
    const nonEmptyNames = cleanNames.filter((n) => n.length > 0)

    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const t = request.t.bind(request)
    const { fieldErrors, hasError } = validateContributorNames(
      cleanNames,
      nonEmptyNames,
      config,
      t
    )

    if (hasError) {
      updateSessionData(request, { [sessionKey]: cleanNames })
      const errorViewData = buildViewData(request, {
        localKeyPrefix: config.localKeyPrefix,
        backLinkOptions,
        additionalData: {
          step,
          contributors: cleanNames,
          sessionKey,
          deleteRoute: config.deleteRoute,
          fieldName: namesField,
          fieldErrors,
          PROJECT_PAYLOAD_FIELDS
        }
      })
      return h.view(
        PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS,
        errorViewData
      )
    }

    const joinedNames = nonEmptyNames.join(', ')
    updateSessionData(request, {
      [sessionKey]: cleanNames,
      [namesField]: joinedNames
    })

    const saveViewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions
    })

    const level = CONTRIBUTOR_LEVEL[step]
    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      level,
      saveViewData,
      PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
    if (saveError) {
      return saveError
    }

    // Keep session in sync so the estimated-spend page pre-populates renamed
    // contributor amounts without needing a full project re-fetch.
    syncSessionContributorNames(request, sessionKey, nonEmptyNames)

    const updated = getSessionData(request)
    return h
      .redirect(nextRouteAfterContributors(step, updated, referenceNumber))
      .takeover()
  }

  // ── Delete contributor: GET confirm page ──────────────────────────────────

  async getDeleteContributor(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const index = Number.parseInt(request.params.index, 10)
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const contributors = loadContributors(
      sessionData,
      sessionKey,
      namesField,
      step
    )
    const contributorName = contributors[index] || ''
    const contributorNumber = index + 1

    const contributorNamesRoute = config.deleteRoute
      .replace('/delete', '')
      .replace(REFERENCE_NUMBER_PARAM, request.params.referenceNumber)
    const backLinkOptions = {
      targetEditURL: contributorNamesRoute,
      conditionalRedirect: false
    }

    const viewData = buildViewData(request, {
      localKeyPrefix: 'projects.funding_sources.delete_contributor',
      backLinkOptions,
      additionalData: {
        step,
        index,
        contributorNumber,
        contributorName,
        cancelRoute: contributorNamesRoute
      }
    })

    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE, viewData)
  }

  // ── Delete contributor: POST confirm ──────────────────────────────────────

  async postDeleteContributor(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params
    const index = Number.parseInt(request.params.index, 10)
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const contributors = [
      ...loadContributors(sessionData, sessionKey, namesField, step)
    ]
    const contributorName = contributors[index] || ''
    const contributorNumber = index + 1

    const replace = (route) =>
      route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)

    const contributorNamesRoute = replace(
      config.deleteRoute.replace('/delete', '')
    )
    const backLinkOptions = {
      targetEditURL: contributorNamesRoute,
      conditionalRedirect: false
    }

    const backContributorsRoute = {
      [PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS]: replace(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS
      ),
      [PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS]: replace(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS
      ),
      [PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS]: replace(
        ROUTES.PROJECT.EDIT.FUNDING_SOURCES
          .OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
      )
    }[step]

    if (!['yes', 'no'].includes(request.payload.confirm)) {
      const confirmViewData = buildViewData(request, {
        localKeyPrefix: 'projects.funding_sources.delete_contributor',
        backLinkOptions,
        additionalData: {
          step,
          index,
          contributorNumber,
          contributorName,
          cancelRoute: contributorNamesRoute,
          fieldErrors: {
            confirm: true
          }
        }
      })

      return h.view(
        PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE,
        confirmViewData
      )
    }

    if (request.payload.confirm === 'yes') {
      contributors.splice(index, 1)
      if (!contributors.length) {
        contributors.push('')
      }
      updateSessionData(request, { [sessionKey]: contributors })
    }

    return h.redirect(backContributorsRoute).takeover()
  }
}

// ─── Singleton + exported controller objects ────────────────────────────────

const ctrl = new ContributorsController()

export const publicContributorsController = {
  getHandler: (req, h) =>
    ctrl.getContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
}

export const privateContributorsController = {
  getHandler: (req, h) =>
    ctrl.getContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    )
}

export const otherEaContributorsController = {
  getHandler: (req, h) =>
    ctrl.getContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postContributors(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    )
}

export const publicContributorsDeleteController = {
  getHandler: (req, h) =>
    ctrl.getDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
}

export const privateContributorsDeleteController = {
  getHandler: (req, h) =>
    ctrl.getDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_PRIVATE_CONTRIBUTORS
    )
}

export const otherEaContributorsDeleteController = {
  getHandler: (req, h) =>
    ctrl.getDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    ),
  postHandler: (req, h) =>
    ctrl.postDeleteContributor(
      req,
      h,
      PROJECT_STEPS.FUNDING_SOURCES_OTHER_EA_CONTRIBUTORS
    )
}
