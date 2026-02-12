import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_PAYLOAD_LEVELS,
  PROJECT_STEPS
} from '../../../common/constants/projects.js'
import { ROUTES } from '../../../common/constants/routes.js'
import {
  validateFinancialEndYear,
  validateFinancialStartYear,
  validateMainInterventionType,
  validateProjectInterventionTypes,
  validateProjectType,
  validateStartOutlineBusinessCase,
  validateCompleteOutlineBusinessCase,
  validateAwardMainContract,
  validateStartWork,
  validateStartBenefits,
  validateCouldStartEarlier,
  validateEarliestStartDate,
  validateRisks,
  validateMainRisk,
  validatePropertyAffectedFlooding,
  validatePropertyAffectedCoastalErosion,
  validateTwentyPercentDeprived,
  validateFortyPercentDeprived
} from '../schema.js'

export const interventionTypesLocalKeyPrefix = 'projects.intervention_type'
export const projectTypesLocalKeyPrefix = 'projects.project_type'
export const financialYearStartLocalKeyPrefix = 'projects.financial_year_start'
export const financialYearStartManualLocalKeyPrefix =
  'projects.financial_year_start_manual'
export const financialYearEndLocalKeyPrefix = 'projects.financial_year_end'
export const financialYearEndManualLocalKeyPrefix =
  'projects.financial_year_end_manual'

/**
 * Configuration for project type related steps
 */
export const PROJECT_TYPES_CONFIG = {
  [PROJECT_STEPS.TYPE]: {
    localKeyPrefix: projectTypesLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.AREA,
      conditionalRedirect: true
    },
    schema: validateProjectType
  },
  [PROJECT_STEPS.INTERVENTION_TYPE]: {
    localKeyPrefix: interventionTypesLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.TYPE,
      targetEditURL: ROUTES.PROJECT.EDIT.TYPE,
      conditionalRedirect: false
    },
    schema: validateProjectInterventionTypes
  },
  [PROJECT_STEPS.PRIMARY_INTERVENTION_TYPE]: {
    localKeyPrefix: 'projects.primary_intervention_type',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.INTERVENTION_TYPE,
      targetEditURL: ROUTES.PROJECT.EDIT.INTERVENTION_TYPE,
      conditionalRedirect: false
    },
    schema: validateMainInterventionType
  }
}

/**
 * Configuration for financial year related steps
 */
export const FINANCIAL_YEAR_CONFIG = {
  [PROJECT_STEPS.FINANCIAL_START_YEAR]: {
    localKeyPrefix: financialYearStartLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.TYPE,
      conditionalRedirect: true
    },
    schema: validateFinancialStartYear,
    fieldName: PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR
  },
  [PROJECT_STEPS.FINANCIAL_START_YEAR_MANUAL]: {
    localKeyPrefix: financialYearStartManualLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.TYPE,
      conditionalRedirect: true
    },
    schema: validateFinancialStartYear,
    fieldName: PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR
  },
  [PROJECT_STEPS.FINANCIAL_END_YEAR]: {
    localKeyPrefix: financialYearEndLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.FINANCIAL_START_YEAR,
      conditionalRedirect: true
    },
    schema: validateFinancialEndYear,
    fieldName: PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
  },
  [PROJECT_STEPS.FINANCIAL_END_YEAR_MANUAL]: {
    localKeyPrefix: financialYearEndManualLocalKeyPrefix,
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.FINANCIAL_START_YEAR,
      conditionalRedirect: true
    },
    schema: validateFinancialEndYear,
    fieldName: PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
  }
}

/**
 * Configuration for important dates related steps
 */
export const IMPORTANT_DATES_CONFIG = {
  [PROJECT_STEPS.START_OUTLINE_BUSINESS_CASE]: {
    localKeyPrefix: 'projects.important_dates.start_outline_business_case',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
      conditionalRedirect: true
    },
    schema: validateStartOutlineBusinessCase,
    monthField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
    fieldType: 'date'
  },
  [PROJECT_STEPS.COMPLETE_OUTLINE_BUSINESS_CASE]: {
    localKeyPrefix: 'projects.important_dates.complete_outline_business_case',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.START_OUTLINE_BUSINESS_CASE,
      conditionalRedirect: false
    },
    schema: validateCompleteOutlineBusinessCase,
    monthField: PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
    fieldType: 'date'
  },
  [PROJECT_STEPS.AWARD_MAIN_CONTRACT]: {
    localKeyPrefix: 'projects.important_dates.award_main_contract',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.COMPLETE_OUTLINE_BUSINESS_CASE,
      conditionalRedirect: false
    },
    schema: validateAwardMainContract,
    monthField: PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR,
    fieldType: 'date'
  },
  [PROJECT_STEPS.START_WORK]: {
    localKeyPrefix: 'projects.important_dates.expect_to_start_the_work',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.AWARD_MAIN_CONTRACT,
      conditionalRedirect: false
    },
    schema: validateStartWork,
    monthField: PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR,
    fieldType: 'date'
  },
  [PROJECT_STEPS.START_BENEFITS]: {
    localKeyPrefix: 'projects.important_dates.start_achieving_its_benefits',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.START_WORK,
      conditionalRedirect: false
    },
    schema: validateStartBenefits,
    monthField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR,
    fieldType: 'date'
  },
  [PROJECT_STEPS.COULD_START_EARLY]: {
    localKeyPrefix: 'projects.important_dates.could_start_earlier',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.START_BENEFITS,
      conditionalRedirect: false
    },
    schema: validateCouldStartEarlier,
    fieldName: PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.EARLIEST_START_DATE]: {
    localKeyPrefix: 'projects.important_dates.earliest_date',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.COULD_START_EARLY,
      conditionalRedirect: false
    },
    schema: validateEarliestStartDate,
    monthField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
    yearField: PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR,
    fieldType: 'date'
  }
}

export const PROJECT_PAYLOAD_LEVEL_FIELDS = {
  [PROJECT_PAYLOAD_LEVELS.INITIAL_SAVE]: [
    PROJECT_PAYLOAD_FIELDS.NAME,
    PROJECT_PAYLOAD_FIELDS.AREA_ID,
    PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE,
    PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES,
    PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE,
    PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR,
    PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.PROJECT_NAME]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.NAME
  ],
  [PROJECT_PAYLOAD_LEVELS.PROJECT_TYPE]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.PROJECT_TYPE,
    PROJECT_PAYLOAD_FIELDS.PROJECT_INTERVENTION_TYPES,
    PROJECT_PAYLOAD_FIELDS.MAIN_INTERVENTION_TYPE
  ],
  [PROJECT_PAYLOAD_LEVELS.FINANCIAL_START_YEAR]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.FINANCIAL_START_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.FINANCIAL_END_YEAR]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.FINANCIAL_END_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.START_OUTLINE_BUSINESS_CASE]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
    PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.COMPLETE_OUTLINE_BUSINESS_CASE]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_MONTH,
    PROJECT_PAYLOAD_FIELDS.START_OUTLINE_BUSINESS_CASE_YEAR,
    PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
    PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.AWARD_MAIN_CONTRACT]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_MONTH,
    PROJECT_PAYLOAD_FIELDS.COMPLETE_OUTLINE_BUSINESS_CASE_YEAR,
    PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
    PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.START_WORK]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_MONTH,
    PROJECT_PAYLOAD_FIELDS.AWARD_CONTRACT_YEAR,
    PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
    PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.START_BENEFITS]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_MONTH,
    PROJECT_PAYLOAD_FIELDS.START_CONSTRUCTION_YEAR,
    PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_MONTH,
    PROJECT_PAYLOAD_FIELDS.READY_FOR_SERVICE_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.COULD_START_EARLY]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY
  ],
  [PROJECT_PAYLOAD_LEVELS.EARLIEST_START_DATE]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.COULD_START_EARLY,
    PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_MONTH,
    PROJECT_PAYLOAD_FIELDS.EARLIEST_WITH_GIA_YEAR
  ],
  [PROJECT_PAYLOAD_LEVELS.RISK]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.RISKS,
    // Include property fields so they can be cleared when risks change
    PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK,
    PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS,
    PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS,
    PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50,
    PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE,
    PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK,
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL,
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION
  ],
  [PROJECT_PAYLOAD_LEVELS.MAIN_RISK]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.MAIN_RISK
  ],
  [PROJECT_PAYLOAD_LEVELS.PROPERTY_AFFECTED_FLOODING]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_RISK,
    PROJECT_PAYLOAD_FIELDS.MAINTAINING_EXISTING_ASSETS,
    PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_50_PLUS,
    PROJECT_PAYLOAD_FIELDS.REDUCING_FLOOD_RISK_LESS_50,
    PROJECT_PAYLOAD_FIELDS.INCREASING_FLOOD_RESILIENCE
  ],
  [PROJECT_PAYLOAD_LEVELS.PROPERTY_AFFECTED_COASTAL_EROSION]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.NO_PROPERTIES_AT_COASTAL_EROSION_RISK,
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_MAINTAINING_ASSETS_COASTAL,
    PROJECT_PAYLOAD_FIELDS.PROPERTIES_BENEFIT_INVESTMENT_COASTAL_EROSION
  ],
  [PROJECT_PAYLOAD_LEVELS.TWENTY_PERCENT_DEPRIVED]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_20_PERCENT_DEPRIVED
  ],
  [PROJECT_PAYLOAD_LEVELS.FORTY_PERCENT_DEPRIVED]: [
    PROJECT_PAYLOAD_FIELDS.REFERENCE_NUMBER,
    PROJECT_PAYLOAD_FIELDS.PERCENT_PROPERTIES_40_PERCENT_DEPRIVED
  ]
}

/**
 * Configuration for risk and properties benefitting related steps
 */
export const RISK_AND_PROPERTIES_CONFIG = {
  [PROJECT_STEPS.RISK]: {
    localKeyPrefix: 'projects.risk_and_properties.risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: validateRisks,
    fieldType: 'checkbox'
  },
  [PROJECT_STEPS.MAIN_RISK]: {
    localKeyPrefix: 'projects.risk_and_properties.main_risk',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.RISK,
      conditionalRedirect: false
    },
    schema: validateMainRisk,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.PROPERTY_AFFECTED_FLOODING]: {
    localKeyPrefix: 'projects.risk_and_properties.property_affected_flooding',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.MAIN_RISK,
      conditionalRedirect: false
    },
    schema: validatePropertyAffectedFlooding,
    fieldType: 'table'
  },
  [PROJECT_STEPS.PROPERTY_AFFECTED_COASTAL_EROSION]: {
    localKeyPrefix:
      'projects.risk_and_properties.property_affected_coastal_erosion',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_FLOODING,
      conditionalRedirect: false
    },
    schema: validatePropertyAffectedCoastalErosion,
    fieldType: 'table'
  },
  [PROJECT_STEPS.TWENTY_PERCENT_DEPRIVED]: {
    localKeyPrefix: 'projects.risk_and_properties.twenty_percent_deprived',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PROPERTY_AFFECTED_COASTAL_EROSION,
      conditionalRedirect: false
    },
    schema: validateTwentyPercentDeprived,
    fieldType: 'percentage'
  },
  [PROJECT_STEPS.FORTY_PERCENT_DEPRIVED]: {
    localKeyPrefix: 'projects.risk_and_properties.forty_percent_deprived',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.TWENTY_PERCENT_DEPRIVED,
      conditionalRedirect: false
    },
    schema: validateFortyPercentDeprived,
    fieldType: 'percentage'
  }
}
