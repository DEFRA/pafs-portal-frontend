import {
  PROJECT_PAYLOAD_FIELDS,
  PROJECT_STEPS
} from '../../../../common/constants/projects.js'
import { ROUTES } from '../../../../common/constants/routes.js'
import {
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
} from '../../schema.js'

/**
 * Configuration for environmental benefits section
 * Includes gate (yes/no) and quantity fields for each habitat type
 */
export const ENVIRONMENTAL_BENEFITS_CONFIG = {
  [PROJECT_STEPS.ENVIRONMENTAL_BENEFITS]: {
    localKeyPrefix: 'projects.environmental_benefits.environmental_benefits',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      conditionalRedirect: true
    },
    schema: validateEnvironmentalBenefits,
    fieldName: PROJECT_PAYLOAD_FIELDS.ENVIRONMENTAL_BENEFITS,
    fieldType: 'radio'
  },
  [PROJECT_STEPS.INTERTIDAL_HABITAT]: {
    localKeyPrefix: 'projects.environmental_benefits.intertidal_habitat',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.ENVIRONMENTAL_BENEFITS,
      conditionalRedirect: false
    },
    schema: validateIntertidalHabitat,
    fieldName: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_intertidal_habitat_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.INTERTIDAL_HABITAT,
      conditionalRedirect: false
    },
    schema: validateHectaresOfIntertidalHabitatCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT
  },
  [PROJECT_STEPS.WOODLAND]: {
    localKeyPrefix: 'projects.environmental_benefits.woodland',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateWoodland,
    fieldName: PROJECT_PAYLOAD_FIELDS.WOODLAND,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_woodland_habitat_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.WOODLAND,
      conditionalRedirect: false
    },
    schema: validateHectaresOfWoodlandHabitatCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.WOODLAND
  },
  [PROJECT_STEPS.WET_WOODLAND]: {
    localKeyPrefix: 'projects.environmental_benefits.wet_woodland',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateWetWoodland,
    fieldName: PROJECT_PAYLOAD_FIELDS.WET_WOODLAND,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_wet_woodland_habitat_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.WET_WOODLAND,
      conditionalRedirect: false
    },
    schema: validateHectaresOfWetWoodlandHabitatCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.WET_WOODLAND
  },
  [PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND]: {
    localKeyPrefix: 'projects.environmental_benefits.wetland_or_wet_grassland',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT
          .HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateWetlandOrWetGrassland,
    fieldName: PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_wetland_or_wet_grassland_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.WETLAND_OR_WET_GRASSLAND,
      conditionalRedirect: false
    },
    schema: validateHectaresOfWetlandOrWetGrasslandCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND
  },
  [PROJECT_STEPS.GRASSLAND]: {
    localKeyPrefix: 'projects.environmental_benefits.grassland',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT
          .HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateGrassland,
    fieldName: PROJECT_PAYLOAD_FIELDS.GRASSLAND,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_grassland_habitat_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.GRASSLAND,
      conditionalRedirect: false
    },
    schema: validateHectaresOfGrasslandHabitatCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.GRASSLAND
  },
  [PROJECT_STEPS.HEATHLAND]: {
    localKeyPrefix: 'projects.environmental_benefits.heathland',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateHeathland,
    fieldName: PROJECT_PAYLOAD_FIELDS.HEATHLAND,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_heathland_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.HEATHLAND,
      conditionalRedirect: false
    },
    schema: validateHectaresOfHeathlandCreatedOrEnhanced,
    fieldName: PROJECT_PAYLOAD_FIELDS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.HEATHLAND
  },
  [PROJECT_STEPS.PONDS_LAKES]: {
    localKeyPrefix: 'projects.environmental_benefits.ponds_lakes',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validatePondsLakes,
    fieldName: PROJECT_PAYLOAD_FIELDS.PONDS_LAKES,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_pond_or_lake_habitat_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PONDS_LAKES,
      conditionalRedirect: false
    },
    schema: validateHectaresOfPondOrLakeHabitatCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.PONDS_LAKES
  },
  [PROJECT_STEPS.ARABLE_LAND]: {
    localKeyPrefix: 'projects.environmental_benefits.arable_land',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT
          .HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateArableLand,
    fieldName: PROJECT_PAYLOAD_FIELDS.ARABLE_LAND,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED]: {
    localKeyPrefix:
      'projects.environmental_benefits.hectares_of_arable_land_lake_habitat_created_or_enhanced',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.ARABLE_LAND,
      conditionalRedirect: false
    },
    schema: validateHectaresOfArableLandLakeHabitatCreatedOrEnhanced,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.ARABLE_LAND
  },
  [PROJECT_STEPS.COMPREHENSIVE_RESTORATION]: {
    localKeyPrefix: 'projects.environmental_benefits.comprehensive_restoration',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT
          .HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
      conditionalRedirect: false
    },
    schema: validateComprehensiveRestoration,
    fieldName: PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE]: {
    localKeyPrefix:
      'projects.environmental_benefits.kilometres_of_watercourse_enhanced_or_created_comprehensive',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.COMPREHENSIVE_RESTORATION,
      conditionalRedirect: false
    },
    schema: validateKilometresOfWatercourseEnhancedOrCreatedComprehensive,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION
  },
  [PROJECT_STEPS.PARTIAL_RESTORATION]: {
    localKeyPrefix: 'projects.environmental_benefits.partial_restoration',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT
          .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
      conditionalRedirect: false
    },
    schema: validatePartialRestoration,
    fieldName: PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL]: {
    localKeyPrefix:
      'projects.environmental_benefits.kilometres_of_watercourse_enhanced_or_created_partial',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.PARTIAL_RESTORATION,
      conditionalRedirect: false
    },
    schema: validateKilometresOfWatercourseEnhancedOrCreatedPartial,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION
  },
  [PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE]: {
    localKeyPrefix:
      'projects.environmental_benefits.create_habitat_watercourse',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL:
        ROUTES.PROJECT.EDIT
          .KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
      conditionalRedirect: false
    },
    schema: validateCreateHabitatWatercourse,
    fieldName: PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE,
    fieldType: 'radio',
    gateField: ''
  },
  [PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE]: {
    localKeyPrefix:
      'projects.environmental_benefits.kilometres_of_watercourse_enhanced_or_created_single',
    backLinkOptions: {
      targetURL: ROUTES.PROJECT.OVERVIEW,
      targetEditURL: ROUTES.PROJECT.EDIT.CREATE_HABITAT_WATERCOURSE,
      conditionalRedirect: false
    },
    schema: validateKilometresOfWatercourseEnhancedOrCreatedSingle,
    fieldName:
      PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE,
    fieldType: 'input',
    gateField: PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE
  }
}

/**
 * Environmental benefits field pairs (gate and quantity)
 * Used for conditional routing and validation
 */
export const ENVIRONMENTAL_BENEFITS_FIELD_PAIRS = [
  {
    gate: PROJECT_PAYLOAD_FIELDS.INTERTIDAL_HABITAT,
    gateStep: PROJECT_STEPS.INTERTIDAL_HABITAT,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED,
    quantityStep:
      PROJECT_STEPS.HECTARES_OF_INTERTIDAL_HABITAT_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.WOODLAND,
    gateStep: PROJECT_STEPS.WOODLAND,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
    quantityStep: PROJECT_STEPS.HECTARES_OF_WOODLAND_HABITAT_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.WET_WOODLAND,
    gateStep: PROJECT_STEPS.WET_WOODLAND,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED,
    quantityStep:
      PROJECT_STEPS.HECTARES_OF_WET_WOODLAND_HABITAT_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.WETLAND_OR_WET_GRASSLAND,
    gateStep: PROJECT_STEPS.WETLAND_OR_WET_GRASSLAND,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED,
    quantityStep:
      PROJECT_STEPS.HECTARES_OF_WETLAND_OR_WET_GRASSLAND_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.GRASSLAND,
    gateStep: PROJECT_STEPS.GRASSLAND,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED,
    quantityStep:
      PROJECT_STEPS.HECTARES_OF_GRASSLAND_HABITAT_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.HEATHLAND,
    gateStep: PROJECT_STEPS.HEATHLAND,
    quantity: PROJECT_PAYLOAD_FIELDS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED,
    quantityStep: PROJECT_STEPS.HECTARES_OF_HEATHLAND_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.PONDS_LAKES,
    gateStep: PROJECT_STEPS.PONDS_LAKES,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED,
    quantityStep:
      PROJECT_STEPS.HECTARES_OF_POND_OR_LAKE_HABITAT_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.ARABLE_LAND,
    gateStep: PROJECT_STEPS.ARABLE_LAND,
    quantity:
      PROJECT_PAYLOAD_FIELDS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED,
    quantityStep:
      PROJECT_STEPS.HECTARES_OF_ARABLE_LAND_LAKE_HABITAT_CREATED_OR_ENHANCED
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.COMPREHENSIVE_RESTORATION,
    gateStep: PROJECT_STEPS.COMPREHENSIVE_RESTORATION,
    quantity:
      PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE,
    quantityStep:
      PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_COMPREHENSIVE
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.PARTIAL_RESTORATION,
    gateStep: PROJECT_STEPS.PARTIAL_RESTORATION,
    quantity:
      PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL,
    quantityStep:
      PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_PARTIAL
  },
  {
    gate: PROJECT_PAYLOAD_FIELDS.CREATE_HABITAT_WATERCOURSE,
    gateStep: PROJECT_STEPS.CREATE_HABITAT_WATERCOURSE,
    quantity:
      PROJECT_PAYLOAD_FIELDS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE,
    quantityStep:
      PROJECT_STEPS.KILOMETRES_OF_WATERCOURSE_ENHANCED_OR_CREATED_SINGLE
  }
]
