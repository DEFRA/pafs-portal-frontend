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
  validateEarliestStartDate
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
  ]
}
