import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  NFM_EXPERIENCE_LEVEL_OPTIONS,
  NFM_LAND_TYPES,
  NFM_LANDOWNER_CONSENT_OPTIONS,
  NFM_MEASURES,
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  NFM_PROJECT_READINESS_OPTIONS
} from '../../../common/constants/projects.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { NFM_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import { refreshSessionFromBackend } from '../helpers/session-refresh.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData,
  validatePayload
} from '../helpers/project-utils.js'
import {
  getDynamicBackLink,
  NFM_STEP_SEQUENCE
} from './helpers/navigation-helpers.js'
import { processPayload } from './helpers/payload-helpers.js'
import { handleConditionalRedirect } from './helpers/redirect-helpers.js'

// Payload level mappings for API submission
const PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.NFM_SELECTED_MEASURES]:
    PROJECT_PAYLOAD_LEVELS.NFM_SELECTED_MEASURES,
  [PROJECT_STEPS.NFM_RIVER_RESTORATION]:
    PROJECT_PAYLOAD_LEVELS.NFM_RIVER_RESTORATION,
  [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: PROJECT_PAYLOAD_LEVELS.NFM_LEAKY_BARRIERS,
  [PROJECT_STEPS.NFM_OFFLINE_STORAGE]:
    PROJECT_PAYLOAD_LEVELS.NFM_OFFLINE_STORAGE,
  [PROJECT_STEPS.NFM_WOODLAND]: PROJECT_PAYLOAD_LEVELS.NFM_WOODLAND,
  [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]:
    PROJECT_PAYLOAD_LEVELS.NFM_HEADWATER_DRAINAGE,
  [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]:
    PROJECT_PAYLOAD_LEVELS.NFM_RUNOFF_MANAGEMENT,
  [PROJECT_STEPS.NFM_SALTMARSH]: PROJECT_PAYLOAD_LEVELS.NFM_SALTMARSH,
  [PROJECT_STEPS.NFM_SAND_DUNE]: PROJECT_PAYLOAD_LEVELS.NFM_SAND_DUNE,
  [PROJECT_STEPS.NFM_LAND_USE_CHANGE]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_CHANGE,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND,
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND,
  [PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND,
  [PROJECT_STEPS.NFM_LAND_USE_WOODLAND]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_WOODLAND,
  [PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH,
  [PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_PEATLAND_RESTORATION,
  [PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER,
  [PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS]:
    PROJECT_PAYLOAD_LEVELS.NFM_LAND_USE_COASTAL_MARGINS,
  [PROJECT_STEPS.NFM_LANDOWNER_CONSENT]:
    PROJECT_PAYLOAD_LEVELS.NFM_LANDOWNER_CONSENT,
  [PROJECT_STEPS.NFM_EXPERIENCE]: PROJECT_PAYLOAD_LEVELS.NFM_EXPERIENCE_LEVEL,
  [PROJECT_STEPS.NFM_PROJECT_READINESS]:
    PROJECT_PAYLOAD_LEVELS.NFM_PROJECT_READINESS
}

/**
 * Maps each land-use detail step to its before/after field names
 * Used by the generic land-use-detail template
 */
const LAND_USE_DETAIL_FIELD_CONFIG = {
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_ARABLE_FARMLAND]: {
    beforeFieldName: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_ARABLE_FARMLAND_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_LIVESTOCK_FARMLAND]: {
    beforeFieldName:
      PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_LIVESTOCK_FARMLAND_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_LIVESTOCK_FARMLAND_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_ENCLOSED_DAIRYING_FARMLAND]: {
    beforeFieldName:
      PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_DAIRYING_FARMLAND_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_ENCLOSED_DAIRYING_FARMLAND_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_SEMI_NATURAL_GRASSLAND]: {
    beforeFieldName: PROJECT_PAYLOAD_FIELDS.NFM_SEMI_NATURAL_GRASSLAND_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_SEMI_NATURAL_GRASSLAND_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_WOODLAND]: {
    beforeFieldName: PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_WOODLAND_LAND_USE_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_MOUNTAIN_MOORS_AND_HEATH]: {
    beforeFieldName: PROJECT_PAYLOAD_FIELDS.NFM_MOUNTAIN_MOORS_AND_HEATH_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_MOUNTAIN_MOORS_AND_HEATH_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_PEATLAND_RESTORATION]: {
    beforeFieldName: PROJECT_PAYLOAD_FIELDS.NFM_PEATLAND_RESTORATION_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_PEATLAND_RESTORATION_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_RIVERS_WETLANDS_FRESHWATER]: {
    beforeFieldName:
      PROJECT_PAYLOAD_FIELDS.NFM_RIVERS_WETLANDS_FRESHWATER_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_RIVERS_WETLANDS_FRESHWATER_AFTER
  },
  [PROJECT_STEPS.NFM_LAND_USE_COASTAL_MARGINS]: {
    beforeFieldName: PROJECT_PAYLOAD_FIELDS.NFM_COASTAL_MARGINS_BEFORE,
    afterFieldName: PROJECT_PAYLOAD_FIELDS.NFM_COASTAL_MARGINS_AFTER
  }
}

/**
 * NFM (Natural Flood Management) Controller
 * Handles all NFM section pages
 * Only update mode - always requires referenceNumber
 */
class NfmController {
  _getConfig(step) {
    return NFM_CONFIG[step]
  }

  _getNfmMeasureOptions(request) {
    const localKeyPrefix = 'projects.nfm.selected_measures'
    return [
      {
        text: request.t(
          `${localKeyPrefix}.options.river_floodplain_restoration`
        ),
        value: NFM_MEASURES.RIVER_FLOODPLAIN_RESTORATION
      },
      {
        text: request.t(`${localKeyPrefix}.options.leaky_barriers`),
        value: NFM_MEASURES.LEAKY_BARRIERS
      },
      {
        text: request.t(`${localKeyPrefix}.options.offline_storage`),
        value: NFM_MEASURES.OFFLINE_STORAGE
      },
      {
        text: request.t(`${localKeyPrefix}.options.woodland`),
        value: NFM_MEASURES.WOODLAND
      },
      {
        text: request.t(`${localKeyPrefix}.options.headwater_drainage`),
        value: NFM_MEASURES.HEADWATER_DRAINAGE
      },
      {
        text: request.t(`${localKeyPrefix}.options.runoff_management`),
        value: NFM_MEASURES.RUNOFF_MANAGEMENT
      },
      {
        text: request.t(`${localKeyPrefix}.options.saltmarsh_management`),
        value: NFM_MEASURES.SALTMARSH_MANAGEMENT
      },
      {
        text: request.t(`${localKeyPrefix}.options.sand_dune_management`),
        value: NFM_MEASURES.SAND_DUNE_MANAGEMENT
      }
    ]
  }

  _getNfmLandUseOptions(request) {
    const localKeyPrefix = 'projects.nfm.land_use_change'
    return [
      {
        text: request.t(`${localKeyPrefix}.options.enclosed_arable_farmland`),
        value: NFM_LAND_TYPES.ENCLOSED_ARABLE_FARMLAND
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.enclosed_livestock_farmland`
        ),
        value: NFM_LAND_TYPES.ENCLOSED_LIVESTOCK_FARMLAND
      },
      {
        text: request.t(`${localKeyPrefix}.options.enclosed_dairying_farmland`),
        value: NFM_LAND_TYPES.ENCLOSED_DAIRYING_FARMLAND
      },
      {
        text: request.t(`${localKeyPrefix}.options.semi_natural_grassland`),
        value: NFM_LAND_TYPES.SEMI_NATURAL_GRASSLAND
      },
      {
        text: request.t(`${localKeyPrefix}.options.woodland`),
        value: NFM_LAND_TYPES.WOODLAND
      },
      {
        text: request.t(`${localKeyPrefix}.options.mountain_moors_and_heath`),
        value: NFM_LAND_TYPES.MOUNTAIN_MOORS_AND_HEATH
      },
      {
        text: request.t(`${localKeyPrefix}.options.peatland_restoration`),
        value: NFM_LAND_TYPES.PEATLAND_RESTORATION
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.rivers_wetlands_and_freshwater_habitats`
        ),
        value: NFM_LAND_TYPES.RIVERS_WETLANDS_FRESHWATER_HABITATS
      },
      {
        text: request.t(`${localKeyPrefix}.options.coastal_margins`),
        value: NFM_LAND_TYPES.COASTAL_MARGINS
      }
    ]
  }

  _getNfmLandownerConsentOptions(request) {
    const localKeyPrefix = 'projects.nfm.landowner_consent'
    return [
      {
        text: request.t(`${localKeyPrefix}.options.consent_fully_secured`),
        value: NFM_LANDOWNER_CONSENT_OPTIONS.CONSENT_FULLY_SECURED
      },
      {
        text: request.t(
          `${localKeyPrefix}.options.engaged_but_not_fully_secured`
        ),
        value: NFM_LANDOWNER_CONSENT_OPTIONS.ENGAGED_BUT_NOT_FULLY_SECURED
      },
      {
        text: request.t(`${localKeyPrefix}.options.initial_contact_made`),
        value: NFM_LANDOWNER_CONSENT_OPTIONS.INITIAL_CONTACT_MADE
      },
      {
        text: request.t(`${localKeyPrefix}.options.not_yet_engaged`),
        value: NFM_LANDOWNER_CONSENT_OPTIONS.NOT_YET_ENGAGED
      }
    ]
  }

  _getNfmExperienceOptions(request) {
    const localKeyPrefix = 'projects.nfm.experience'
    return [
      {
        text: request.t(`${localKeyPrefix}.options.no_experience`),
        value: NFM_EXPERIENCE_LEVEL_OPTIONS.NO_EXPERIENCE
      },
      {
        text: request.t(`${localKeyPrefix}.options.some_experience`),
        value: NFM_EXPERIENCE_LEVEL_OPTIONS.SOME_EXPERIENCE
      },
      {
        text: request.t(`${localKeyPrefix}.options.moderate_experience`),
        value: NFM_EXPERIENCE_LEVEL_OPTIONS.MODERATE_EXPERIENCE
      },
      {
        text: request.t(`${localKeyPrefix}.options.extensive_experience`),
        value: NFM_EXPERIENCE_LEVEL_OPTIONS.EXTENSIVE_EXPERIENCE
      }
    ]
  }

  _getNfmProjectReadinessOptions(request) {
    const localKeyPrefix = 'projects.nfm.project_readiness'
    return [
      {
        text: request.t(`${localKeyPrefix}.options.early_concept`),
        value: NFM_PROJECT_READINESS_OPTIONS.EARLY_CONCEPT
      },
      {
        text: request.t(`${localKeyPrefix}.options.developing_proposal`),
        value: NFM_PROJECT_READINESS_OPTIONS.DEVELOPING_PROPOSAL
      },
      {
        text: request.t(`${localKeyPrefix}.options.well_developed_proposal`),
        value: NFM_PROJECT_READINESS_OPTIONS.WELL_DEVELOPED_PROPOSAL
      },
      {
        text: request.t(`${localKeyPrefix}.options.ready_to_deliver`),
        value: NFM_PROJECT_READINESS_OPTIONS.READY_TO_DELIVER
      }
    ]
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    let {
      backLinkOptions,
      localKeyPrefix,
      fieldType,
      inputFields,
      radioFieldName,
      radioOptionsType
    } = config
    const sessionData = getSessionData(request)

    // Get dynamic back link if applicable
    const dynamicBackLink = getDynamicBackLink(step, sessionData)
    if (dynamicBackLink) {
      backLinkOptions = dynamicBackLink
    }

    const fieldNameMap = {
      [PROJECT_STEPS.NFM_LANDOWNER_CONSENT]:
        PROJECT_PAYLOAD_FIELDS.NFM_LANDOWNER_CONSENT,
      [PROJECT_STEPS.NFM_EXPERIENCE]:
        PROJECT_PAYLOAD_FIELDS.NFM_EXPERIENCE_LEVEL,
      [PROJECT_STEPS.NFM_PROJECT_READINESS]:
        PROJECT_PAYLOAD_FIELDS.NFM_PROJECT_READINESS
    }

    const radioOptionsByType = {
      landownerConsent: this._getNfmLandownerConsentOptions(request),
      experience: this._getNfmExperienceOptions(request),
      projectReadiness: this._getNfmProjectReadinessOptions(request)
    }

    const landUseFieldConfig = LAND_USE_DETAIL_FIELD_CONFIG[step]
    const additionalData = {
      step,
      projectSteps: PROJECT_STEPS,
      fieldType,
      fieldName: fieldNameMap[step],
      inputFields,
      radioFieldName,
      radioOptions: radioOptionsType
        ? radioOptionsByType[radioOptionsType]
        : undefined,
      nfmMeasureOptions: this._getNfmMeasureOptions(request),
      nfmLandUseOptions: this._getNfmLandUseOptions(request),
      nfmLandownerConsentOptions: this._getNfmLandownerConsentOptions(request),
      nfmExperienceOptions: this._getNfmExperienceOptions(request),
      nfmProjectReadinessOptions: this._getNfmProjectReadinessOptions(request),
      columnWidth: 'full',
      ...(landUseFieldConfig && {
        beforeFieldName: landUseFieldConfig.beforeFieldName,
        afterFieldName: landUseFieldConfig.afterFieldName
      })
    }

    return buildViewData(request, {
      localKeyPrefix,
      backLinkOptions,
      additionalData
    })
  }

  _getPayloadLevel(step) {
    return PAYLOAD_LEVEL_MAP[step]
  }

  async _postRedirect(request, h) {
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData
    const step = getProjectStep(request)

    // Handle conditional redirects
    const conditionalRedirect = await handleConditionalRedirect(
      step,
      request,
      h,
      sessionData,
      referenceNumber
    )

    if (conditionalRedirect) {
      return conditionalRedirect
    }

    // For all other cases, move to the next step in sequence
    const nextRoute = NFM_STEP_SEQUENCE[step]
    if (nextRoute) {
      const redirectUrl = nextRoute.replace(
        '{referenceNumber}',
        referenceNumber
      )
      return h.redirect(redirectUrl).takeover()
    }

    // Fallback to overview
    return navigateToProjectOverview(referenceNumber, h)
  }

  _getViewTemplate(step) {
    if (step in LAND_USE_DETAIL_FIELD_CONFIG) {
      return PROJECT_VIEWS.NFM_LAND_USE_DETAIL
    }

    const STEP_VIEW_MAP = {
      [PROJECT_STEPS.NFM_SELECTED_MEASURES]: PROJECT_VIEWS.NFM,
      [PROJECT_STEPS.NFM_RIVER_RESTORATION]:
        PROJECT_VIEWS.NFM_RIVER_RESTORATION,
      [PROJECT_STEPS.NFM_LEAKY_BARRIERS]: PROJECT_VIEWS.NFM_LEAKY_BARRIERS,
      [PROJECT_STEPS.NFM_OFFLINE_STORAGE]: PROJECT_VIEWS.NFM_OFFLINE_STORAGE,
      [PROJECT_STEPS.NFM_WOODLAND]: PROJECT_VIEWS.NFM_WOODLAND,
      [PROJECT_STEPS.NFM_HEADWATER_DRAINAGE]:
        PROJECT_VIEWS.NFM_HEADWATER_DRAINAGE,
      [PROJECT_STEPS.NFM_RUNOFF_MANAGEMENT]:
        PROJECT_VIEWS.NFM_RUNOFF_MANAGEMENT,
      [PROJECT_STEPS.NFM_SALTMARSH]: PROJECT_VIEWS.NFM_SALTMARSH,
      [PROJECT_STEPS.NFM_SAND_DUNE]: PROJECT_VIEWS.NFM_SAND_DUNE,
      [PROJECT_STEPS.NFM_LAND_USE_CHANGE]: PROJECT_VIEWS.NFM_LAND_USE_CHANGE,
      [PROJECT_STEPS.NFM_LANDOWNER_CONSENT]:
        PROJECT_VIEWS.NFM_LANDOWNER_CONSENT,
      [PROJECT_STEPS.NFM_EXPERIENCE]: PROJECT_VIEWS.NFM_EXPERIENCE,
      [PROJECT_STEPS.NFM_PROJECT_READINESS]: PROJECT_VIEWS.NFM_PROJECT_READINESS
    }

    return STEP_VIEW_MAP[step] ?? PROJECT_VIEWS.NFM
  }

  async get(request, h) {
    const step = getProjectStep(request)
    return h.view(this._getViewTemplate(step), this._getViewData(request))
  }

  async _postSubmission(request, h) {
    const step = getProjectStep(request)
    const viewData = this._getViewData(request)
    const level = this._getPayloadLevel(step)
    const template = this._getViewTemplate(step)

    return saveProjectWithErrorHandling(request, h, level, viewData, template)
  }

  async post(request, h) {
    const step = getProjectStep(request)
    const viewData = this._getViewData(request)
    const config = this._getConfig(step)
    const { schema } = config
    const template = this._getViewTemplate(step)
    const sessionData = getSessionData(request)

    try {
      // Normalize nfmSelectedMeasures to array BEFORE validation (HTML forms send single checkbox as string)
      if (
        step === PROJECT_STEPS.NFM_SELECTED_MEASURES &&
        request.payload.nfmSelectedMeasures &&
        !Array.isArray(request.payload.nfmSelectedMeasures)
      ) {
        request.payload.nfmSelectedMeasures = [
          request.payload.nfmSelectedMeasures
        ]
      }

      if (
        step === PROJECT_STEPS.NFM_LAND_USE_CHANGE &&
        request.payload.nfmLandUseChange &&
        !Array.isArray(request.payload.nfmLandUseChange)
      ) {
        request.payload.nfmLandUseChange = [request.payload.nfmLandUseChange]
      }

      // Validate payload BEFORE processing (validate array format)
      const validationError = validatePayload(request, h, {
        template,
        schema,
        viewData,
        formData: request.payload
      })
      if (validationError) {
        return validationError
      }

      // Process and normalize payload (convert array to string for session/API)
      // Pass sessionData for NFM_SELECTED_MEASURES to detect changes
      processPayload(step, request.payload, sessionData)

      // Save form data to session
      updateSessionData(request, request.payload)

      const response = await this._postSubmission(request, h)
      if (response) {
        // If _postSubmission returns a response (e.g. error or redirect), return it
        return response
      }

      // Global: Refresh session from backend after save
      const referenceNumber = request.params?.referenceNumber || ''
      if (referenceNumber) {
        await refreshSessionFromBackend(request, referenceNumber)
      }

      return await this._postRedirect(request, h)
    } catch (error) {
      request.logger.error('Error NFM POST', error)
      return h.view(template, {
        ...viewData,
        error: extractApiError(request, error)
      })
    }
  }
}

const controller = new NfmController()

export const nfmController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
