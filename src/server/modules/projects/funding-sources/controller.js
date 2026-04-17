import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { FUNDING_SOURCES_CONFIG } from '../helpers/config/funding-sources.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import {
  nextRouteAfterSelection,
  nextRouteAfterAdditional
} from './helpers/navigation-helpers.js'
import { clearFundingValueFields } from './helpers/payload-helpers.js'

// -- Re-export contributor and estimated spend controllers --------------------

export {
  publicContributorsController,
  privateContributorsController,
  otherEaContributorsController,
  publicContributorsDeleteController,
  privateContributorsDeleteController,
  otherEaContributorsDeleteController
} from './helpers/controller-contributors.js'

export { estimatedSpendController } from './helpers/controller-estimated-spend.js'

// -- Additional GIA sub-source field list -------------------------------------

const ADDITIONAL_GIA_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.ASSET_REPLACEMENT_ALLOWANCE,
  PROJECT_PAYLOAD_FIELDS.ENVIRONMENT_STATUTORY_FUNDING,
  PROJECT_PAYLOAD_FIELDS.FREQUENTLY_FLOODED_COMMUNITIES,
  PROJECT_PAYLOAD_FIELDS.OTHER_ADDITIONAL_GRANT_IN_AID,
  PROJECT_PAYLOAD_FIELDS.OTHER_GOVERNMENT_DEPARTMENT,
  PROJECT_PAYLOAD_FIELDS.RECOVERY,
  PROJECT_PAYLOAD_FIELDS.SUMMER_ECONOMIC_FUND
]

// -- Controller Class ---------------------------------------------------------

class FundingSourcesSelectionController {
  // -- Step 1: Main funding sources selection ---------------------------------

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
      const errorViewData = buildViewData(request, {
        localKeyPrefix: config.localKeyPrefix,
        backLinkOptions: config.backLinkOptions,
        additionalData: {
          step,
          fieldErrors,
          PROJECT_PAYLOAD_FIELDS
        }
      })
      return h.view(PROJECT_VIEWS.FUNDING_SOURCES, errorViewData)
    }

    const saveViewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions: config.backLinkOptions
    })

    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.FUNDING_SOURCES_SELECTED,
      saveViewData,
      PROJECT_VIEWS.FUNDING_SOURCES
    )
    if (saveError) {
      return saveError
    }

    if (!normalised.additionalFcermGia) {
      const resetFlags = {}
      for (const field of ADDITIONAL_GIA_FIELDS) {
        resetFlags[field] = false
      }
      updateSessionData(request, resetFlags)
      clearFundingValueFields(request, ADDITIONAL_GIA_FIELDS)
    }

    const sessionData = getSessionData(request)
    return h
      .redirect(nextRouteAfterSelection(sessionData, referenceNumber))
      .takeover()
  }

  // -- Step 2: Additional FCRM GIA sources ------------------------------------

  async getAdditionalSources(request, h) {
    const sessionData = getSessionData(request)
    const step = PROJECT_STEPS.FUNDING_SOURCES_ADDITIONAL
    const config = FUNDING_SOURCES_CONFIG[step]

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

    const normalised = {}
    for (const field of ADDITIONAL_GIA_FIELDS) {
      normalised[field] = request.payload[field] === 'true'
    }

    updateSessionData(request, normalised)

    const { error } = config.schema.validate(normalised, { abortEarly: false })
    if (error) {
      const fieldErrors = extractJoiErrors(error)
      const errorViewData = buildViewData(request, {
        localKeyPrefix: config.localKeyPrefix,
        backLinkOptions: config.backLinkOptions,
        additionalData: { step, fieldErrors, PROJECT_PAYLOAD_FIELDS }
      })
      return h.view(PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL, errorViewData)
    }

    const saveViewData = buildViewData(request, {
      localKeyPrefix: config.localKeyPrefix,
      backLinkOptions: config.backLinkOptions
    })

    const saveError = await saveProjectWithErrorHandling(
      request,
      h,
      PROJECT_PAYLOAD_LEVELS.ADDITIONAL_FUNDING_SOURCES_GIA_SELECTED,
      saveViewData,
      PROJECT_VIEWS.FUNDING_SOURCES_ADDITIONAL
    )
    if (saveError) {
      return saveError
    }

    const deselectedFields = ADDITIONAL_GIA_FIELDS.filter(
      (field) => !normalised[field]
    )
    if (deselectedFields.length) {
      clearFundingValueFields(request, deselectedFields)
    }

    const updated = getSessionData(request)
    return h
      .redirect(nextRouteAfterAdditional(updated, referenceNumber))
      .takeover()
  }
}

// -- Exported handler objects -------------------------------------------------

const ctrl = new FundingSourcesSelectionController()

export const fundingSourcesSelectionController = {
  getHandler: (req, h) => ctrl.getSelection(req, h),
  postHandler: (req, h) => ctrl.postSelection(req, h)
}

export const additionalFundingSourcesController = {
  getHandler: (req, h) => ctrl.getAdditionalSources(req, h),
  postHandler: (req, h) => ctrl.postAdditionalSources(req, h)
}
