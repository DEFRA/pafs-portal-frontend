import {
  PROJECT_PAYLOAD_FIELDS,
  REFERENCE_NUMBER_PARAM
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import { getSessionData } from '../../helpers/project-utils.js'

/**
 * Resolve the current funding-sources step from the request route path.
 * @private
 */
function resolveCurrentStep(request) {
  const path = request.route.path
  const r = ROUTES.PROJECT.EDIT.FUNDING_SOURCES

  // Order matters: check more-specific paths first
  if (
    path.startsWith(r.PUBLIC_SECTOR_CONTRIBUTORS_DELETE) ||
    path === r.PUBLIC_SECTOR_CONTRIBUTORS
  ) {
    return 'public-contributors'
  }
  if (
    path.startsWith(r.PRIVATE_SECTOR_CONTRIBUTORS_DELETE) ||
    path === r.PRIVATE_SECTOR_CONTRIBUTORS
  ) {
    return 'private-contributors'
  }
  if (
    path.startsWith(r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS_DELETE) ||
    path === r.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
  ) {
    return 'other-ea-contributors'
  }
  if (path === r.ADDITIONAL_FUNDING_SOURCES_SELECTION) {
    return 'additional'
  }
  if (path === r.ESTIMATED_SPEND) {
    return 'estimated-spend'
  }
  return null // funding sources selection page itself — no gate needed
}

/**
 * Check whether any main funding source has been selected.
 * @private
 */
const FUNDING_SOURCE_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.FCERM_GIA,
  PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY,
  'additionalFcermGia',
  PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
  PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED
]

function hasAnyFundingSource(sessionData) {
  return FUNDING_SOURCE_FIELDS.some((field) => Boolean(sessionData[field]))
}

/**
 * Build the funding source selection redirect URL for a given referenceNumber.
 * @private
 */
function fundingSelectionUrl(referenceNumber) {
  return ROUTES.PROJECT.EDIT.FUNDING_SOURCES.FUNDING_SOURCES_SELECTION.replace(
    REFERENCE_NUMBER_PARAM,
    referenceNumber
  )
}

/**
 * Mapping from contributor page key → { enabledField, namesField, namingRoute }.
 * @private
 */
const CONTRIBUTOR_PAGE_CONFIG = {
  'public-contributors': {
    enabledField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
    namesField: PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTOR_NAMES,
    namingRoute: ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PUBLIC_SECTOR_CONTRIBUTORS
  },
  'private-contributors': {
    enabledField: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
    namesField: PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTOR_NAMES,
    namingRoute: ROUTES.PROJECT.EDIT.FUNDING_SOURCES.PRIVATE_SECTOR_CONTRIBUTORS
  },
  'other-ea-contributors': {
    enabledField: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
    namesField: PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTOR_NAMES,
    namingRoute:
      ROUTES.PROJECT.EDIT.FUNDING_SOURCES.OTHER_ENVIRONMENT_AGENCY_CONTRIBUTORS
  }
}

/**
 * Pre-handler that gates access to funding source sub-pages.
 *
 * Rules:
 * - Additional funding sources page: requires `additionalFcermGia === true`
 * - Contributor pages + delete: requires the matching contributor flag to be true
 * - Estimated spend page: requires at least one funding source selected
 * - Edge case: contributor is selected but no named contributor exists →
 *   redirect to the contributor naming page (not apply to delete pages).
 *
 * If the gate fails, user is redirected to the funding sources selection page.
 */
/**
 * Gate logic for the estimated spend page.
 * @private
 */
function gateEstimatedSpend(sessionData, referenceNumber, selectionUrl, h) {
  if (!hasAnyFundingSource(sessionData)) {
    return h.redirect(selectionUrl).takeover()
  }

  // Edge case: a contributor type is selected but has no named contributors.
  // Redirect to the first contributor naming page that needs names.
  for (const cfg of Object.values(CONTRIBUTOR_PAGE_CONFIG)) {
    if (!sessionData[cfg.enabledField]) {
      continue
    }
    const csv = sessionData[cfg.namesField]
    const hasNames = typeof csv === 'string' && csv.trim().length > 0
    if (!hasNames) {
      return h
        .redirect(
          cfg.namingRoute.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
        )
        .takeover()
    }
  }

  return h.continue
}

/**
 * Gate logic for contributor naming / delete pages.
 * @private
 */
function gateContributorPage(sessionData, step, selectionUrl, h) {
  const contributorCfg = CONTRIBUTOR_PAGE_CONFIG[step]
  if (contributorCfg && !sessionData[contributorCfg.enabledField]) {
    return h.redirect(selectionUrl).takeover()
  }
  return h.continue
}

export function requireFundingSourceGate(request, h) {
  const sessionData = getSessionData(request)
  const { referenceNumber } = request.params
  const step = resolveCurrentStep(request)

  // The main selection page itself needs no gate
  if (!step) {
    return h.continue
  }

  const selectionUrl = fundingSelectionUrl(referenceNumber)

  // ── Additional funding sources page ──
  if (step === 'additional') {
    return sessionData.additionalFcermGia
      ? h.continue
      : h.redirect(selectionUrl).takeover()
  }

  // ── Estimated spend page ──
  if (step === 'estimated-spend') {
    return gateEstimatedSpend(sessionData, referenceNumber, selectionUrl, h)
  }

  // ── Contributor pages (naming + delete) ──
  return gateContributorPage(sessionData, step, selectionUrl, h)
}
