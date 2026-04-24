import { PROJECT_VIEWS } from '../../../common/constants/common.js'
import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS,
  REFERENCE_NUMBER_PARAM
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import { getProjectStep } from '../helpers/project-utils.js'
import {
  CARBON_STEP_SCHEMAS,
  ALL_CARBON_FIELDS
} from '../schemas/carbon-impact-schema.js'

export const VIEW = PROJECT_VIEWS.CARBON_IMPACT

/**
 * Carbon field name list — the 6 inputs on the form.
 */
const CARBON_FIELDS = ALL_CARBON_FIELDS

/**
 * Map step to view name and local key prefix
 */
export const STEP_TO_CONFIG = {
  [PROJECT_STEPS.CARBON_IMPACT]: {
    view: PROJECT_VIEWS.CARBON_IMPACT,
    localKeyPrefix: 'projects.carbon_impact'
  },
  [PROJECT_STEPS.CARBON_REQUIRED_INFORMATION]: {
    view: PROJECT_VIEWS.CARBON_REQUIRED_INFORMATION,
    localKeyPrefix: 'projects.carbon_required_information'
  },
  [PROJECT_STEPS.CARBON_PREPARE]: {
    view: PROJECT_VIEWS.CARBON_PREPARE,
    localKeyPrefix: 'projects.carbon_prepare'
  },
  [PROJECT_STEPS.CARBON_COST_BUILD]: {
    view: PROJECT_VIEWS.SINGLE_INPUT,
    localKeyPrefix: 'projects.carbon_cost_build',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD,
    inputType: 'suffix',
    introCount: 3,
    afterCount: 2
  },
  [PROJECT_STEPS.CARBON_COST_OPERATION]: {
    view: PROJECT_VIEWS.SINGLE_INPUT,
    localKeyPrefix: 'projects.carbon_cost_operation',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION,
    inputType: 'suffix',
    introCount: 3,
    afterCount: 3
  },
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]: {
    view: PROJECT_VIEWS.SINGLE_INPUT,
    localKeyPrefix: 'projects.carbon_cost_sequestered',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED,
    inputType: 'suffix',
    introCount: 3,
    afterCount: 1
  },
  [PROJECT_STEPS.CARBON_COST_AVOIDED]: {
    view: PROJECT_VIEWS.SINGLE_INPUT,
    localKeyPrefix: 'projects.carbon_cost_avoided',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED,
    inputType: 'suffix',
    introCount: 3,
    afterCount: 1,
    hasIntroLink: true
  },
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]: {
    view: PROJECT_VIEWS.SINGLE_INPUT,
    localKeyPrefix: 'projects.carbon_savings_net_economic_benefit',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
    inputType: 'prefix',
    introCount: 3,
    afterCount: 1,
    hasIntroLink: true,
    hasIntroLinkSuffix: true
  },
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]: {
    view: PROJECT_VIEWS.SINGLE_INPUT,
    localKeyPrefix: 'projects.carbon_operational_cost_forecast',
    fieldName: PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST,
    inputType: 'prefix',
    introCount: 2,
    afterCount: 1
  },
  [PROJECT_STEPS.WHOLE_LIFE_CARBON]: {
    view: PROJECT_VIEWS.CALCULATED_DISPLAY,
    localKeyPrefix: 'projects.carbon_whole_life_carbon',
    displayValueKey: 'wholeLifeCarbon',
    isDisplay: true
  },
  [PROJECT_STEPS.NET_CARBON]: {
    view: PROJECT_VIEWS.CALCULATED_DISPLAY,
    localKeyPrefix: 'projects.carbon_net_carbon',
    displayValueKey: 'netCarbon',
    isDisplay: true
  },
  [PROJECT_STEPS.CARBON_SUMMARY]: {
    view: PROJECT_VIEWS.CARBON_SUMMARY,
    localKeyPrefix: 'projects.carbon_impact_summary',
    isDisplay: true
  },
  [PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT]: {
    view: PROJECT_VIEWS.CARBON_IMPACT_ASSESSMENT,
    localKeyPrefix: 'projects.carbon_impact',
    isDisplay: true
  }
}

/**
 * Navigation sequence for input pages
 */
export const INPUT_PAGE_SEQUENCE = [
  PROJECT_STEPS.CARBON_COST_BUILD,
  PROJECT_STEPS.CARBON_COST_OPERATION,
  PROJECT_STEPS.CARBON_COST_SEQUESTERED,
  PROJECT_STEPS.CARBON_COST_AVOIDED,
  PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST
]

/**
 * Complete page sequence including input and display pages
 * Determines navigation flow through the carbon impact wizard
 */
const FULL_PAGE_SEQUENCE = [
  PROJECT_STEPS.CARBON_COST_BUILD,
  PROJECT_STEPS.CARBON_COST_OPERATION,
  PROJECT_STEPS.WHOLE_LIFE_CARBON,
  PROJECT_STEPS.CARBON_COST_SEQUESTERED,
  PROJECT_STEPS.CARBON_COST_AVOIDED,
  PROJECT_STEPS.NET_CARBON,
  PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST,
  PROJECT_STEPS.CARBON_SUMMARY,
  PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT
]

export const DISPLAY_PAGE_SEQUENCE = new Set([
  PROJECT_STEPS.WHOLE_LIFE_CARBON,
  PROJECT_STEPS.NET_CARBON,
  PROJECT_STEPS.CARBON_SUMMARY,
  PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT
])

/**
 * Map each input step to its per-step Joi validation schema.
 * Keyed by step name; value is the schema from CARBON_STEP_SCHEMAS.
 */
export const STEP_SCHEMA_MAP = {
  [PROJECT_STEPS.CARBON_COST_BUILD]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_BUILD],
  [PROJECT_STEPS.CARBON_COST_OPERATION]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_OPERATION],
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_SEQUESTERED],
  [PROJECT_STEPS.CARBON_COST_AVOIDED]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_COST_AVOIDED],
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
    CARBON_STEP_SCHEMAS[
      PROJECT_PAYLOAD_FIELDS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT
    ],
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]:
    CARBON_STEP_SCHEMAS[PROJECT_PAYLOAD_FIELDS.CARBON_OPERATIONAL_COST_FORECAST]
}

/**
 * Map each input step to its API payload level for database persistence.
 */
export const STEP_PAYLOAD_LEVEL_MAP = {
  [PROJECT_STEPS.CARBON_COST_BUILD]: PROJECT_PAYLOAD_LEVELS.CARBON_COST_BUILD,
  [PROJECT_STEPS.CARBON_COST_OPERATION]:
    PROJECT_PAYLOAD_LEVELS.CARBON_COST_OPERATION,
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]:
    PROJECT_PAYLOAD_LEVELS.CARBON_COST_SEQUESTERED,
  [PROJECT_STEPS.CARBON_COST_AVOIDED]:
    PROJECT_PAYLOAD_LEVELS.CARBON_COST_AVOIDED,
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
    PROJECT_PAYLOAD_LEVELS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]:
    PROJECT_PAYLOAD_LEVELS.CARBON_OPERATIONAL_COST_FORECAST
}

export const getStep = (request) => {
  if (!request?.route?.path) {
    return PROJECT_STEPS.CARBON_COST_BUILD
  }
  return getProjectStep(request)
}

export const hasCarbonPrerequisites = (sessionData = {}) => {
  return (
    sessionData[PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH] != null &&
    sessionData[PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR] != null &&
    sessionData[PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH] != null &&
    sessionData[PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR] != null
  )
}

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'Not provided'
  }

  const numericValue = Number(String(value).replaceAll(',', ''))
  if (Number.isNaN(numericValue)) {
    return 'Not provided'
  }

  return `£${new Intl.NumberFormat('en-GB').format(numericValue)}`
}

/**
 * Get next route for a given step
 */
export const getNextRouteForStep = (step, referenceNumber) => {
  const pageIndex = FULL_PAGE_SEQUENCE.indexOf(step)
  if (pageIndex !== -1 && pageIndex < FULL_PAGE_SEQUENCE.length - 1) {
    const nextStep = FULL_PAGE_SEQUENCE[pageIndex + 1]
    return getRouteForStep(nextStep, referenceNumber)
  }

  // If at the last page in sequence, redirect to overview
  return ROUTES.PROJECT.OVERVIEW.replace(
    REFERENCE_NUMBER_PARAM,
    referenceNumber
  )
}

const STEP_TO_ROUTE_MAP = {
  [PROJECT_STEPS.CARBON_REQUIRED_INFORMATION]:
    ROUTES.PROJECT.EDIT.CARBON_REQUIRED_INFORMATION,
  [PROJECT_STEPS.CARBON_PREPARE]: ROUTES.PROJECT.EDIT.CARBON_PREPARE,
  [PROJECT_STEPS.CARBON_COST_BUILD]: ROUTES.PROJECT.EDIT.CARBON_COST_BUILD,
  [PROJECT_STEPS.CARBON_COST_OPERATION]:
    ROUTES.PROJECT.EDIT.CARBON_COST_OPERATION,
  [PROJECT_STEPS.CARBON_COST_SEQUESTERED]:
    ROUTES.PROJECT.EDIT.CARBON_COST_SEQUESTERED,
  [PROJECT_STEPS.CARBON_COST_AVOIDED]: ROUTES.PROJECT.EDIT.CARBON_COST_AVOIDED,
  [PROJECT_STEPS.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT]:
    ROUTES.PROJECT.EDIT.CARBON_SAVINGS_NET_ECONOMIC_BENEFIT,
  [PROJECT_STEPS.CARBON_OPERATIONAL_COST_FORECAST]:
    ROUTES.PROJECT.EDIT.CARBON_OPERATIONAL_COST_FORECAST,
  [PROJECT_STEPS.WHOLE_LIFE_CARBON]: ROUTES.PROJECT.EDIT.WHOLE_LIFE_CARBON,
  [PROJECT_STEPS.NET_CARBON]: ROUTES.PROJECT.EDIT.NET_CARBON,
  [PROJECT_STEPS.CARBON_SUMMARY]: ROUTES.PROJECT.EDIT.CARBON_SUMMARY,
  [PROJECT_STEPS.CARBON_IMPACT_ASSESSMENT]:
    ROUTES.PROJECT.EDIT.CARBON_IMPACT_ASSESSMENT
}

/**
 * Get route URL for a given step
 */
export const getRouteForStep = (step, referenceNumber) => {
  const route = STEP_TO_ROUTE_MAP[step] || ROUTES.PROJECT.OVERVIEW

  return route.replace(REFERENCE_NUMBER_PARAM, referenceNumber)
}

export const getCarbonFields = () => CARBON_FIELDS
