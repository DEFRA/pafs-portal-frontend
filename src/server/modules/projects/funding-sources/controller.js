import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { FUNDING_SOURCES_CONFIG } from '../helpers/config/funding-sources.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  buildFinancialYearLabel,
  formatNumberWithCommas,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import {
  CONTRIBUTOR_SESSION_KEY,
  CONTRIBUTOR_NAMES_FIELD,
  CONTRIBUTOR_LEVEL
} from '../../../common/constants/projects.js'
import {
  resolveBackLinkOptions,
  nextRouteAfterSelection,
  nextRouteAfterAdditional,
  nextRouteAfterContributors,
  CONTRIBUTOR_STEP_ROUTE
} from './helpers/navigation-helpers.js'
import {
  clearFundingValueFields,
  sanitiseFundingValueRow,
  setSourceTotalsFromContributorArrays,
  stripEmptyContributorEntries,
  parseFundingValuesPayload,
  parseContributorsPayload
} from './helpers/payload-helpers.js'
import {
  buildEstimatedSpendRows,
  getContributorNames,
  getSelectedEstimatedSpendSourceFields,
  localizeContributorErrorMessage,
  CONTRIBUTOR_SPEND_GROUPS
} from './helpers/estimated-spending-helpers.js'

// ─── Controller Class ──────────────────────────────────────────────────────────

class FundingSourcesController {
  // ── Step 1: Main funding sources selection ──────────────────────────────────

  async getSelection(request, h) {
    const step = PROJECT_STEPS.FUNDING_SOURCES
    const config = FUNDING_SOURCES_CONFIG[step]

    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions: config.backLinkOptions,
      additionalData: {
        step,
        PROJECT_PAYLOAD_FIELDS
      }
    })

    return h.view(PROJECT_VIEWS.FUNDING_SOURCES, viewData)
  }

  async postSelection(request, h) {
    const step = PROJECT_STEPS.FUNDING_SOURCES
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    // Normalise checkboxes: unchecked boxes are absent from payload → false
    const checkboxFields = [
      PROJECT_PAYLOAD_FIELDS.FCERM_GIA,
      PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY,
      'additionalFcermGia',
      PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS,
      PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS,
      PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS,
      PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED
    ]

    const normalised = {}
    for (const field of checkboxFields) {
      normalised[field] = request.payload[field] === 'true'
    }

    updateSessionData(request, normalised)

    const { error } = config.schema.validate(normalised, { abortEarly: false })
    if (error) {
      const fieldErrors = extractJoiErrors(error)
      const viewData = buildViewData(request, {
        localKeyPrefix: config.localKeyPrefix,
        backLinkOptions: config.backLinkOptions,
        additionalData: {
          step,
          fieldErrors,
          PROJECT_PAYLOAD_FIELDS
        }
      })
      return h.view(PROJECT_VIEWS.FUNDING_SOURCES, viewData)
    }

    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions: config.backLinkOptions
    })

    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.FUNDING_SOURCES_SELECTED,
      viewData,
      PROJECT_VIEWS.FUNDING_SOURCES
    )
    if (saveError) {
      return saveError
    }

    // If additionalFcermGia was just deselected, reset all individual additional
    // GIA boolean flags in session (so buildEstimatedSpendRows doesn't render their rows)
    // and clear their spend values from session fundingValues.
    if (!normalised.additionalFcermGia) {
      const additionalGiaFields = [
        PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE,
        PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING,
        PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES,
        PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID,
        PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT,
        PROJECT_PAYLOAD_FIELDS.RECOVERY,
        PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND
      ]
      const resetFlags = {}
      for (const field of additionalGiaFields) {
        resetFlags[field] = false
      }
      updateSessionData(request, resetFlags)
      clearFundingValueFields(request, additionalGiaFields)
    }

    const sessionData = getSessionData(request)
    return h
      .redirect(nextRouteAfterSelection(sessionData, referenceNumber))
      .takeover()
  }

  // ── Step 2: Additional FCRM GIA sources ────────────────────────────────────

  async getAdditionalSources(request, h) {
    const sessionData = getSessionData(request)
    const step = PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
    const config = FUNDING_SOURCES_CONFIG[step]

    // Gate: if additionalFcermGia not selected, redirect to overview
    if (!sessionData.additionalFcermGia) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions: config.backLinkOptions,
      additionalData: { step, PROJECT_PAYLOAD_FIELDS }
    })

    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL, viewData)
  }

  async postAdditionalSources(request, h) {
    const sessionData = getSessionData(request)
    const step = PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    if (!sessionData.additionalFcermGia) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    const additionalFields = [
      PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE,
      PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING,
      PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES,
      PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID,
      PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT,
      PROJECT_PAYLOAD_FIELDS.RECOVERY,
      PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND
    ]

    const normalised = {}
    for (const field of additionalFields) {
      normalised[field] = request.payload[field] === 'true'
    }

    updateSessionData(request, normalised)

    const { error } = config.schema.validate(normalised, { abortEarly: false })
    if (error) {
      const fieldErrors = extractJoiErrors(error)
      const viewData = buildViewData(request, {
        localKeyPrefix: config.localKeyPrefix,
        backLinkOptions: config.backLinkOptions,
        additionalData: { step, fieldErrors, PROJECT_PAYLOAD_FIELDS }
      })
      return h.view(PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL, viewData)
    }

    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions: config.backLinkOptions
    })

    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.ADDITIONAL_FUNDING_SOURCES_GIA_SELECTED,
      viewData,
      PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL
    )
    if (saveError) {
      return saveError
    }

    // Clear spend values for any additional GIA sub-source that was just deselected
    const deselectedFields = [
      PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE,
      PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING,
      PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES,
      PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID,
      PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT,
      PROJECT_PAYLOAD_FIELDS.RECOVERY,
      PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND
    ].filter((field) => !normalised[field])
    if (deselectedFields.length) {
      clearFundingValueFields(request, deselectedFields)
    }

    const updated = getSessionData(request)
    return h
      .redirect(nextRouteAfterAdditional(updated, referenceNumber))
      .takeover()
  }

  // ── Steps 3–5: Contributor names (shared handler) ──────────────────────────

  async getContributors(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]

    // Gate: if the required flag isn't set, redirect to overview
    if (!sessionData[config.gateField]) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    let contributors = sessionData[sessionKey] || []

    // If session array is empty, try to populate from database CSV
    if (!contributors.length) {
      const csv = sessionData[namesField]
      if (typeof csv === 'string' && csv.trim()) {
        contributors = csv
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
      }
    }

    // Ensure at least one empty slot for input
    if (!contributors.length) {
      contributors = ['']
    }

    // Seed the session key so delete handlers always work from the full list
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

  async postContributors(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    if (!sessionData[config.gateField]) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    const { action } = request.payload
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const backLinkOptions = resolveBackLinkOptions(step, sessionData)
    const sessionContributors = sessionData[sessionKey] || ['']

    // Add another contributor
    if (action === 'add') {
      const submitted = parseContributorsPayload(
        request.payload,
        sessionContributors
      )
      // Preserve current typed values and append one blank slot
      const preserved = submitted.map((name) =>
        typeof name === 'string' ? name.trim() : ''
      )
      updateSessionData(request, { [sessionKey]: [...preserved, ''] })
      const stepRoute = CONTRIBUTOR_STEP_ROUTE[step]
      return h
        .redirect(stepRoute.replace(REFERENCE_NUMBER_PARAM, referenceNumber))
        .takeover()
    }

    // Continue — validate and save
    const submitted = parseContributorsPayload(
      request.payload,
      sessionContributors
    )
    const cleanNames = submitted.map((n) =>
      typeof n === 'string' ? n.trim() : ''
    )
    const nonEmptyNames = cleanNames.filter((n) => n.length > 0)

    // Validate each name
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    const t = request.t.bind(request)
    const { fieldErrors, hasError } = this._validateContributorNames(
      cleanNames,
      nonEmptyNames,
      config,
      t
    )

    if (hasError) {
      updateSessionData(request, { [sessionKey]: cleanNames })
      const viewData = buildViewData(request, {
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
      return h.view(PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS, viewData)
    }

    // Join names and store
    const joinedNames = nonEmptyNames.join(', ')
    updateSessionData(request, {
      [sessionKey]: cleanNames,
      [namesField]: joinedNames
    })

    const viewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions
    })

    const level = CONTRIBUTOR_LEVEL[step]
    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      level,
      viewData,
      PROJECT_VIEWS.FUNDING_SOURCES_PUBLIC_CONTRIBUTORS
    )
    if (saveError) {
      return saveError
    }

    const updated = getSessionData(request)
    return h
      .redirect(nextRouteAfterContributors(step, updated, referenceNumber))
      .takeover()
  }

  // ── Delete contributor confirm ──────────────────────────────────────────────

  async getDeleteContributor(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const index = parseInt(request.params.index, 10)
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
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
    const contributorName = contributors[index] || ''
    const contributorNumber = index + 1

    // Back link from the delete page should always return to the contributor
    // names page — not to whatever is behind that page.
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

  async postDeleteContributor(request, h, step) {
    const sessionData = getSessionData(request)
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params
    const index = parseInt(request.params.index, 10)
    const sessionKey = CONTRIBUTOR_SESSION_KEY[step]
    const namesField = CONTRIBUTOR_NAMES_FIELD[step]
    let contributors = [...(sessionData[sessionKey] || [])]
    if (!contributors.length) {
      const csv = sessionData[namesField]
      if (typeof csv === 'string' && csv.trim()) {
        contributors = csv
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)
      }
    }
    const contributorName = contributors[index] || ''
    const contributorNumber = index + 1

    const replace = (route) =>
      route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)

    // Back link from the delete page should always return to the contributor
    // names page — not to whatever is behind that page.
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
      const viewData = buildViewData(request, {
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

      return h.view(PROJECT_VIEWS.FUNDING_SOURCES_CONTRIBUTOR_DELETE, viewData)
    }

    if (request.payload.confirm === 'yes') {
      contributors.splice(index, 1)
      // Always leave at least one blank slot so the form can be filled
      if (!contributors.length) {
        contributors.push('')
      }
      updateSessionData(request, { [sessionKey]: contributors })
    }

    return h.redirect(backContributorsRoute).takeover()
  }

  // ── Step 6: Estimated spend ─────────────────────────────────────────────────

  // ── Funding value row builder ─────────────────────────────────────────────

  _buildFundingValueRow(fv, contributorsByYear) {
    const row = {
      financialYear: Number(fv.financialYear),
      [PROJECT_PAYLOAD_FIELDS.FCERM_GIA]: fv.fcermGia || null,
      [PROJECT_PAYLOAD_FIELDS.LOCAL_LEVY]: fv.localLevy || null,
      [PROJECT_PAYLOAD_FIELDS.PUBLIC_CONTRIBUTIONS]:
        fv.publicContributions || null,
      [PROJECT_PAYLOAD_FIELDS.PRIVATE_CONTRIBUTIONS]:
        fv.privateContributions || null,
      [PROJECT_PAYLOAD_FIELDS.OTHER_EA_CONTRIBUTIONS]:
        fv.otherEaContributions || null,
      [PROJECT_PAYLOAD_FIELDS.NOT_YET_IDENTIFIED]: fv.notYetIdentified || null,
      [PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE]:
        fv.assetReplacementAllowance || null,
      [PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING]:
        fv.environmentStatutoryFunding || null,
      [PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES]:
        fv.frequentlyFloodedCommunities || null,
      [PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID]:
        fv.otherAdditionalGrantInAid || null,
      [PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT]:
        fv.otherGovernmentDepartment || null,
      [PROJECT_PAYLOAD_FIELDS.RECOVERY]: fv.recovery || null,
      [PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND]:
        fv.summerEconomicFund || null
    }

    const yearContributors = contributorsByYear[String(row.financialYear)] || []
    const publicContributors = []
    const privateContributors = []
    const otherEaContributors = []

    for (const c of yearContributors) {
      const entry = {
        name: c.name,
        contributorType: c.contributorType,
        amount: c.amount != null ? String(c.amount) : ''
      }
      if (c.contributorType === 'public_contributions') {
        publicContributors.push(entry)
      } else if (c.contributorType === 'private_contributions') {
        privateContributors.push(entry)
      } else if (c.contributorType === 'other_ea_contributions') {
        otherEaContributors.push(entry)
      } else {
        // unrecognized contributor type — ignored
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
   * Merge flat pafs_core_funding_values rows with pafs_core_funding_contributors
   * into the combined fundingValues format used by the form and upsert payload.
   *
   * Each output row has:
   *   { financialYear, fcermGia, localLevy, ..., publicContributors: [{name, contributorType, amount}], ... }
   */
  _buildFundingValuesFromProjectData(sessionData) {
    const dbValues = sessionData.pafs_core_funding_values || []
    const dbContributors = sessionData.pafs_core_funding_contributors || []

    if (!dbValues.length) {
      return []
    }

    // Group contributors by their funding value's financial year.
    // The API does not return an `id` on pafs_core_funding_values, so we
    // match contributors to their parent row via financial year:
    //   1. Build a map of fundingValueId → financialYear from dbValues
    //      (each DB row does carry a fundingValueId on the contributors side).
    //   2. Group contributors by the resolved financialYear.
    //
    // If dbValues lack an `id` we fall back to positional matching: the i-th
    // dbValues row is assumed to have the fundingValueId that contributors
    // reference, matching by sorted order of financialYear.

    // Build positional lookup: index → financialYear (dbValues usually arrive
    // sorted by financialYear from the API).
    const sortedValues = [...dbValues].sort(
      (a, b) => Number(a.financialYear) - Number(b.financialYear)
    )

    // Collect all unique fundingValueIds referenced by contributors
    const referencedIds = new Set(
      dbContributors.map((c) => String(c.fundingValueId)).filter(Boolean)
    )

    // Try to build a fundingValueId→financialYear map.
    // If dbValues carry an `id`, use it directly; otherwise build a
    // best-effort map by aligning the sorted unique referenced IDs with
    // the sorted funding value rows.
    const idToYear = new Map()
    const hasIds = sortedValues.some((fv) => fv.id != null)

    if (hasIds) {
      for (const fv of sortedValues) {
        idToYear.set(String(fv.id), Number(fv.financialYear))
      }
    } else {
      // Positional fallback: sort the referenced IDs numerically and align
      // them with the sorted funding value rows.
      const sortedRefIds = [...referencedIds].sort(
        (a, b) => Number(a) - Number(b)
      )
      sortedRefIds.forEach((refId, idx) => {
        if (idx < sortedValues.length) {
          idToYear.set(refId, Number(sortedValues[idx].financialYear))
        }
      })
    }

    // Group contributors by financialYear
    const contributorsByYear = {}
    for (const c of dbContributors) {
      const year = idToYear.get(String(c.fundingValueId))
      if (year == null) continue
      const key = String(year)
      if (!contributorsByYear[key]) contributorsByYear[key] = []
      contributorsByYear[key].push(c)
    }

    return sortedValues.map((fv) =>
      this._buildFundingValueRow(fv, contributorsByYear)
    )
  }

  /**
   * Load the estimated spend values — prefer session fundingValues, then
   * fall back to building from the raw project data (pafs_core_funding_values
   * + pafs_core_funding_contributors).
   */
  _loadEstimatedSpendValues(sessionData) {
    // If user has already edited, session fundingValues is set
    const sessionFv = sessionData[PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]
    if (Array.isArray(sessionFv) && sessionFv.length) return sessionFv

    // Otherwise build from the raw project data
    return this._buildFundingValuesFromProjectData(sessionData)
  }

  /**
   * Build common view data for the estimated spend step.
   */
  _buildEstimatedSpendViewData(
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
    const values = existingValues || this._loadEstimatedSpendValues(sessionData)

    // Server-side totals for no-JS path
    const serverTotals = this._calculateServerTotals(
      spendRows,
      values,
      financialYears
    )

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

  /**
   * Calculate row totals, column totals, and grand total server-side
   * for no-JS rendering.
   */
  _calculateServerTotals(spendRows, existingValues, financialYears) {
    const colTotals = new Array(financialYears.length).fill(0)
    const rowTotals = {} // keyed by row identifier
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

        const val = this._getRowValue(row, fvRow)
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

  // ── Contributor name validation helper ────────────────────────────────────────

  _validateContributorNames(cleanNames, nonEmptyNames, config, t) {
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

    // Duplicate name check (case-insensitive) — mark only the duplicate, not the original
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

  // ── Row value calculator ────────────────────────────────────────────────────

  _getRowValue(row, fvRow) {
    if (row.kind === 'source') {
      return (
        parseInt(String(fvRow[row.field] || '0').replace(/\D/g, ''), 10) || 0
      )
    } else if (row.kind === 'contributor') {
      const items = fvRow[row.contributorArrayField] || []
      const match = items.find((c) => c.name === row.contributorName)
      return parseInt(String(match?.amount || '0').replace(/\D/g, ''), 10) || 0
    } else {
      return 0
    }
  }

  // ── Contributor coverage check ────────────────────────────────────────────

  _checkContributorCoverage(sessionData, fundingValues) {
    for (const group of CONTRIBUTOR_SPEND_GROUPS) {
      if (!sessionData[group.enabledField]) {
        continue
      }
      const names = getContributorNames(sessionData, group)
      for (const name of names) {
        const hasAmount = fundingValues.some((row) => {
          const contributors = row[group.contributorArrayField]
          return (
            Array.isArray(contributors) &&
            contributors.some(
              (c) =>
                c.name === name &&
                c.amount !== null &&
                c.amount !== undefined &&
                c.amount !== ''
            )
          )
        })
        if (!hasAmount) {
          return 'projects.funding_sources.estimated_spend.errors.required'
        }
      }
    }
    return null
  }

  // ── Spend validation error builder ─────────────────────────────────────

  _buildSpendValidationErrors(error, contributorCoverageError, t) {
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

  async getEstimatedSpend(request, h) {
    const viewData = this._buildEstimatedSpendViewData(request)
    return h.view(PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND, viewData)
  }

  async postEstimatedSpend(request, h) {
    const sessionData = getSessionData(request)
    const step = PROJECT_STEPS.FUNDING_SOURCES_ESTIMATED_SPEND
    const config = FUNDING_SOURCES_CONFIG[step]
    const { referenceNumber } = request.params

    const rawValues = parseFundingValuesPayload(request.payload)

    // Sanitise and derive source totals from per-contributor amount entries
    const fundingValues = rawValues
      .map((row) => sanitiseFundingValueRow(row))
      .map((row) => setSourceTotalsFromContributorArrays(row))

    // Always save to session so values are preserved across requests
    // (this version keeps empty contributor slots so the template re-renders them)
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

    // For validation + API save, strip contributor entries with empty amounts
    // so they don't trip the Joi `required()` check on the amount field.
    const fundingValuesForValidation = fundingValues.map((row) =>
      stripEmptyContributorEntries({ ...row })
    )

    // ── Per-contributor coverage check ────────────────────────────────────────
    // Each named contributor must have at least one amount across all years.
    // (The Joi schema validates individual amount formats but not coverage.)
    const contributorCoverageError = this._checkContributorCoverage(
      sessionData,
      fundingValuesForValidation
    )

    // Validate the cleaned version (empty contributor entries removed)
    const selectedSources = getSelectedEstimatedSpendSourceFields(sessionData)
    const schema = config.schema(selectedSources)
    const { error } = schema.validate(fundingValuesForValidation, {
      abortEarly: false
    })

    if (error || contributorCoverageError) {
      const t = request.t.bind(request)
      const { fieldErrors, globalError } = this._buildSpendValidationErrors(
        error,
        contributorCoverageError,
        t
      )
      const viewData = this._buildEstimatedSpendViewData(request, {
        existingValues: fundingValues,
        fieldErrors,
        globalError
      })
      return h.view(PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND, viewData)
    }

    // Validation passed — save the clean version (no empty contributor entries)
    // to session so `buildProjectPayload` sends the right data to the API.
    updateSessionData(request, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: fundingValuesForValidation
    })

    // Build view data for save error re-rendering
    const viewData = this._buildEstimatedSpendViewData(request, {
      existingValues: fundingValuesForValidation
    })

    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.FUNDING_SOURCES_ESTIMATED_SPEND,
      viewData,
      PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND
    )
    if (saveError) {
      return saveError
    }

    return navigateToProjectOverview(referenceNumber, h)
  }
}

// ─── Exported handler objects ──────────────────────────────────────────────────

const ctrl = new FundingSourcesController()

export const fundingSourcesSelectionController = {
  getHandler: (req, h) => ctrl.getSelection(req, h),
  postHandler: (req, h) => ctrl.postSelection(req, h)
}

export const additionalFundingSourcesController = {
  getHandler: (req, h) => ctrl.getAdditionalSources(req, h),
  postHandler: (req, h) => ctrl.postAdditionalSources(req, h)
}

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

export const estimatedSpendController = {
  getHandler: (req, h) => ctrl.getEstimatedSpend(req, h),
  postHandler: (req, h) => ctrl.postEstimatedSpend(req, h)
}
