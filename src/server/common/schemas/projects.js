/**
 * Project Schemas - Main Export Module
 *
 * This file consolidates all project-related Joi validation schemas by re-exporting
 * them from specialized schema modules. The schemas are organized into four categories:
 *
 * 1. Basic Schemas (project-basic-schemas.js):
 *    - Project reference number, name, area ID, type
 *    - Intervention type and main intervention type
 *
 * 2. Financial Schemas (project-financial-schemas.js):
 *    - Financial start year and end year validation
 *    - Financial year calculation helpers
 *
 * 3. Timeline Schemas (project-timeline-schemas.js):
 *    - Business case, contract, construction, and service timeline dates
 *    - Month/year validation with sequential ordering
 *
 * 4. Risk & Property Schemas (project-risk-property-schemas.js):
 *    - Risk types and main risk selection
 *    - Property counts for flooding and coastal erosion
 *    - Deprivation percentages and current risk levels
 *
 * This modular approach keeps each schema file under 500 lines for better
 * maintainability and SonarQube compliance.
 */

// Basic project field schemas
export {
  projectReferenceNumberSchema,
  projectNameSchema,
  projectAreaIdSchema,
  projectTypeSchema,
  projectInterventionTypeSchema,
  projectMainInterventionTypeSchema
} from './project-basic-schemas.js'

// Financial year schemas
export {
  projectFinancialStartYearSchema,
  projectFinancialEndYearSchema
} from './project-financial-schemas.js'

// Timeline and date schemas
export {
  startOutlineBusinessCaseMonthSchema,
  startOutlineBusinessCaseYearSchema,
  completeOutlineBusinessCaseMonthSchema,
  completeOutlineBusinessCaseYearSchema,
  awardContractMonthSchema,
  awardContractYearSchema,
  startConstructionMonthSchema,
  startConstructionYearSchema,
  readyForServiceMonthSchema,
  readyForServiceYearSchema,
  couldStartEarlySchema,
  earliestWithGiaMonthSchema,
  earliestWithGiaYearSchema
} from './project-timeline-schemas.js'

// Risk and property schemas
export {
  risksSchema,
  mainRiskSchema,
  noPropertiesAtRiskSchema,
  maintainingExistingAssetsSchema,
  reducingFloodRisk50PlusSchema,
  reducingFloodRiskLess50Schema,
  increasingFloodResilienceSchema,
  noPropertiesAtCoastalErosionRiskSchema,
  propertiesBenefitMaintainingAssetsCoastalSchema,
  propertiesBenefitInvestmentCoastalErosionSchema,
  percentProperties20PercentDeprivedSchema,
  percentProperties40PercentDeprivedSchema,
  currentFloodFluvialRiskSchema,
  currentFloodSurfaceWaterRiskSchema,
  currentCoastalErosionRiskSchema
} from './project-risk-property-schemas.js'
