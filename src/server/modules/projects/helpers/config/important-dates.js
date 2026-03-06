import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  validateStartOutlineBusinessCase,
  validateCompleteOutlineBusinessCase,
  validateAwardMainContract,
  validateStartWork,
  validateStartBenefits,
  validateCouldStartEarlier,
  validateEarliestStartDate
} from '../../schema.js'

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
