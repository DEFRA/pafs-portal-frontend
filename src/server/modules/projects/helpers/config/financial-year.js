import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
  validateFinancialEndYear,
  validateFinancialStartYear
} from '../../schema.js'

export const financialYearStartLocalKeyPrefix = 'projects.financial_year_start'
export const financialYearStartManualLocalKeyPrefix =
  'projects.financial_year_start_manual'
export const financialYearEndLocalKeyPrefix = 'projects.financial_year_end'
export const financialYearEndManualLocalKeyPrefix =
  'projects.financial_year_end_manual'

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
