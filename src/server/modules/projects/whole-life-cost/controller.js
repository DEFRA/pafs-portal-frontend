import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  extractApiError,
  extractJoiErrors
} from '../../../common/helpers/error-renderer/index.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import {
  getWlcSchemaForProjectType,
  WLC_HIDDEN_PROJECT_TYPES,
  WLC_MANDATORY_PROJECT_TYPES
} from '../schemas/wlc-schema.js'

const VIEW = PROJECT_VIEWS.WHOLE_LIFE_COST
const LOCAL_KEY_PREFIX = 'projects.whole_life_cost'
const STEP = PROJECT_STEPS.WHOLE_LIFE_COST

/**
 * WLC field name list — the 4 cost inputs on the form.
 */
const WLC_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_WHOLE_LIFE_PV_COSTS,
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_DESIGN_CONSTRUCTION_COSTS,
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_RISK_CONTINGENCY_COSTS,
  PROJECT_PAYLOAD_FIELDS.WLC_ESTIMATED_FUTURE_COSTS
]

const sanitizeWlcPayload = (payload = {}) => {
  const sanitized = { ...payload }

  WLC_FIELDS.forEach((field) => {
    const value = sanitized[field]
    if (typeof value === 'string') {
      sanitized[field] = value.replaceAll(',', '').trim()
    }
  })

  return sanitized
}

/**
 * Whole Life Cost Controller
 *
 * Single-step edit-only page. Behaviour varies by project type:
 *  - DEF / REF / REP → all 4 fields mandatory
 *  - ELO / HCR       → all 4 fields optional (labels appended with "(if known)")
 *  - STR / STU       → section hidden, redirect to overview
 */
class WholeLifeCostController {
  _getProjectType(request) {
    const sessionData = getSessionData(request)
    return sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
  }

  _isHiddenForProjectType(projectType) {
    return WLC_HIDDEN_PROJECT_TYPES.includes(projectType)
  }

  _isMandatory(projectType) {
    return WLC_MANDATORY_PROJECT_TYPES.includes(projectType)
  }

  _buildViewData(request, extraData = {}) {
    const sessionData = getSessionData(request)
    const projectType = sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
    const isMandatory = this._isMandatory(projectType)

    return buildViewData(request, {
      localKeyPrefix: LOCAL_KEY_PREFIX,
      backLinkOptions: {
        targetEditURL: ROUTES.PROJECT.OVERVIEW,
        conditionalRedirect: true
      },
      additionalData: {
        step: STEP,
        wlcFields: WLC_FIELDS,
        isMandatory,
        columnWidth: 'full',
        PROJECT_PAYLOAD_FIELDS,
        ...extraData
      }
    })
  }

  async get(request, h) {
    const projectType = this._getProjectType(request)

    if (this._isHiddenForProjectType(projectType)) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    return h.view(VIEW, this._buildViewData(request))
  }

  async post(request, h) {
    const projectType = this._getProjectType(request)

    if (this._isHiddenForProjectType(projectType)) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    const sanitizedPayload = sanitizeWlcPayload(request.payload)

    // Store submitted values in session before validation (for re-rendering on error)
    updateSessionData(request, sanitizedPayload)

    const schema = getWlcSchemaForProjectType(projectType)

    // Run frontend validation
    if (schema) {
      const { error } = schema.validate(sanitizedPayload, {
        abortEarly: false
      })
      if (error) {
        const fieldErrors = extractJoiErrors(error)
        const errorViewData = this._buildViewData(request, { fieldErrors })
        return h.view(VIEW, errorViewData)
      }
    }

    const viewData = this._buildViewData(request)

    try {
      const response = await saveProjectWithErrorHandling(
        request,
        h,
        PROJECT_PAYLOAD_LEVELS.WHOLE_LIFE_COST,
        viewData,
        VIEW
      )
      if (response) {
        return response
      }

      const { slug: referenceNumber } = getSessionData(request)
      return h
        .redirect(
          ROUTES.PROJECT.OVERVIEW.replace(
            REFERENCE_NUMBER_PARAM,
            referenceNumber
          )
        )
        .takeover()
    } catch (error) {
      request.logger.error('Error in Whole Life Cost POST', error)
      return h.view(VIEW, {
        ...viewData,
        error: extractApiError(error)
      })
    }
  }
}

const controller = new WholeLifeCostController()

export const wholeLifeCostController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
