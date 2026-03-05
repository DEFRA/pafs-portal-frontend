import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  NFM_MEASURES,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { extractApiError } from '../../../common/helpers/error-renderer/index.js'
import { NFM_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
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
    PROJECT_PAYLOAD_LEVELS.NFM_HEADWATER_DRAINAGE
  // Add more NFM steps here as needed
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

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    let { backLinkOptions, localKeyPrefix, fieldType } = config
    const sessionData = getSessionData(request)

    // Get dynamic back link if applicable
    const dynamicBackLink = getDynamicBackLink(step, sessionData)
    if (dynamicBackLink) {
      backLinkOptions = dynamicBackLink
    }

    const additionalData = {
      step,
      projectSteps: PROJECT_STEPS,
      fieldType,
      nfmMeasureOptions: this._getNfmMeasureOptions(request),
      columnWidth: 'full'
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
      return h
        .redirect(nextRoute.replace('{referenceNumber}', referenceNumber))
        .takeover()
    }

    // Fallback to overview
    return navigateToProjectOverview(referenceNumber, h)
  }

  _getViewTemplate(step) {
    switch (step) {
      case PROJECT_STEPS.NFM_SELECTED_MEASURES:
        return PROJECT_VIEWS.NFM
      case PROJECT_STEPS.NFM_RIVER_RESTORATION:
        return PROJECT_VIEWS.NFM_RIVER_RESTORATION
      case PROJECT_STEPS.NFM_LEAKY_BARRIERS:
        return PROJECT_VIEWS.NFM_LEAKY_BARRIERS
      case PROJECT_STEPS.NFM_OFFLINE_STORAGE:
        return PROJECT_VIEWS.NFM_OFFLINE_STORAGE
      case PROJECT_STEPS.NFM_WOODLAND:
        return PROJECT_VIEWS.NFM_WOODLAND
      case PROJECT_STEPS.NFM_HEADWATER_DRAINAGE:
        return PROJECT_VIEWS.NFM_HEADWATER_DRAINAGE
      default:
        return PROJECT_VIEWS.NFM
    }
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

      // Validate payload BEFORE processing (validate array format)
      const validationError = validatePayload(request, h, {
        template,
        schema,
        viewData
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
        return response
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
