import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM,
  WLB_MANDATORY_PROJECT_TYPES,
  WLB_HIDDEN_PROJECT_TYPES
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
import { getWlbSchemaForProjectType } from '../schemas/wlb-schemas.js'

const VIEW = PROJECT_VIEWS.WHOLE_LIFE_BENEFITS
const LOCAL_KEY_PREFIX = 'projects.whole_life_benefits'
const STEP = PROJECT_STEPS.WHOLE_LIFE_BENEFITS

/**
 * WLB field name list — the 5 estimate inputs on the form.
 */
const WLB_FIELDS = [
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_WHOLE_LIFE_BENEFITS,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_PROPERTY_DAMAGES_AVOIDED,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_ENVIRONMENTAL_BENEFITS,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_RECREATION_TOURISM_BENEFITS,
  PROJECT_PAYLOAD_FIELDS.ESTIMATED_LAND_VALUE_UPLIFT_BENEFITS
]

const sanitizeWlbPayload = (payload = {}) => {
  const sanitized = { ...payload }

  WLB_FIELDS.forEach((field) => {
    const value = sanitized[field]
    if (typeof value === 'string') {
      sanitized[field] = value.replaceAll(',', '').trim()
    }
  })

  return sanitized
}

/**
 * Whole Life Benefits Controller
 *
 * Single-step edit-only page. Behaviour varies by project type:
 *  - DEF / REF / REP → First field (Estimated whole life present value benefits) is mandatory, remaining fields are optional
 *  - ELO / HCR       → all 5 fields optional (labels appended with "(if known)")
 *  - STR / STU       → section hidden, redirect to overview
 */
class WholeLifeBenefitsController {
  _getProjectType(request) {
    const sessionData = getSessionData(request)
    return sessionData[PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE]
  }

  _isHiddenForProjectType(projectType) {
    return WLB_HIDDEN_PROJECT_TYPES.includes(projectType)
  }

  _isMandatory(projectType) {
    return WLB_MANDATORY_PROJECT_TYPES.includes(projectType)
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
        wlbFields: WLB_FIELDS,
        isMandatory,
        columnWidth: 'full',
        PROJECT_PAYLOAD_FIELDS,
        ...extraData
      }
    })
  }

  async post(request, h) {
    const projectType = this._getProjectType(request)

    if (this._isHiddenForProjectType(projectType)) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    const sanitizedPayload = sanitizeWlbPayload(request.payload)

    // Store submitted values in session before validation (for re-rendering on error)
    updateSessionData(request, sanitizedPayload)

    const schema = getWlbSchemaForProjectType(projectType)

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
        PROJECT_PAYLOAD_LEVELS.WHOLE_LIFE_BENEFITS,
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
      request.logger.error('Error in Whole Life Benefits POST', error)
      return h.view(VIEW, {
        ...viewData,
        error: extractApiError(error)
      })
    }
  }

  async get(request, h) {
    const projectType = this._getProjectType(request)

    if (this._isHiddenForProjectType(projectType)) {
      return navigateToProjectOverview(request.params.referenceNumber, h)
    }

    return h.view(VIEW, this._buildViewData(request))
  }
}

const controller = new WholeLifeBenefitsController()

export const wholeLifeBenefitsController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
