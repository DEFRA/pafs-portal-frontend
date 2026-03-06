import {
  PROJECT_VIEWS,
  BOOLEAN_OPTION_VALUES
} from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { extractJoiErrors } from '../../../common/helpers/error-renderer/index.js'
import { ENVIRONMENTAL_BENEFITS_CONFIG } from '../helpers/project-config.js'
import { saveProjectWithErrorHandling } from '../helpers/project-submission.js'
import {
  buildViewData,
  getProjectStep,
  getSessionData,
  navigateToProjectOverview,
  updateSessionData
} from '../helpers/project-utils.js'
import { buildRadioItems } from '../helpers/radio-options.js'

const VIEW = PROJECT_VIEWS.ENVIRONMENTAL_BENEFITS

// Radio button value constants
const RADIO_VALUE_YES = BOOLEAN_OPTION_VALUES.YES
const RADIO_VALUE_NO = BOOLEAN_OPTION_VALUES.NO

// Payload level mappings for API submission
const PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.ENVIRONMENTAL_BENEFITS]:
    PROJECT_PAYLOAD_LEVELS.ENVIRONMENTAL_BENEFITS,
  [PROJECT_STEPS.INTERTIDAL_HABITAT]: PROJECT_PAYLOAD_LEVELS.INTERTIDAL_HABITAT,
  [PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.WOODLAND]: PROJECT_PAYLOAD_LEVELS.WOODLAND,
  [PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.WET_WOODLAND]: PROJECT_PAYLOAD_LEVELS.WET_WOODLAND,
  [PROJECT_STEPS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND]:
    PROJECT_PAYLOAD_LEVELS.WETLAND_OR_WET_GRASSLAND,
  [PROJECT_STEPS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.GRASSLAND]: PROJECT_PAYLOAD_LEVELS.GRASSLAND,
  [PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.HEATHLAND]: PROJECT_PAYLOAD_LEVELS.HEATHLAND,
  [PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.PONDS_LAKES]: PROJECT_PAYLOAD_LEVELS.PONDS_LAKES,
  [PROJECT_STEPS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.ARABLE_LAND]: PROJECT_PAYLOAD_LEVELS.ARABLE_LAND,
  [PROJECT_STEPS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED]:
    PROJECT_PAYLOAD_LEVELS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.COMPREHENSIVE_RESTORATION]:
    PROJECT_PAYLOAD_LEVELS.COMPREHENSIVE_RESTORATION,
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE]:
    PROJECT_PAYLOAD_LEVELS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
  [PROJECT_STEPS.PARTIAL_RESTORATION]:
    PROJECT_PAYLOAD_LEVELS.PARTIAL_RESTORATION,
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL]:
    PROJECT_PAYLOAD_LEVELS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
  [PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE]:
    PROJECT_PAYLOAD_LEVELS.CREATE_HABITAT_WATERCOURSE,
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE]:
    PROJECT_PAYLOAD_LEVELS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE
}

// Gate question sequence - defines the order of gate questions
const GATE_SEQUENCE = [
  PROJECT_STEPS.INTERTIDAL_HABITAT,
  PROJECT_STEPS.WOODLAND,
  PROJECT_STEPS.WET_WOODLAND,
  PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND,
  PROJECT_STEPS.GRASSLAND,
  PROJECT_STEPS.HEATHLAND,
  PROJECT_STEPS.PONDS_LAKES,
  PROJECT_STEPS.ARABLE_LAND,
  PROJECT_STEPS.COMPREHENSIVE_RESTORATION,
  PROJECT_STEPS.PARTIAL_RESTORATION,
  PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE
]

// Map gate steps to their quantity steps
const GATE_TO_QUANTITY_MAP = {
  [PROJECT_STEPS.INTERTIDAL_HABITAT]:
    ROUTES.PROJECT.EDIT.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.WOODLAND]:
    ROUTES.PROJECT.EDIT.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.WET_WOODLAND]:
    ROUTES.PROJECT.EDIT.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND]:
    ROUTES.PROJECT.EDIT
      .HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.GRASSLAND]:
    ROUTES.PROJECT.EDIT.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.HEATHLAND]:
    ROUTES.PROJECT.EDIT.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.PONDS_LAKES]:
    ROUTES.PROJECT.EDIT.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.ARABLE_LAND]:
    ROUTES.PROJECT.EDIT
      .HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
  [PROJECT_STEPS.COMPREHENSIVE_RESTORATION]:
    ROUTES.PROJECT.EDIT
      .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
  [PROJECT_STEPS.PARTIAL_RESTORATION]:
    ROUTES.PROJECT.EDIT.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
  [PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE]:
    ROUTES.PROJECT.EDIT.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE
}

// Map quantity steps to next gate step
const QUANTITY_TO_NEXT_GATE_MAP = {
  [PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.WOODLAND,
  [PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.WET_WOODLAND,
  [PROJECT_STEPS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.WETLAND_OR_WET_GRASSLAND,
  [PROJECT_STEPS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.GRASSLAND,
  [PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.HEATHLAND,
  [PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.PONDS_LAKES,
  [PROJECT_STEPS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.ARABLE_LAND,
  [PROJECT_STEPS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED]:
    ROUTES.PROJECT.EDIT.COMPREHENSIVE_RESTORATION,
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE]:
    ROUTES.PROJECT.EDIT.PARTIAL_RESTORATION,
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL]:
    ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE,
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE]:
    ROUTES.PROJECT.OVERVIEW
}

// Map gate steps to their route paths
const GATE_STEP_TO_ROUTE_MAP = {
  [PROJECT_STEPS.INTERTIDAL_HABITAT]: ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT,
  [PROJECT_STEPS.WOODLAND]: ROUTES.PROJECT.EDIT.WOODLAND,
  [PROJECT_STEPS.WET_WOODLAND]: ROUTES.PROJECT.EDIT.WET_WOODLAND,
  [PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND]:
    ROUTES.PROJECT.EDIT.WETLAND_OR_WET_GRASSLAND,
  [PROJECT_STEPS.GRASSLAND]: ROUTES.PROJECT.EDIT.GRASSLAND,
  [PROJECT_STEPS.HEATHLAND]: ROUTES.PROJECT.EDIT.HEATHLAND,
  [PROJECT_STEPS.PONDS_LAKES]: ROUTES.PROJECT.EDIT.PONDS_LAKES,
  [PROJECT_STEPS.ARABLE_LAND]: ROUTES.PROJECT.EDIT.ARABLE_LAND,
  [PROJECT_STEPS.COMPREHENSIVE_RESTORATION]:
    ROUTES.PROJECT.EDIT.COMPREHENSIVE_RESTORATION,
  [PROJECT_STEPS.PARTIAL_RESTORATION]: ROUTES.PROJECT.EDIT.PARTIAL_RESTORATION,
  [PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE]:
    ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE
}

/**
 * Get footer HTML text if it exists in translations
 */
function _getFooterHtml(request) {
  const footerKey = 'projects.environmental_benefits.footer.html_text'
  const footerHtml = request.t(footerKey)
  return footerHtml === footerKey ? null : footerHtml
}

/**
 * Environmental Benefits Controller
 * Handles both radio (yes/no gate) and input (quantity) field pages
 */
class EnvironmentalBenefitsController {
  _getConfig(step) {
    return ENVIRONMENTAL_BENEFITS_CONFIG[step]
  }

  _getPayloadLevel(step) {
    return PAYLOAD_LEVEL_MAP[step]
  }

  _getNextRoute(step, referenceNumber, fieldValue) {
    const replaceRef = (route) =>
      route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)

    // Main environmental benefits gate question
    if (step === PROJECT_STEPS.ENVIRONMENTAL_BENEFITS) {
      return fieldValue === true
        ? replaceRef(ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT)
        : replaceRef(ROUTES.PROJECT.OVERVIEW)
    }

    // Gate question — yes goes to quantity, no goes to next gate or overview
    const gateIndex = GATE_SEQUENCE.indexOf(step)
    if (gateIndex !== -1) {
      if (fieldValue === true) {
        return replaceRef(GATE_TO_QUANTITY_MAP[step])
      }
      const nextGateStep = GATE_SEQUENCE[gateIndex + 1]
      return nextGateStep
        ? replaceRef(GATE_STEP_TO_ROUTE_MAP[nextGateStep])
        : replaceRef(ROUTES.PROJECT.OVERVIEW)
    }

    // Quantity question — go to next gate or overview
    return replaceRef(QUANTITY_TO_NEXT_GATE_MAP[step])
  }

  _convertBooleanToRadioValue(booleanValue) {
    if (booleanValue === true) {
      return RADIO_VALUE_YES
    }
    if (booleanValue === false) {
      return RADIO_VALUE_NO
    }
    return booleanValue
  }

  _buildRadioItems(request, config, currentValue) {
    const translationKey = `${config.localKeyPrefix}.options`
    const valueForRadio = this._convertBooleanToRadioValue(currentValue)

    return buildRadioItems(request.t, translationKey, null, valueForRadio, {
      useHints: false,
      useBoldLabels: false,
      inline: true
    })
  }

  _getSuffix(request, config) {
    const suffixKey = `${config.localKeyPrefix}.suffix`
    const suffix = request.t(suffixKey)
    return suffix === suffixKey ? null : suffix
  }

  _normalizeFieldValue(fieldValue, fieldType) {
    // Convert radio button yes/no string values to boolean
    if (fieldType === 'radio') {
      if (fieldValue === RADIO_VALUE_YES) {
        return true
      }
      if (fieldValue === RADIO_VALUE_NO) {
        return false
      }
    }

    // Convert input values to number for quantity fields
    if (fieldType === 'input' && fieldValue !== null && fieldValue !== '') {
      return Number(fieldValue)
    }

    return fieldValue
  }

  _buildPayload(fieldName, fieldValue, config, projectData) {
    const payload = { [fieldName]: fieldValue }

    // Include gate field in payload for quantity validation/submission
    if (config.gateField) {
      payload[config.gateField] = projectData[config.gateField]
    }

    return payload
  }

  _enrichViewDataForFieldType(viewData, request, config, fieldValue) {
    const { fieldType } = config

    if (fieldType === 'radio') {
      return {
        ...viewData,
        radioItems: this._buildRadioItems(request, config, fieldValue)
      }
    }

    if (fieldType === 'input') {
      return {
        ...viewData,
        suffix: this._getSuffix(request, config),
        inputValue: fieldValue
      }
    }

    return viewData
  }

  _getViewData(request) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const sessionData = getSessionData(request)
    const { fieldName, fieldType, localKeyPrefix, backLinkOptions } = config
    const fieldValue = sessionData[fieldName]

    const additionalData = {
      step,
      fieldType,
      fieldName
    }

    let viewData = buildViewData(request, {
      localKeyPrefix,
      backLinkOptions,
      formData: sessionData,
      additionalData
    })

    // Enrich view data based on field type
    viewData = this._enrichViewDataForFieldType(
      viewData,
      request,
      config,
      fieldValue
    )

    // Add footer HTML if present
    const footerHtml = _getFooterHtml(request)
    if (footerHtml) {
      viewData.footerHtml = footerHtml
    }

    return viewData
  }

  _buildErrorViewData(request, fieldErrors) {
    const viewData = this._getViewData(request)
    return { ...viewData, fieldErrors }
  }

  _handleValidationError(h, request, fieldErrors) {
    const viewData = this._buildErrorViewData(request, fieldErrors)
    return h.view(VIEW, viewData)
  }

  async get(request, h) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const sessionData = getSessionData(request)
    const { slug: referenceNumber } = sessionData

    if (!config) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    return h.view(VIEW, this._getViewData(request))
  }

  async post(request, h) {
    const step = getProjectStep(request)
    const config = this._getConfig(step)
    const sessionData = getSessionData(request)
    const projectData = request.pre?.projectData || sessionData
    const { slug: referenceNumber } = sessionData

    if (!config) {
      return navigateToProjectOverview(referenceNumber, h)
    }

    const { fieldName, fieldType, schema } = config
    const fieldValue = this._normalizeFieldValue(
      request.payload[fieldName],
      fieldType
    )

    // Build payload for validation
    const validationPayload = this._buildPayload(
      fieldName,
      fieldValue,
      config,
      projectData
    )

    // Validate the payload
    const { error } = schema.validate(validationPayload, { abortEarly: false })

    if (error) {
      const fieldErrors = extractJoiErrors(error)
      return this._handleValidationError(h, request, fieldErrors)
    }

    // Update session data
    updateSessionData(request, { [fieldName]: fieldValue })

    // Save to API
    const validationLevel = this._getPayloadLevel(step)
    const viewData = this._getViewData(request)
    const response = await saveProjectWithErrorHandling(
      request,
      h,
      validationLevel,
      viewData,
      VIEW,
      validationPayload
    )

    if (response) {
      return response
    }

    // Redirect to next step
    return h
      .redirect(this._getNextRoute(step, referenceNumber, fieldValue))
      .takeover()
  }
}

const controller = new EnvironmentalBenefitsController()

export const environmentalBenefitsController = {
  getHandler: (request, h) => controller.get(request, h),
  postHandler: (request, h) => controller.post(request, h)
}
