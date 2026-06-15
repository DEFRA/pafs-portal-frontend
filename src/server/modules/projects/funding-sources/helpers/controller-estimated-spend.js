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
  formatNumberWithCommas,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../../helpers/project-utils.js'
import { resolveBackLinkOptions } from './navigation-helpers.js'
import {
  sanitiseFundingValueRow,
  setSourceTotalsFromContributorArrays,
  stripEmptyContributorEntriesWithMapping,
  sanitiseZerosFromValidatedRows,
  parseFundingValuesPayload
} from './payload-helpers.js'
import {
  buildEstimatedSpendRows,
  getSelectedEstimatedSpendSourceFields
} from './estimated-spending-helpers.js'
import {
  resolveSafeFinancialYears,
  loadEstimatedSpendValues
} from './funding-value-builders.js'
import {
  calculateServerTotals,
  checkContributorCoverage
} from './spend-calculation-helpers.js'
import { buildSpendValidationErrors } from './spend-validation-helpers.js'
// --- View data builder -----------------------------------------------------

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

// --- Validation helper -----------------------------------------------------

/**
 * Validate funding values and return an error view response if invalid.
 * Returns null when validation passes.
 * @private
 */
function validateAndRenderErrors(
  request,
  h,
  sessionData,
  fundingValues,
  config
) {
  const contributorIndexMaps = []
  const fundingValuesForValidation = fundingValues.map((row) => {
    const { row: stripped, indexMaps } =
      stripEmptyContributorEntriesWithMapping(row)
    contributorIndexMaps.push(indexMaps)
    return stripped
  })

  const contributorCoverageError = checkContributorCoverage(
    sessionData,
    fundingValuesForValidation
  )

  const selectedSources = getSelectedEstimatedSpendSourceFields(sessionData)
  const schema = config.schema(selectedSources)
  const { error } = schema.validate(fundingValuesForValidation, {
    abortEarly: false
  })

  if (!error && !contributorCoverageError) {
    return { validatedRows: fundingValuesForValidation, errorResponse: null }
  }

  const t = request.t.bind(request)
  const { fieldErrors, cellErrors, globalError } = buildSpendValidationErrors(
    error,
    contributorCoverageError,
    t,
    contributorIndexMaps
  )
  const errorViewData = buildEstimatedSpendViewData(request, {
    existingValues: fundingValues,
    fieldErrors,
    cellErrors,
    globalError
  })

  return {
    validatedRows: null,
    errorResponse: h.view(
      PROJECT_VIEWS.FUNDING_SOURCES_ESTIMATED_SPEND,
      errorViewData
    )
  }
}

// --- Controller Class ------------------------------------------------------

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

    const { validatedRows, errorResponse } = validateAndRenderErrors(
      request,
      h,
      sessionData,
      fundingValues,
      config
    )

    if (errorResponse) {
      return errorResponse
    }

    const sanitisedRows = sanitiseZerosFromValidatedRows(validatedRows)

    updateSessionData(request, {
      [PROJECT_PAYLOAD_FIELDS.FUNDING_VALUES]: sanitisedRows
    })

    const saveViewData = buildEstimatedSpendViewData(request, {
      existingValues: sanitisedRows
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

// --- Singleton + exported controller object --------------------------------

const ctrl = new EstimatedSpendController()

export const estimatedSpendController = {
  getHandler: (req, h) => ctrl.getEstimatedSpend(req, h),
  postHandler: (req, h) => ctrl.postEstimatedSpend(req, h)
}
