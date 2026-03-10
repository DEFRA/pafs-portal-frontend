/**
 * Project Validation Schemas - Backward Compatible Entry Point
 *
 * This file maintains backward compatibility by re-exporting from the modular structure.
 * The actual validation schemas are now organized in separate files by feature area
 * to keep each file under SonarQube's 500-line limit.
 *
 * All existing imports will continue to work without changes.
 */

export {
  validateProjectName,
  validateAreaId,
  validateProjectType,
  validateProjectInterventionTypes,
  validateMainInterventionType,
  validateFinancialStartYear,
  validateFinancialEndYear
} from './schemas/core-schemas.js'

export {
  validateStartOutlineBusinessCase,
  validateCompleteOutlineBusinessCase,
  validateAwardMainContract,
  validateStartWork,
  validateStartBenefits,
  validateCouldStartEarlier,
  validateEarliestStartDate
} from './schemas/important-dates-schemas.js'

export {
  validateRisks,
  validateMainRisk,
  validatePropertyAffectedFlooding,
  validatePropertyAffectedCoastalErosion,
  validateTwentyPercentDeprived,
  validateFortyPercentDeprived,
  validateCurrentFloodFluvialRisk,
  validateCurrentFloodSurfaceWaterRisk,
  validateCurrentCoastalErosionRisk
} from './schemas/risk-properties-schemas.js'

export {
  validateProjectGoals,
  validateUrgencyReason,
  validateUrgencyDetails,
  validateConfidenceHomesBetterProtected,
  validateConfidenceHomesByGatewayFour,
  validateConfidenceSecuredPartnershipFunding
} from './schemas/goals-confidence-schemas.js'

export {
  validateEnvironmentalBenefits,
  validateIntertidalHabitat,
  validateHectaresOfIntertidalHabitatCreatedOrEnhanced,
  validateWoodland,
  validateHectaresOfWoodlandHabitatCreatedOrEnhanced,
  validateWetWoodland,
  validateHectaresOfWetWoodlandHabitatCreatedOrEnhanced,
  validateWetlandOrWetGrassland,
  validateHectaresOfWetlandOrWetGrasslandCreatedOrEnhanced,
  validateGrassland,
  validateHectaresOfGrasslandHabitatCreatedOrEnhanced,
  validateHeathland,
  validateHectaresOfHeathlandCreatedOrEnhanced,
  validatePondsLakes,
  validateHectaresOfPondOrLakeHabitatCreatedOrEnhanced,
  validateArableLand,
  validateHectaresOfArableLandLakeHabitatCreatedOrEnhanced,
  validateComprehensiveRestoration,
  validateKilometresOfWatercourseEnhancedOrCreatedComprehensive,
  validatePartialRestoration,
  validateKilometresOfWatercourseEnhancedOrCreatedPartial,
  validateCreateHabitatWatercourse,
  validateKilometresOfWatercourseEnhancedOrCreatedSingle
} from './schemas/environmental-benefits-schemas.js'

export {
  nfmSelectedMeasuresSchema,
  nfmRiverRestorationSchema,
  nfmLeakyBarriersSchema,
  nfmOfflineStorageSchema,
  nfmWoodlandSchema,
  nfmHeadwaterDrainageSchema,
  nfmRunoffManagementSchema,
  nfmSaltmarshSchema,
  nfmSandDuneSchema
} from './schemas/nfm-schemas.js'
