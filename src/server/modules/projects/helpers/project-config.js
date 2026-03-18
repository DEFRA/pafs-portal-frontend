/**
 * Main configuration file that re-exports all project configurations
 * This file has been split into smaller modules for better maintainability
 */

// Re-export project types configuration
export {
  PROJECT_TYPES_CONFIG,
  interventionTypesLocalKeyPrefix,
  projectTypesLocalKeyPrefix
} from './config/project-types.js'

// Re-export financial year configuration
export {
  FINANCIAL_YEAR_CONFIG,
  financialYearStartLocalKeyPrefix,
  financialYearStartManualLocalKeyPrefix,
  financialYearEndLocalKeyPrefix,
  financialYearEndManualLocalKeyPrefix
} from './config/financial-year.js'

// Re-export important dates configuration
export { IMPORTANT_DATES_CONFIG } from './config/important-dates.js'

// Re-export risk and properties configuration
export { RISK_AND_PROPERTIES_CONFIG } from './config/risk-properties.js'

// Re-export goals, urgency, and confidence configuration
export { GOALS_URGENCY_CONFIDENCE_CONFIG } from './config/goals-urgency-confidence.js'

// Re-export environmental benefits configuration
export {
  ENVIRONMENTAL_BENEFITS_CONFIG,
  ENVIRONMENTAL_BENEFITS_FIELD_PAIRS
} from './config/environmental-benefits.js'

// Re-export NFM configuration
export { NFM_CONFIG } from './config/nfm.js'

// Re-export payload level fields
export { PROJECT_PAYLOAD_LEVEL_FIELDS } from './config/payload-levels.js'
