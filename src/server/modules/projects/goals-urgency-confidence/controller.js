import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  PROJECT_PAYLOAD_FIELDS,
  REFERENCE_NUMBER_PARAM,
  URGENCY_REASONS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  extractApiError,
  extractJoiErrors
} from '../../../common/helpers/error-renderer/index.js'
import { GOALS_URGENCY_CONFIDENCE_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  updateSessionData
} from '../helpers/project-utils.js'
import { buildRadioItems } from '../helpers/radio-options.js'

const VIEW = PROJECT_VIEWS.GOALS_URGENCY_CONFIDENCE

// Payload level mappings for API submission
const PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.PROJECT_GOALS]: PROJECT_PAYLOAD_LEVELS.APPROACH,
  [PROJECT_STEPS.URGENCY_REASON]: PROJECT_PAYLOAD_LEVELS.URGENCY_REASON,
  [PROJECT_STEPS.URGENCY_DETAILS]: PROJECT_PAYLOAD_LEVELS.URGENCY_DETAILS,
  [PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED]:
    PROJECT_PAYLOAD_LEVELS.CONFIDENCE_HOMES_BETTER_PROTECTED,
  [PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR]:
    PROJECT_PAYLOAD_LEVELS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
  [PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING]:
    PROJECT_PAYLOAD_LEVELS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING
}

// Step sequence for navigation flow
const STEP_SEQUENCE = {
  [PROJECT_STEPS.PROJECT_GOALS]: ROUTES.PROJECT.OVERVIEW,
  [PROJECT_STEPS.URGENCY_REASON]: ROUTES.PROJECT.EDIT.URGENCY_DETAILS,
  [PROJECT_STEPS.URGENCY_DETAILS]: ROUTES.PROJECT.OVERVIEW,
  [PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED]:
    ROUTES.PROJECT.EDIT.CONFIDENCE_HOMES_BY_GATEWAY_FOUR,
  [PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR]:
    ROUTES.PROJECT.EDIT.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING,
  [PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING]:
    ROUTES.PROJECT.OVERVIEW
}

// Radio items configuration per step
const RADIO_CONFIG = {
  [PROJECT_STEPS.URGENCY_REASON]: {
    useHints: false
  },
  [PROJECT_STEPS.CONFIDENCE_HOMES_BETTER_PROTECTED]: {
    useHints: true,
    useBoldLabels: true
  },
  [PROJECT_STEPS.CONFIDENCE_HOMES_BY_GATEWAY_FOUR]: {
    useHints: true,
    useBoldLabels: true
  },
  [PROJECT_STEPS.CONFIDENCE_SECURED_PARTNERSHIP_FUNDING]: {
    useHints: true,
    useBoldLabels: true
  }
}

/**
 * Get the urgency detail heading key based on the selected urgency reason.
 * Each urgency reason has a specific heading in the translations.
 */
function _getUrgencyDetailHeading(request, sessionData) {
  const reason = sessionData.urgencyReason
  if (!reason || reason === URGENCY_REASONS.NOT_URGENT) {
    return null
  }
  const headingKey = `projects.project_urgency.urgency_detail.${reason}_heading`
  return request.t(headingKey)
}

/**
 * Extract the urgency reason text from the heading for use in validation messages.
 * Converts heading like "What is the business critical statutory need?"
 * to "the business critical statutory need".
 */
function _getUrgencyReasonText(headingText) {
  if (!headingText) {
    return ''
  }
  // Remove question mark and extract text after "What is"
  const match = headingText.match(/What is (.+)\?$/)
  return match ? match[1].toLowerCase() : headingText.toLowerCase()
}

/**
 * Goals, Urgency & Confidence Controller
 * A single controller handling character-count and radio field pages.
 * Only edit mode - always requires referenceNumber.
 */
class GoalsUrgencyConfidenceController {
  _getConfig(step) {
    return GOALS_URGENCY_CONFIDENCE_CONFIG[step]
  }

  _buildRadioItemsForStep(request, step, currentValue) {
    const radioConfig = RADIO_CONFIG[step]
    if (!radioConfig) {
      return null
    }

    const config = this._getConfig(step)
    return buildRadioItems(
      request.t,
      config.localKeyPrefix + '.options',
      null,
      currentValue,
      {
        useHints: radioConfig.useHints,
        useBoldLabels: radioConfig.useBoldLabels
      }
    )
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const sessionData = getSessionData(request)
    const { backLinkOptions, localKeyPrefix, fieldType, fieldName, maxLength } =
      config

    const additionalData = {
      step,
      fieldType,
      fieldName,
      maxLength: maxLength || 0,
      PROJECT_STEPS,
      PROJECT_PAYLOAD_FIELDS
    }

    // Build radio items if this is a radio step
    if (fieldType === 'radio') {
      additionalData.radioItems = this._buildRadioItemsForStep(
        request,
        step,
        sessionData[fieldName]
      )
    }

    // Urgency details has a dynamic heading based on urgency reason
    if (step === PROJECT_STEPS.URGENCY_DETAILS) {
      additionalData.dynamicHeading = _getUrgencyDetailHeading(
        request,
        sessionData
      )
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

  _getNextRoute(step, request) {
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData

    // Urgency reason: if not_urgent, skip urgency details and go to overview
    if (step === PROJECT_STEPS.URGENCY_REASON) {
      const urgencyReason = request.payload?.urgencyReason
      if (urgencyReason === URGENCY_REASONS.NOT_URGENT) {
        return ROUTES.PROJECT.OVERVIEW.replace(
          REFERENCE_NUMBER_PARAM,
          referenceNumber
        )
      }
    }

    const nextRoute = STEP_SEQUENCE[step]
    if (nextRoute) {
      return nextRoute.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
    }

    return ROUTES.PROJECT.OVERVIEW.replace(
      REFERENCE_NUMBER_PARAM,
      referenceNumber
    )
  }

  async get(request, h) {
    return h.view(VIEW, this._getViewData(request))
  }

  _getValidationMessageKey(errorCode) {
    if (errorCode?.includes('MAX_LENGTH')) {
      return 'max_length'
    }
    return 'required'
  }

  _handleValidationError(h, viewData, options) {
    const { fieldErrors, fieldName, fieldType, request, step } = options
    const enrichedViewData = { ...viewData, fieldErrors }

    // For character-count fields, determine which validation message to show
    if (fieldType === 'character-count' && fieldErrors[fieldName]) {
      enrichedViewData.validationMessageKey = this._getValidationMessageKey(
        fieldErrors[fieldName]
      )

      // For urgency details, add dynamic reason text to validation context
      if (step === PROJECT_STEPS.URGENCY_DETAILS && fieldErrors[fieldName]) {
        const sessionData = getSessionData(request)
        const headingText = _getUrgencyDetailHeading(request, sessionData)
        if (headingText) {
          const reasonText = _getUrgencyReasonText(headingText)
          enrichedViewData.validationContext = { reason: reasonText }
        }
      }
    }

    return h.view(VIEW, enrichedViewData)
  }

  async post(request, h) {
    updateSessionData(request, request.payload)
    const viewData = this._getViewData(request)
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const { schema, fieldName, fieldType } = config

    try {
      // Validate payload if schema exists
      if (schema) {
        const { error } = schema.validate(request.payload, {
          abortEarly: false
        })
        if (error) {
          const fieldErrors = extractJoiErrors(error)
          return this._handleValidationError(h, viewData, {
            fieldErrors,
            fieldName,
            fieldType,
            request,
            step
          })
        }
      }

      // Save project data
      const level = this._getPayloadLevel(step)
      const response = await saveProjectWithErrorHandling(
        request,
        h,
        level,
        viewData,
        VIEW
      )
      if (response) {
        return response
      }

      return h.redirect(this._getNextRoute(step, request)).takeover()
    } catch (error) {
      request.logger.error('Error in Goals Urgency Confidence POST', error)
      return h.view(VIEW, {
        ...viewData,
        error: extractApiError(error)
      })
    }
  }
}

const controller = new GoalsUrgencyConfidenceController()

export const goalsUrgencyConfidenceController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
